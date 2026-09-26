/**
 * 写通道里**与场景无关**的纯函数与纯数据。
 *
 * 单独成文件的原因很实际：这些校验逻辑（f32 边界、颜色分量、路径解析）是"AI 传错参数"
 * 的唯一防线，但它们在 writeGuards / writeCore 里时被 `feng3d`、Vue 响应式等依赖缠住，
 * 只能靠端到端 fuzz 验证。搬到这里之后 `test/writePure.spec.ts` 可以直接覆盖它们。
 */

/**
 * 语义化材质字段 → StandardMaterial 的 uniforms 字段。
 *
 * 放在这里是为了让 `scene.add` 与 `scene.setMaterial` 共用同一份映射：两边各写一遍，
 * 迟早出现"add 时给的 glossiness 与 setMaterial 给的不是同一个 uniform"。
 */
export const MATERIAL_FIELD_MAP: Record<string, { uniform: string, color: boolean }> = {
    color: { uniform: 'u_diffuse', color: true },
    specular: { uniform: 'u_specular', color: true },
    ambient: { uniform: 'u_ambient', color: true },
    glossiness: { uniform: 'u_glossiness', color: false },
    reflectivity: { uniform: 'u_reflectivity', color: false },
    alphaThreshold: { uniform: 'u_alphaThreshold', color: false },
};

/**
 * 单个**字段值**的嵌套深度上限。
 *
 * 8 层对字段值是绰绰有余的（`position: { x, y, z }` 不过两层，颜色 `{ r, g, b, a }` 也是），
 * 超过它基本就是调用方传错了东西。
 */
export const MAX_VALUE_DEPTH = 8;

/**
 * 整棵**子树数据**的嵌套深度上限（`scene.import` 用）。
 *
 * 必须与 `MAX_VALUE_DEPTH` 分开：序列化出去的一棵正常场景树轻松超过 8 层
 * （对象 → `children` → 元素，每层对象就吃掉两级），沿用 8 的后果是**自己导出的数据自己导不回来**
 * ——实测默认场景在第 9 层就被拒收。这里给一个"正常场景远达不到、异常输入又一定能挡住"的量。
 */
export const MAX_DATA_DEPTH = 256;

/**
 * 批量方法的对象数上限。
 *
 * 限制不只是性能：一次动几百个对象的"撤销"本身也变得难以推理（用户按一次撤销会退回一大片）。
 */
export const MAX_BATCH_OBJECTS = 200;

/**
 * 校验批量方法的对象数，并给出**下一步怎么办**。
 *
 * 五个批量方法原先各写一遍字面量（200），改上限要改五处、错误信息也容易不一致。
 *
 * @param ids 待处理的对象 id 数组
 * @param method 出错信息里显示的方法名（如 `scene.setMany`）
 */
export function assertBatchSize(ids: readonly unknown[], method: string): void
{
    if (ids.length > MAX_BATCH_OBJECTS)
    {
        throw new Error(
            `${method} 一次最多 ${MAX_BATCH_OBJECTS} 个对象（收到 ${ids.length}）——拆成多次调用即可`,
        );
    }
}

/** 深拷贝纯数据值（场景数据均为 JSON 兼容，够用） */
export function cloneValue(value: unknown): unknown
{
    if (value === null || typeof value !== 'object') return value;

    try
    {
        return JSON.parse(JSON.stringify(value));
    }
    catch
    {
        return value; // 循环引用等极端情况：退化为浅引用（撤销时可能不精确，但不崩溃）
    }
}

/**
 * 取值的原始类型名（number / string / boolean），非原始类型返回 null。
 *
 * 仅用于写入前的类型防呆：`undefined` 无法判断，对象/数组形状多变，都不参与比较。
 */
export function primitiveTypeOf(value: unknown): string | null
{
    if (value === null || value === undefined) return null;
    const type = typeof value;

    return (type === 'number' || type === 'string' || type === 'boolean') ? type : null;
}

/**
 * 数字能否被 f32 表示（GPU 侧的实际精度）。
 *
 * `Number.isFinite` 不够：`1e39` 在 JS 里是有限数，转成 f32 就是 `Infinity`——写进 uniform 或
 * `clearValue` 之后，渲染端要么报 `clearValue is non-finite`（整页渲染不出来，实测踩过），
 * 要么静默 clamp 成极值。桥接层统一用这个判据，把"JS 里合法、GPU 侧非法"的值挡在写入口。
 */
export function isFiniteF32(value: number): boolean
{
    return Number.isFinite(value) && Number.isFinite(Math.fround(value));
}

/**
 * 递归校验写入值里的所有数字。
 *
 * 只查"能不能被 f32 表示"与嵌套深度：类型是否合理由 `prepareSet` 的防呆负责，
 * 这里专治"单个字段看着合法、藏在对象里才出问题"的情形（`position: { x: 1e39 }`）。
 *
 * 深度上限取 `MAX_VALUE_DEPTH`——面向**单个字段值**。要校验一整棵子树用
 * `assertFiniteNumbersInTree`（两者深度上限不同，原因见那个常量）。
 *
 * @param value 待写入的值
 * @param path 出错信息里显示的字段路径
 */
export function assertFiniteNumbers(value: unknown, path: string): void
{
    walkFiniteNumbers(value, path, 0, MAX_VALUE_DEPTH);
}

/**
 * 校验**整棵子树数据**里的数字（`scene.import` 用）。
 *
 * 与 `assertFiniteNumbers` 分开是必须的：`scene.import` 收到的是 `scene.export` 的产物，
 * 一棵正常场景树远超 8 层——用字段值的上限会把"自己导出的数据"判为非法，
 * 于是 `export → import` 这条往返路**整条走不通**（实测默认场景在第 9 层被拒）。
 *
 * @param value 待导入的对象字面量（或其数组）
 * @param path 出错信息里显示的字段路径
 */
export function assertFiniteNumbersInTree(value: unknown, path: string): void
{
    walkFiniteNumbers(value, path, 0, MAX_DATA_DEPTH);
}

/**
 * 找出数据里带 `Scene` 组件的节点，返回它的字段路径（没有则返回 `undefined`）。
 *
 * 为什么必须拦：`scene.export` 导出整棵场景时，根节点带一个 `Scene` 组件。把这份数据再
 * `scene.import` 回来会得到**第二个场景**，而引擎里 `SceneLogic extends ComponentLogicBase`
 * ——它没有 Object3D 的变换 API（`local2world` 等）。导入树的父子链一旦走到这个节点，
 * 计算世界矩阵时就会拿到 `undefined`，抛出的是
 * `Cannot read properties of undefined (reading 'elements')` 这种**指不到源头**的报错，
 * 而且此时对象已经挂进场景、留成脏数据。
 *
 * 所以这里提前拒绝，把"导出了场景根、又导入回来"这个退化用法变成一句能照着做的话。
 *
 * @param value 待导入的对象字面量（或其数组）
 * @param path 出错信息里显示的字段路径
 * @returns 带 `Scene` 组件的节点路径
 */
export function findSceneComponentPath(value: unknown, path: string): string | undefined
{
    if (Array.isArray(value))
    {
        for (let i = 0; i < value.length; i++)
        {
            const found = findSceneComponentPath(value[i], `${path}[${i}]`);
            if (found) return found;
        }

        return undefined;
    }
    if (value === null || typeof value !== 'object') return undefined;

    const record = value as { __type__?: unknown, components?: unknown };
    if (record.__type__ === 'Scene') return path;
    if (Array.isArray(record.components))
    {
        for (let i = 0; i < record.components.length; i++)
        {
            const component = record.components[i] as { __type__?: unknown } | null;
            if (component?.__type__ === 'Scene') return `${path}.components[${i}]`;
        }
    }

    for (const [key, item] of Object.entries(value))
    {
        if (key === 'components') continue;
        const found = findSceneComponentPath(item, `${path}.${key}`);
        if (found) return found;
    }

    return undefined;
}

/**
 * 数字校验的公共遍历。
 *
 * @param value 当前节点
 * @param path 出错信息里显示的字段路径
 * @param depth 当前嵌套深度
 * @param maxDepth 深度上限（超过即拒绝）
 */
function walkFiniteNumbers(value: unknown, path: string, depth: number, maxDepth: number): void
{
    if (typeof value === 'number')
    {
        if (!isFiniteF32(value)) throw new Error(`${path} 需要有限数字（且不超出 f32 范围），收到：${String(value)}`);

        return;
    }
    if (Array.isArray(value))
    {
        if (depth > maxDepth) throw new Error(`${path} 嵌套过深（超过 ${maxDepth} 层）`);
        value.forEach((item, index) => walkFiniteNumbers(item, `${path}[${index}]`, depth + 1, maxDepth));

        return;
    }
    if (value !== null && typeof value === 'object')
    {
        if (depth > maxDepth) throw new Error(`${path} 嵌套过深（超过 ${maxDepth} 层）`);
        for (const [key, item] of Object.entries(value)) walkFiniteNumbers(item, `${path}.${key}`, depth + 1, maxDepth);
    }
}

/**
 * 解析字段路径到最后一段的持有者。
 *
 * 支持 `a.b`、`a[0].b`、`components[0].material.uniforms.u_diffuse.r` 这类形式。
 */
export function resolvePath(root: object, path: string): { holder: object, key: string | number }
{
    const segments = path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter((s) => s.length > 0);

    if (segments.length === 0) throw new Error(`路径为空：${path}`);

    let current: unknown = root;
    for (let i = 0; i < segments.length - 1; i++)
    {
        const key = segments[i];
        const traversed = segments.slice(0, i).join('.') || '根';
        if (current === null || typeof current !== 'object')
        {
            throw new Error(`路径中的 ${traversed} 不是对象，无法取 ${key}：${path}`);
        }

        const next = (current as Record<string, unknown>)[key];
        // 中间段不存在时立刻报错并列出可用字段：AI 把路径拼成 `postion.y` 时，
        // 越早指出"哪一段错了、有哪些候选"，越不容易在错误前提上继续操作
        if (next === undefined)
        {
            const available = Object.keys(current as object).slice(0, 30).join(', ');

            throw new Error(`路径中的 ${traversed} 上找不到 ${key}（可用字段：${available}）`);
        }
        current = next;
    }

    if (current === null || typeof current !== 'object')
    {
        throw new Error(`路径终点不是对象/数组：${path}`);
    }

    const last = segments[segments.length - 1];

    return { holder: current as object, key: /^\d+$/.test(last) ? Number(last) : last };
}

/**
 * 补全颜色的 `__type__` 与缺失分量，并校验每个分量。
 *
 * 引擎按 `__type__` 分发 logic；而 `Color4` 必须有完整的 r/g/b/a——缺 `a` 时清屏用的
 * `clearValue` 会变成非有限值，`beginRenderPass` 直接报错、整个视图渲染不出来（实测踩过）。
 * 调用方多半只想给个 `{ r, g, b }`，所以在这里补全，而不是要求对方每次都写全。
 *
 * 但**给了值就必须合法**：`{ r: 'x' }` 或 `{ r: 1e39 }` 一律报错，不静默当成 1——
 * 静默替换会让调用方以为"背景色改成红色成功了"，实际拿到的是白色。
 *
 * @param value 颜色字面量
 * @param fieldName 出错信息里显示的字段名
 */
export function toColor4(value: unknown, fieldName = 'color'): unknown
{
    if (value === null || typeof value !== 'object') return value;

    const color = cloneValue(value) as Record<string, unknown>;
    if (color.__type__ === undefined) color.__type__ = 'Color4';
    for (const channel of ['r', 'g', 'b', 'a'])
    {
        const component = color[channel];
        if (component === undefined)
        {
            color[channel] = 1;
            continue;
        }
        if (typeof component !== 'number' || !isFiniteF32(component))
        {
            throw new Error(`${fieldName}.${channel} 需要有限数字（且不超出 f32 范围），收到：${JSON.stringify(component)}`);
        }
    }

    return color;
}

/**
 * 校验颜色字面量并返回可写入的 `Color4`。
 *
 * 与 `toColor4` 的区别是**明确拒绝非对象**：`toColor4` 对 `'red'` 这类输入原样返回（留给调用方
 * 定夺），而写入口需要的是"进了场景就一定是合法颜色"——否则字符串会被写进 `u_diffuse`。
 *
 * @param value 颜色字面量（`undefined` / `null` 按"没给"处理，用全 1 的默认值）
 * @param fieldName 出错信息里显示的字段名
 */
export function toColor4Strict(value: unknown, fieldName = 'color'): unknown
{
    if (value === undefined || value === null) return toColor4({}, fieldName);

    const color = toColor4(value, fieldName);
    if (color === null || typeof color !== 'object')
    {
        throw new Error(`${fieldName} 需要 { r, g, b, a } 形式的颜色，收到：${JSON.stringify(value)}`);
    }

    return color;
}

/** 可撤销命令的最小契约（与 `writeCore` 的 `Command` 结构一致；抽到这里好让栈逻辑能脱离引擎单测） */
export interface UndoableCommand
{
    readonly label: string;
    undo(): void;
    redo(): void;
}

/**
 * 把撤销栈回退到指定深度。
 *
 * 抽成纯函数（只操作传入的数组）是为了可单测——这里的两个顺序细节都出过真问题：
 *
 * 1. **`undo()` 必须先于 `pop()`**：先弹出再还原时，一旦 `undo()` 抛错，这条命令既不在撤销栈
 *    也不在重做栈，场景停在半途而撤销栈里查无记录，`scene.batch` 的回滚还会照报"场景回到调用前"。
 * 2. **预演产生的命令不能进重做栈**（`discard: true`）：`dryRun` 的承诺是"场景与撤销栈都不变"，
 *    而命令一旦落到重做栈上，调用方（或用户按一次重做）就把它变成了真实写入。
 *
 * @param undoStack 撤销栈（就地修改）
 * @param redoStack 重做栈（`discard` 为 false 时接收被撤销的命令）
 * @param depth 目标深度（即回退后 `undoStack.length` 的值）
 * @param discard 为 true 时不写重做栈（预演与失败回滚用）
 * @returns 被撤销的命令标签（按撤销顺序）
 */
export function rewindStacks<T extends UndoableCommand>(
    undoStack: T[], redoStack: T[], depth: number, discard = false): string[]
{
    const undone: string[] = [];
    while (undoStack.length > depth)
    {
        const command = undoStack[undoStack.length - 1];

        command.undo();
        undoStack.pop();
        if (!discard) redoStack.push(command);
        undone.push(command.label);
    }

    return undone;
}

/**
 * 重做若干步（`rewindStacks` 的对称操作）。
 *
 * 同样遵守"`redo()` 先于 `pop()`"：重做抛错时命令留在重做栈上，场景与栈保持一致。
 *
 * @param redoStack 重做栈（就地修改）
 * @param undoStack 撤销栈（接收被重做的命令）
 * @param count 最多重做多少步
 * @returns 被重做的命令标签（按重做顺序）
 */
export function replayStacks<T extends UndoableCommand>(redoStack: T[], undoStack: T[], count: number): string[]
{
    const redone: string[] = [];
    for (let i = 0; i < count; i++)
    {
        const command = redoStack[redoStack.length - 1];
        if (!command) break;

        command.redo();
        redoStack.pop();
        undoStack.push(command);
        redone.push(command.label);
    }

    return redone;
}
