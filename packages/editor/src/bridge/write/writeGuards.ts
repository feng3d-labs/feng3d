import { resolveObjectId } from '../EditorBridge';
import { cloneValue, writeValue } from './writeCore';

/**
 * 解析字段路径到最后一段的持有者。
 *
 * 支持 `a.b`、`a[0].b`、`components[0].material.uniforms.u_diffuse.r` 这类形式。
 */
function resolvePath(root: object, path: string): { holder: object, key: string | number }
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
 * 取值的原始类型名（number / string / boolean），非原始类型返回 null。
 *
 * 仅用于写入前的类型防呆：`undefined` 无法判断，对象/数组形状多变，都不参与比较。
 */
function primitiveTypeOf(value: unknown): string | null
{
    if (value === null || value === undefined) return null;
    const type = typeof value;

    return (type === 'number' || type === 'string' || type === 'boolean') ? type : null;
}

/** 一次字段写入的准备结果（校验已通过，尚未落笔） */
export interface SetOutcome
{
    readonly objectId: string;
    readonly path: string;
    readonly holder: object;
    readonly key: string | number;
    readonly hadKey: boolean;
    readonly before: unknown;
    readonly after: unknown;
}

/**
 * 校验并准备好要写入的值（**不落笔**）。
 *
 * 拆出这一步是为了批量写入的原子性：先把所有目标校验通过，再统一落笔，
 * 避免"改到第 3 个对象才发现路径是错的"而留下半成品。
 */
export function prepareSet(objectId: string, path: string, value: unknown, create: boolean): SetOutcome
{
    const object = resolveObjectId(objectId);
    const { holder, key } = resolvePath(object, path);
    const hadKey = Object.prototype.hasOwnProperty.call(holder, key);
    const before = cloneValue((holder as Record<string | number, unknown>)[key]);

    // 防呆一：字段不存在多半是路径拼错（`postion.y` 之类）。静默新增字段会让"改完了"
    // 变成假象——画面毫无变化，AI 却以为成功，接下来基于错误前提继续操作。
    if (!hadKey && !create)
    {
        const available = Object.keys(holder as object).slice(0, 30).join(', ');

        throw new Error(
            `${path} 在目标对象上不存在（字段名可能拼错）。可用字段：${available}。`
            + '确实要新增字段请传 create: true。',
        );
    }

    // 防呆二：原始类型不匹配（把 number 写成 "0.5" 这种字符串）几乎总是错误
    const beforeType = primitiveTypeOf(before);
    const afterType = primitiveTypeOf(value);
    if (beforeType !== null && afterType !== null && beforeType !== afterType)
    {
        throw new Error(`${path} 是 ${beforeType}，传入的却是 ${afterType}：${JSON.stringify(value)}`);
    }

    // 数字必须是有限值：NaN / Infinity 一旦写进变换或 uniform，渲染就会出问题
    // （实测把 NaN 写进 u_glossiness 后页面直接栈溢出）；f32 溢出（如 1e39）同样在 GPU 侧变 Infinity
    if (afterType === 'number' && !isFiniteF32(value as number))
    {
        throw new Error(`${path} 需要有限数字（且不超出 f32 范围），收到：${String(value)}`);
    }

    // 防呆三：对象与原始类型之间也不能互转——把 position 写成字符串会让渲染直接崩掉。
    // 只在字段已存在时判断：新增字段（create: true）本来就没有"原类型"可依据
    const beforeIsObject = before !== null && typeof before === 'object';
    const afterIsObject = value !== null && typeof value === 'object';
    if (hadKey && beforeIsObject !== afterIsObject)
    {
        throw new Error(
            `${path} 是${beforeIsObject ? '对象' : '原始值'}，传入的却是${afterIsObject ? '对象' : '原始值'}：`
            + JSON.stringify(value),
        );
    }

    // 防呆四：对象/数组里不能藏非法数字——`position: { x: 1e39 }` 会绕过上面的单值检查，
    // 而变换里的 Infinity 会让整个矩阵变 NaN（对象跟着消失，且看不出是谁干的）
    if (afterIsObject) assertFiniteNumbers(value, path);

    return { objectId, path, holder, key, hadKey, before, after: cloneValue(value) };
}

/**
 * 递归校验写入值里的所有数字。
 *
 * 只查"能不能被 f32 表示"与嵌套深度：类型是否合理交给上面的防呆一/二/三，
 * 这里专治"单个字段看着合法、藏在对象里才出问题"的情形。
 *
 * @param value 待写入的值
 * @param path 出错信息里显示的字段路径
 * @param depth 当前嵌套深度（超过 8 层直接拒绝，兼顾异常输入与遍历开销）
 */
export function assertFiniteNumbers(value: unknown, path: string, depth = 0): void
{
    if (typeof value === 'number')
    {
        if (!isFiniteF32(value)) throw new Error(`${path} 需要有限数字（且不超出 f32 范围），收到：${String(value)}`);

        return;
    }
    if (Array.isArray(value))
    {
        if (depth > 8) throw new Error(`${path} 嵌套过深（超过 8 层）`);
        value.forEach((item, index) => assertFiniteNumbers(item, `${path}[${index}]`, depth + 1));

        return;
    }
    if (value !== null && typeof value === 'object')
    {
        if (depth > 8) throw new Error(`${path} 嵌套过深（超过 8 层）`);
        for (const [key, item] of Object.entries(value)) assertFiniteNumbers(item, `${path}.${key}`, depth + 1);
    }
}

/** 落笔（写入准备阶段算好的值） */
export function commitSet(outcome: SetOutcome): void
{
    writeValue(outcome.holder, outcome.key, cloneValue(outcome.after));
}

/** 还原到写入前 */
export function revertSet(outcome: SetOutcome): void
{
    if (outcome.hadKey) writeValue(outcome.holder, outcome.key, cloneValue(outcome.before));
    else delete (outcome.holder as Record<string | number, unknown>)[outcome.key];
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
