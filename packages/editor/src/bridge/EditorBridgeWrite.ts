import { globalEmitter, logic as getLogic, serialization } from 'feng3d';
import type { Object3D, Scene } from 'feng3d';
import { reactive, toRaw } from '@feng3d/reactivity';
import { editorRS } from '../assets/EditorRS';
import { getActiveEditorView } from '../feng3d/editorViewRegistry';
import { EditorData } from '../global/EditorData';
import { clearEditorLogs } from '../utils/editorLog';
import { MAX_TREE_DEPTH, getObjectId, requireSceneRoot, resolveObjectId } from './EditorBridge';

/**
 * 编辑器 AI 桥接的 **P2 写通道**。
 *
 * 设计原则（见 docs/EDITOR_AI_BRIDGE.md）：
 * - **默认关闭**：需要显式启用，避免 AI 或误触在用户不知情时改场景
 * - **命令式撤销**：每个写操作记录自己的反向操作（而不是"全场景快照"）——粒度精确、
 *   实现可控，且 `scene.remove` 这类操作复用 `serialization` 序列化子树即可回滚
 * - **只改纯数据**：写入一律经 `reactive(holder)[key] = value`，与人工编辑同构
 */

/** 写通道启用开关：URL `?bridge=write` 或 localStorage `editor-bridge-write=1` */
export function isWriteEnabled(): boolean
{
    try
    {
        if (new URLSearchParams(window.location.search).get('bridge') === 'write') return true;

        return window.localStorage.getItem('editor-bridge-write') === '1';
    }
    catch
    {
        return false;
    }
}

function requireWriteEnabled(): void
{
    if (isWriteEnabled()) return;
    throw new Error(
        '写通道未启用（P2 默认关闭）。启用方式：在编辑器 URL 后加 ?bridge=write，'
        + '或在控制台执行 localStorage.setItem("editor-bridge-write", "1") 后刷新。',
    );
}

interface Command
{
    readonly label: string;
    undo(): void;
    redo(): void;
}

/** 撤销栈与重做栈 */
const undoStack: Command[] = [];
const redoStack: Command[] = [];
const MAX_HISTORY = 100;

function pushCommand(command: Command): void
{
    undoStack.push(command);
    redoStack.length = 0;
    if (undoStack.length > MAX_HISTORY) undoStack.shift();

    // 写操作后通知编辑器刷新：层级面板 / 检查器等组件监听 editor.selectedObjectsChanged。
    // 不发这个事件的话，新增或删除的对象在这些面板里看不到（实测层级面板不出现新对象）。
    globalEmitter.emit('editor.selectedObjectsChanged' as never);
}

/** 写入原始数据（经响应式代理，与人工编辑同构） */
function writeValue(holder: object, key: string | number, value: unknown): void
{
    const r_holder = reactive(holder as Record<string | number, unknown>);
    r_holder[key] = value;
}

/** 深拷贝纯数据值（场景数据均为 JSON 兼容，够用） */
function cloneValue(value: unknown): unknown
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
interface SetOutcome
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
function prepareSet(objectId: string, path: string, value: unknown, create: boolean): SetOutcome
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

    return { objectId, path, holder, key, hadKey, before, after: cloneValue(value) };
}

/** 落笔（写入准备阶段算好的值） */
function commitSet(outcome: SetOutcome): void
{
    writeValue(outcome.holder, outcome.key, cloneValue(outcome.after));
}

/** 还原到写入前 */
function revertSet(outcome: SetOutcome): void
{
    if (outcome.hadKey) writeValue(outcome.holder, outcome.key, cloneValue(outcome.before));
    else delete (outcome.holder as Record<string | number, unknown>)[outcome.key];
}

/** 写入对象字段（可撤销） */
export function sceneSet(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    const path = String(params.path ?? '');
    if (!objectId || !path) throw new Error('需要 objectId 与 path，例如 { objectId: "/Untitled/Cube", path: "position.y", value: 1 }');

    const outcome = prepareSet(objectId, path, params.value, params.create === true);
    commitSet(outcome);

    pushCommand({
        label: `set ${objectId}.${path}`,
        undo: () => revertSet(outcome),
        redo: () => commitSet(outcome),
    });

    return {
        objectId,
        path,
        before: outcome.hadKey ? outcome.before : null,
        after: outcome.after,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/**
 * 对**多个对象**写入同一字段（一次撤销）。
 *
 * 用途：AI 常要对一组对象做同一修改（"这些球都变蓝"、"整体上移 1 单位"）。
 * 逐个调 `scene.set` 既慢、又会留下 N 个撤销步，中途失败还会留下半成品；
 * 这里**先全部校验、再统一落笔**，因此要么全改、要么一个都不改，撤销也只需一步。
 */
export function sceneSetMany(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('需要非空的 objectIds 数组');
    const path = String(params.path ?? '');
    if (!path) throw new Error('需要 path');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);

    const create = params.create === true;
    // 先全部校验：任一项不合格都会在此抛出，此时还没有任何写入
    const outcomes = rawIds.map((id) => prepareSet(String(id), path, params.value, create));

    for (const outcome of outcomes) commitSet(outcome);

    pushCommand({
        label: `setMany ${outcomes.length} x ${path}`,
        undo: () => { for (const outcome of outcomes) revertSet(outcome); },
        redo: () => { for (const outcome of outcomes) commitSet(outcome); },
    });

    return {
        updated: outcomes.length,
        path,
        after: outcomes[0].after,
        objects: outcomes.map((outcome) => outcome.objectId),
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/** 取向量在指定轴上的分量（缺字段时按 0） */
function axisValue(vector: unknown, axis: string): number
{
    if (vector === null || vector === undefined) return 0;
    const value = (vector as Record<string, unknown>)[axis];

    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** 圆周分布时：圆所在平面的法线轴 → 平面上的两个轴 */
const CIRCLE_PLANE: Record<string, readonly [string, string]> = {
    x: ['y', 'z'],
    y: ['x', 'z'],
    z: ['x', 'y'],
};

/**
 * 排列一组对象：沿某个轴**对齐**、**等间距排开**或**围成一圈**（一次撤销）。
 *
 * 为什么要在通道里做：AI 想"把这几个球排成一行 / 围一圈"时只能自己读每个对象的包围盒、
 * 算坐标，再逐个 `scene.set`——既容易算错（对象尺寸不同就叠在一起），又会留下 N 个撤销步。
 *
 * - `mode: 'line'`（默认）：以**第一个对象的中心**为起点，按 `spacing` 沿轴等间距排开；
 *   `spacing` 省略时取这批对象在该轴上的最大尺寸 × 1.2（保证不重叠）
 * - `mode: 'align'`：把每个对象在轴上的**中心**对齐到这批对象的中心平均值
 *   （不用某一个对象作基准，避免整体偏移）
 * - `mode: 'circle'`：以这批对象的中心为圆心，在**垂直于 `axis`** 的平面上均匀分布
 *   （`axis` 默认 `y`，即水平圆）；`radius` 省略时取最大尺寸 × 1.5
 * - `mode: 'grid'`：在垂直于 `axis` 的平面上按 `columns` 列铺成网格（默认 `ceil(√n)` 列），
 *   整体以这批对象的中心为中心；步长默认按各方向最大尺寸 × 1.2
 *
 * @param params.objectIds 至少 2 个对象的路径式 id
 * @param params.axis `x` / `y` / `z`（circle 与 grid 模式下表示平面的法线方向）
 * @param params.mode `line`（默认）/ `align` / `circle` / `grid`
 * @param params.spacing 仅 `line` / `grid` 模式：间距
 * @param params.radius 仅 `circle` 模式：半径
 * @param params.columns 仅 `grid` 模式：列数
 */
export function sceneArrange(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds;
    if (!Array.isArray(rawIds) || rawIds.length < 2) throw new Error('需要至少 2 个对象的 objectIds 数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);

    const mode = String(params.mode ?? 'line');
    if (mode !== 'line' && mode !== 'align' && mode !== 'circle' && mode !== 'grid')
    {
        throw new Error(`mode 只能是 line / align / circle / grid，收到：${mode}`);
    }
    const axis = String(params.axis ?? (mode === 'circle' ? 'y' : 'x'));
    if (axis !== 'x' && axis !== 'y' && axis !== 'z') throw new Error(`axis 只能是 x / y / z，收到：${axis}`);

    // 必须用世界包围盒：对象若挂在有位移的父级下，本地 position 并不等于它在场景中的位置
    const infos = rawIds.map((id) =>
    {
        const object = resolveObjectId(String(id));
        const bounds = getLogic(object).boundingBox.worldBounds;

        return {
            objectId: getObjectId(object),
            center: bounds.getCenter() as { x: number, y: number, z: number },
            size: bounds.getSize() as { x: number, y: number, z: number },
            position: object.position,
        };
    });

    // 先算出"每个对象在某轴上要落到哪个坐标"，再统一换算成 position 的写入
    // （换算要减掉"中心与 position 的偏移"：对象挂在有位移的父级下时两者不等）
    const moves: { objectId: string, path: string, value: number }[] = [];
    const pushCenter = (info: typeof infos[number], targetAxis: string, targetCenter: number) =>
    {
        moves.push({
            objectId: info.objectId,
            path: `position.${targetAxis}`,
            value: axisValue(info.position, targetAxis) + (targetCenter - axisValue(info.center, targetAxis)),
        });
    };
    const sumOf = (pick: (info: typeof infos[number]) => number) => infos.reduce((sum, info) => sum + pick(info), 0);

    if (mode === 'align')
    {
        const anchor = sumOf((info) => axisValue(info.center, axis)) / infos.length;
        for (const info of infos) pushCenter(info, axis, anchor);
    }
    else if (mode === 'line')
    {
        const maxSize = Math.max(...infos.map((info) => axisValue(info.size, axis)));
        const spacing = params.spacing === undefined ? (maxSize > 0.001 ? maxSize * 1.2 : 1) : Number(params.spacing);
        const startCenter = axisValue(infos[0].center, axis);
        infos.forEach((info, index) => pushCenter(info, axis, startCenter + (spacing * index)));
    }
    else if (mode === 'grid')
    {
        // 网格排布：在垂直于 axis 的平面上按 columns 列铺开，整体以这批对象的中心为中心
        const [axisA, axisB] = CIRCLE_PLANE[axis];
        const maxA = Math.max(...infos.map((info) => axisValue(info.size, axisA)));
        const maxB = Math.max(...infos.map((info) => axisValue(info.size, axisB)));
        const stepA = params.spacing === undefined ? (maxA > 0.001 ? maxA * 1.2 : 1) : Number(params.spacing);
        const stepB = params.spacing === undefined ? (maxB > 0.001 ? maxB * 1.2 : stepA) : Number(params.spacing);
        const columns = Math.max(1, params.columns === undefined
            ? Math.ceil(Math.sqrt(infos.length))
            : Number(params.columns));
        const rows = Math.ceil(infos.length / columns);

        const centerA = sumOf((info) => axisValue(info.center, axisA)) / infos.length;
        const centerB = sumOf((info) => axisValue(info.center, axisB)) / infos.length;
        const centerAxis = sumOf((info) => axisValue(info.center, axis)) / infos.length;

        infos.forEach((info, index) =>
        {
            const column = index % columns;
            const row = Math.floor(index / columns);
            pushCenter(info, axisA, centerA + ((column - ((columns - 1) / 2)) * stepA));
            pushCenter(info, axisB, centerB + ((row - ((rows - 1) / 2)) * stepB));
            pushCenter(info, axis, centerAxis);
        });
    }
    else
    {
        const [axisA, axisB] = CIRCLE_PLANE[axis];
        // 圆心：默认取这批对象中心的平均值；也可显式指定——「围绕某个对象摆一圈」时用
        // centerObjectId 指向那个中心对象，否则会以被排列对象自己的重心为圆心，不是想要的
        let centerA = sumOf((info) => axisValue(info.center, axisA)) / infos.length;
        let centerB = sumOf((info) => axisValue(info.center, axisB)) / infos.length;
        let centerAxis = sumOf((info) => axisValue(info.center, axis)) / infos.length;

        const explicitCenter = params.centerObjectId !== undefined
            ? getLogic(resolveObjectId(String(params.centerObjectId))).boundingBox.worldBounds.getCenter()
            : params.center;

        if (explicitCenter !== undefined)
        {
            centerA = axisValue(explicitCenter, axisA);
            centerB = axisValue(explicitCenter, axisB);
            centerAxis = axisValue(explicitCenter, axis);
        }

        const maxSize = Math.max(...infos.map((info) => Math.max(axisValue(info.size, axisA), axisValue(info.size, axisB))));
        const radius = params.radius === undefined ? (maxSize > 0.001 ? maxSize * 1.5 : 2) : Number(params.radius);

        infos.forEach((info, index) =>
        {
            const angle = (index / infos.length) * Math.PI * 2;
            pushCenter(info, axisA, centerA + (Math.cos(angle) * radius));
            pushCenter(info, axisB, centerB + (Math.sin(angle) * radius));
            // 法线方向也对齐到圆心：否则各对象高低不一，就组不成一个平面上的圆
            pushCenter(info, axis, centerAxis);
        });
    }

    // 先全部校验（含类型防呆）再统一落笔：要么全动、要么一个都不动
    const outcomes = moves.map((move) => prepareSet(move.objectId, move.path, move.value, true));

    for (const outcome of outcomes) commitSet(outcome);

    pushCommand({
        label: `arrange ${mode} ${axis} x${infos.length}`,
        undo: () => { for (const outcome of outcomes) revertSet(outcome); },
        redo: () => { for (const outcome of outcomes) commitSet(outcome); },
    });

    return {
        mode,
        axis,
        moved: infos.length,
        // line / align 每个对象一个值；circle 是「x 与 z 两个分量」依次排列
        values: outcomes.map((outcome) => Number((outcome.after as number).toFixed(4))),
        objects: infos.map((info) => info.objectId),
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/**
 * 补全颜色的 `__type__` 与缺失分量。
 *
 * 引擎按 `__type__` 分发 logic；而 `Color4` 必须有完整的 r/g/b/a——缺 `a` 时清屏用的
 * `clearValue` 会变成非有限值，`beginRenderPass` 直接报错、整个视图渲染不出来（实测踩过）。
 * 调用方多半只想给个 `{ r, g, b }`，所以在这里补全，而不是要求对方每次都写全。
 */
function toColor4(value: unknown): unknown
{
    if (value === null || typeof value !== 'object') return value;

    const color = cloneValue(value) as Record<string, unknown>;
    if (color.__type__ === undefined) color.__type__ = 'Color4';
    for (const channel of ['r', 'g', 'b', 'a'])
    {
        if (typeof color[channel] !== 'number') color[channel] = 1;
    }

    return color;
}

/**
 * 设置场景环境（背景色 / 环境光），可撤销。
 *
 * 为什么单独开一个入口：这两个字段挂在 `Scene` 组件上，而 AI 手里只有**场景根的路径 id**，
 * 还得先查出 `components[N]` 里的 N 才能写——多一步、多一个出错点。
 *
 * 要写**两处**：视口里看到的背景/环境光来自**编辑器视图的 Scene**（`EditorView.viewScene`），
 * 游戏场景自身那个 Scene 组件只在导出后运行时才起作用。实测只改后者画面毫无变化。
 *
 * @param params.background 背景色，如 `{ r: 0.1, g: 0.2, b: 0.4 }`
 * @param params.ambientColor 环境光颜色
 */
export function sceneSetEnvironment(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const wanted: { key: 'background' | 'ambientColor', value: unknown }[] = [];
    if (params.background !== undefined) wanted.push({ key: 'background', value: toColor4(params.background) });
    if (params.ambientColor !== undefined) wanted.push({ key: 'ambientColor', value: toColor4(params.ambientColor) });
    if (wanted.length === 0)
    {
        throw new Error('至少要给 background 或 ambientColor，例如 { background: { r: 0.1, g: 0.2, b: 0.4 } }');
    }

    // 收集两处的 Scene 组件：视图场景（决定视口里看到的背景/环境光）+ 游戏场景（导出后运行时用）
    const components: object[] = [];
    const names: string[] = [];
    const collect = (scene: Scene | null) =>
    {
        if (!scene) return;
        const host = toRaw(getLogic(scene)?.entity as Object3D | null);
        if (!host) return;
        const index = (host.components ?? []).findIndex((component) => toRaw(component) === toRaw(scene));
        if (index < 0) return;

        components.push(host.components[index] as object);
        names.push(`${host.name ?? 'Object3D'}`);
    };
    collect(getActiveEditorView()?.viewScene ?? null);
    collect(EditorData.editorData.gameScene);

    if (components.length === 0) throw new Error('找不到可写的 Scene 组件（编辑器视图尚未就绪？）');

    // 直接对组件对象写入，不走路径式 id：`editorViewRoot` 不在游戏场景树里，桥接的 id
    // 寻址不到它（`resolveObjectId` 会拒绝这种路径），用 id 往返只会写到别的对象上
    interface SceneWrite { readonly component: object, readonly key: string, readonly before: unknown, readonly after: unknown }
    const writes: SceneWrite[] = [];
    for (const component of components)
    {
        const source = component as Record<string, unknown>;
        for (const item of wanted)
        {
            writes.push({ component, key: item.key, before: cloneValue(source[item.key]), after: cloneValue(item.value) });
        }
    }

    for (const write of writes) writeValue(write.component, write.key, cloneValue(write.after));

    pushCommand({
        label: `setEnvironment ${wanted.map((item) => item.key).join('+')}`,
        undo: () => { for (const write of writes) writeValue(write.component, write.key, cloneValue(write.before)); },
        redo: () => { for (const write of writes) writeValue(write.component, write.key, cloneValue(write.after)); },
    });

    // 返回**实际落笔**的值（而不是入参）：颜色会被补全，回显真实结果才便于自证
    const applied: Record<string, unknown> = {};
    for (const write of writes) applied[write.key] = write.after;

    return {
        set: applied,
        updated: names,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/** 撤销栈标记：名字 → 当时的栈深度（lazy 创建，遵守「模块级零副作用」） */
let marks: Map<string, number> | null = null;

function getMarks(): Map<string, number>
{
    marks ??= new Map();

    return marks;
}

/**
 * 在撤销栈上打一个标记。
 *
 * 用途：AI 要"先试试看"时先打标记、再放手尝试，不满意用 `scene.rollback` 一次退回。
 * 比自己数"我做了几步"可靠——数错就会退过头，把用户之前的操作也撤掉。
 *
 * @param params.name 标记名，默认 `default`
 */
export function sceneMark(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const name = params.name === undefined ? 'default' : String(params.name);
    getMarks().set(name, undoStack.length);

    return { mark: name, depth: undoStack.length, hint: '之后用 scene.rollback 可退回到这里' };
}

/**
 * 回滚到某个标记处：把标记之后的写操作**全部撤销**，并消费掉该标记。
 *
 * @param params.name 标记名，默认 `default`
 */
export function sceneRollback(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const name = params.name === undefined ? 'default' : String(params.name);
    const marksMap = getMarks();
    const depth = marksMap.get(name);
    if (depth === undefined) throw new Error(`没有名为 ${name} 的标记（先用 scene.mark 打一个）`);

    const undone: string[] = [];
    while (undoStack.length > depth)
    {
        const command = undoStack.pop();
        if (!command) break;
        command.undo();
        redoStack.push(command);
        undone.push(command.label);
    }

    marksMap.delete(name);

    return {
        mark: name,
        undoneCount: undone.length,
        undone,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/** 撤销栈状态 */
export function historyStatus(): unknown
{
    return {
        writeEnabled: isWriteEnabled(),
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        labels: undoStack.map((c) => c.label),
    };
}

/** 撤销一步 */
export function historyUndo(): unknown
{
    requireWriteEnabled();
    const command = undoStack.pop();
    if (!command) return { undone: null, message: '没有可撤销的操作' };

    command.undo();
    redoStack.push(command);

    return { undone: command.label, history: { undoCount: undoStack.length, redoCount: redoStack.length } };
}

/** 重做一步 */
export function historyRedo(): unknown
{
    requireWriteEnabled();
    const command = redoStack.pop();
    if (!command) return { redone: null, message: '没有可重做的操作' };

    command.redo();
    undoStack.push(command);

    return { redone: command.label, history: { undoCount: undoStack.length, redoCount: redoStack.length } };
}

/** P2 写方法表（供 EditorBridge 合并；全部需要写通道已启用） */
/** 移动对象到另一个父级（可撤销），可选 `index` 指定插入位置 */
export function sceneReparent(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    const parentId = String(params.parentId ?? '');
    if (!objectId || !parentId) throw new Error('需要 objectId 与 parentId');
    if (objectId === parentId) throw new Error('不能把对象挂到它自己下面');

    // 统一 toRaw 规范化：`resolveObjectId` 与 `logic().parent` 可能分别返回代理与原始对象，
    // 混用时 `===` / `indexOf` 都不成立——防环检查会因此**漏检**，实测把场景树弄成环后页面栈溢出。
    const object = toRaw(resolveObjectId(objectId));
    const newParent = toRaw(resolveObjectId(parentId));
    const oldParent = toRaw(getLogic(object)?.parent as Object3D | null);
    if (!oldParent) throw new Error('不能移动场景根对象');

    // 防环：把对象挂到自己的子孙下会让场景树遍历死循环。
    // 步数上限是兜底——即使树已因异常成环，这里也只报错，而不会把页面卡死
    let ancestor: Object3D | null = newParent;
    let depth = 0;
    while (ancestor)
    {
        if (ancestor === object) throw new Error('不能把对象移动到它自己的子孙下');
        if (++depth > MAX_TREE_DEPTH) throw new Error(`场景树深度超过 ${MAX_TREE_DEPTH}，疑似已经成环，已中止`);
        ancestor = toRaw(getLogic(ancestor)?.parent as Object3D | null);
    }

    const oldIndex = (oldParent.children ?? []).findIndex((child) => toRaw(child) === object);
    const newIndex = params.index === undefined ? undefined : Number(params.index);

    const childrenOf = (parent: Object3D) =>
        reactive(parent as object as Record<string, unknown>).children as Object3D[];
    // 一律 toRaw 比较：children 经响应式代理读出时元素是代理，对原始对象 indexOf 得 -1，
    // 会导致「该移除的没移除」，对象同时挂在两个父级下
    const detach = (parent: Object3D) =>
    {
        const children = childrenOf(parent);
        const at = children.findIndex((child) => toRaw(child) === object);
        if (at >= 0) children.splice(at, 1);
    };
    const attach = (parent: Object3D, index?: number) =>
    {
        const children = childrenOf(parent);
        children.splice(index === undefined ? children.length : Math.min(index, children.length), 0, object);
    };

    detach(oldParent);
    attach(newParent, newIndex);

    pushCommand({
        label: `reparent ${objectId} -> ${parentId}`,
        undo: () =>
        {
            detach(newParent);
            attach(oldParent, oldIndex < 0 ? undefined : oldIndex);
        },
        redo: () =>
        {
            detach(oldParent);
            attach(newParent, newIndex);
        },
    });

    return { objectId, from: getObjectId(oldParent), to: getObjectId(newParent), newId: getObjectId(object) };
}

/**
 * 把当前场景写回场景文件（持久化）。
 *
 * P2 之前所有写操作只改页面内存，刷新即丢。这里补上显式落盘，复用编辑器自身
 * beforeunload 保存的同一条链路（`serialization.serialize` + `editorRS.fs.writeObject`）。
 */
export function sceneSave(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const path = params.path === undefined ? 'default.scene.json' : String(params.path);
    const root = requireSceneRoot();
    const data = serialization.serialize(root);
    // writeObject 是异步的；与 Editor.ts 的 beforeunload 保存保持一致，不阻塞等待
    void editorRS.fs.writeObject(path, data);

    return { saved: path, childCount: (root.children ?? []).length };
}

/**
 * 清空编辑器日志。
 *
 * 用途：AI 复现问题前先清空，再复现一次，这样 `log.tail` 读到的就只有本次产生的日志。
 * 归入写通道：日志是用户正在看的诊断信息，清空属于有副作用的操作。
 */
export function logClear(): unknown
{
    requireWriteEnabled();

    return { cleared: clearEditorLogs() };
}

export const WRITE_HANDLERS: Record<string, (params: Record<string, unknown>) => unknown> = {
    'scene.set': (params) => sceneSet(params),
    'scene.setMany': (params) => sceneSetMany(params),
    'scene.setEnvironment': (params) => sceneSetEnvironment(params),
    'scene.arrange': (params) => sceneArrange(params),
    'scene.add': (params) => sceneAdd(params),
    'scene.duplicate': (params) => sceneDuplicate(params),
    'scene.group': (params) => sceneGroup(params),
    'scene.remove': (params) => sceneRemove(params),
    'scene.reparent': (params) => sceneReparent(params),
    'scene.save': (params) => sceneSave(params),
    'history.status': () => historyStatus(),
    'history.undo': () => historyUndo(),
    'history.redo': () => historyRedo(),
    'scene.mark': (params) => sceneMark(params),
    'scene.rollback': (params) => sceneRollback(params),
    'log.clear': () => logClear(),
};

/** 简写形状 → 几何数据类型 */
const SHAPE_GEOMETRY: Record<string, string> = {
    cube: 'CubeGeometry',
    sphere: 'SphereGeometry',
    plane: 'PlaneGeometry',
    cylinder: 'CylinderGeometry',
    capsule: 'CapsuleGeometry',
    torus: 'TorusGeometry',
};

/**
 * 由简写参数构造组件数组。
 *
 * 没有 `shape` 时走 `components` 直传（原行为）。有 `shape` 时自动组装
 * `MeshRenderer + 几何 + 可选 StandardMaterial`：手写这套字面量对 AI 既长又容易写错结构
 * （`geometry` 必须嵌在 `MeshRenderer` 里、材质要走 `uniforms.u_diffuse`），
 * 而"加一个红色球"这种需求并不需要那种细节。
 */
function buildComponents(params: Record<string, unknown>): unknown[] | undefined
{
    if (params.shape === undefined)
    {
        return params.components === undefined ? undefined : cloneValue(params.components) as unknown[];
    }

    const shape = String(params.shape).toLowerCase();
    const geometryType = SHAPE_GEOMETRY[shape];
    if (!geometryType) throw new Error(`未知 shape：${shape}（可用：${Object.keys(SHAPE_GEOMETRY).join(' / ')}）`);
    if (params.components !== undefined) throw new Error('shape 与 components 不能同时传');

    const color = params.color as { r?: number, g?: number, b?: number, a?: number } | undefined;
    const material = color === undefined ? undefined : {
        __type__: 'StandardMaterial',
        uniforms: {
            u_diffuse: {
                __type__: 'Color4',
                r: Number(color.r ?? 1),
                g: Number(color.g ?? 1),
                b: Number(color.b ?? 1),
                a: Number(color.a ?? 1),
            },
        },
    };

    return [{
        __type__: 'MeshRenderer',
        geometry: {
            __type__: geometryType,
            ...(params.geometryParams === undefined ? {} : cloneValue(params.geometryParams) as object),
        },
        ...(material === undefined ? {} : { material }),
    }];
}

/**
 * 新增对象（可撤销）。
 *
 * `parentId` 省略时挂到场景根。两种写法：
 * - `shape`：简写，自动组装 `MeshRenderer + 几何 + 可选材质`，可配 `color` 与 `geometryParams`；
 * - `components`：纯数据字面量直传，例如
 *   `[{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } }]`。
 */
export function sceneAdd(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const parent = params.parentId ? resolveObjectId(String(params.parentId)) : requireSceneRoot();
    const components = buildComponents(params);
    const object = {
        __type__: 'Object3D',
        name: params.name === undefined ? 'Object3D' : String(params.name),
        ...(params.position === undefined ? {} : { position: cloneValue(params.position) as object }),
        ...(params.rotation === undefined ? {} : { rotation: cloneValue(params.rotation) as object }),
        ...(params.scale === undefined ? {} : { scale: cloneValue(params.scale) as object }),
        ...(components === undefined ? {} : { components }),
    } as Object3D;

    const r_parent = reactive(parent as object as Record<string, unknown>);
    (r_parent.children as Object3D[]).push(object);

    pushCommand({
        label: `add ${object.name}`,
        undo: () =>
        {
            const children = reactive(parent as object as Record<string, unknown>).children as Object3D[];
            // 用 toRaw 比较：Vue 的数组代理会把 indexOf 转到原始数组上查找，所以「数组是代理」
            // 不影响匹配，但**参数若是代理**就永远找不到（这正是批量删除只删掉一个的原因）
            const index = children.findIndex((child) => toRaw(child) === toRaw(object));
            if (index >= 0) children.splice(index, 1);
        },
        redo: () => { (reactive(parent as object as Record<string, unknown>).children as Object3D[]).push(object); },
    });

    return { id: getObjectId(object), parentId: getObjectId(parent), name: object.name };
}

/**
 * 复制对象（含子树与组件），可撤销。
 *
 * 用途：AI 常需要"再来几个一样的"，手写 `components` 字面量既啰嗦又容易漏（材质参数、
 * 几何构造参数）。这里走 `serialization` 深拷贝纯数据——与 `scene.save` 同一条链路，
 * 因此不会遗漏任何字段。
 *
 * 默认**沿 X 轴依次排开**：复制体与原对象完全重叠时画面看不出变化，AI 和用户都难以察觉。
 *
 * @param params.objectId 要复制的对象
 * @param params.parentId 新对象的父级，默认与原对象同父级
 * @param params.name 新对象名，默认 `<原名>Copy`；复制多份时自动追加序号
 * @param params.position 新对象位置，默认按包围盒宽度沿 X 轴错开
 * @param params.count 复制份数，默认 1，上限 50
 */
export function sceneDuplicate(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('需要 objectId');

    const source = resolveObjectId(objectId);
    const sourceParent = getLogic(source)?.parent as Object3D | null;
    if (!sourceParent) throw new Error('不能复制场景根对象');

    const parent = params.parentId ? resolveObjectId(String(params.parentId)) : sourceParent;
    const count = Math.max(1, Math.min(Number(params.count ?? 1) || 1, 50));
    const baseName = params.name === undefined ? `${source.name ?? 'Object3D'}Copy` : String(params.name);

    // 错开步长取自身宽度（取不到时退化为 1），确保复制体不会叠在一起
    const size = getLogic(source).boundingBox.worldBounds.getSize();
    const step = Number.isFinite(size.x) && size.x > 0.001 ? size.x * 1.1 : 1;
    const sourcePosition = source.position;
    const baseX = Number.isFinite(sourcePosition?.x) ? (sourcePosition as { x: number }).x : 0;
    const baseY = Number.isFinite(sourcePosition?.y) ? (sourcePosition as { y: number }).y : 0;
    const baseZ = Number.isFinite(sourcePosition?.z) ? (sourcePosition as { z: number }).z : 0;

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    const created: Object3D[] = [];
    for (let i = 0; i < count; i++)
    {
        const clone = serialization.deserialize(serialization.serialize(source)) as Object3D;
        const r_clone = reactive(clone as object as Record<string, unknown>);
        r_clone.name = count > 1 ? `${baseName}${i + 1}` : baseName;
        r_clone.position = params.position !== undefined
            ? cloneValue(params.position)
            : { x: baseX + (step * (i + 1)), y: baseY, z: baseZ };

        childrenOf(parent).push(clone);
        created.push(clone);
    }

    const detachAll = () =>
    {
        const children = childrenOf(parent);
        for (const clone of created)
        {
            const index = children.findIndex((child) => toRaw(child) === toRaw(clone));
            if (index >= 0) children.splice(index, 1);
        }
    };

    pushCommand({
        label: `duplicate ${objectId} x${count}`,
        undo: detachAll,
        redo: () =>
        {
            for (const clone of created) childrenOf(parent).push(clone);
        },
    });

    return { created: created.map((clone) => getObjectId(clone)), count, parentId: getObjectId(parent) };
}

/**
 * 删除对象（可撤销）。
 *
 * 支持一次删多个（`objectIds`）：**先全部解析校验、再统一删除**，任何一项不合格都在删除前
 * 抛出，不会删一半留下残局；撤销时按原 index 升序插回，同一父级下多个对象能恢复原顺序。
 *
 * 撤销时直接插回**原对象**（而不是 `deserialize` 出来的副本）。这一点很关键：副本会改变引用，
 * 导致更早的 `add` 命令按引用找不到它、撤销失效——实测 `add → remove → undo(remove) → undo(add)`
 * 序列下最后一次撤销无效、对象残留。复用原引用后两个命令能正确互操作。
 */
/**
 * 把一组对象归到一个新建的组下（可撤销）。
 *
 * 用途：AI 组装的部件散在场景根下会越来越乱，"把这些放进一个组"是常见的整理操作——
 * 自己建空对象再逐个 `reparent` 要 N+1 次调用，这里一次完成，且只占一个撤销步。
 *
 * @param params.objectIds 要归组的对象，至少 1 个
 * @param params.name 组名，默认 `Group`
 * @param params.parentId 组的父级，默认与第一个成员同父级
 */
export function sceneGroup(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('需要非空的 objectIds 数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);

    // 先全部解析校验：任一项不合格都在建组前抛出，不留半成品
    const members = rawIds.map((id) =>
    {
        const objectId = String(id);
        const object = toRaw(resolveObjectId(objectId));
        const oldParent = toRaw(getLogic(object)?.parent as Object3D | null);
        if (!oldParent) throw new Error(`不能对场景根对象分组：${objectId}`);

        return {
            objectId,
            object,
            oldParent,
            index: (oldParent.children ?? []).findIndex((child) => toRaw(child) === object),
        };
    });

    const parent = params.parentId
        ? toRaw(resolveObjectId(String(params.parentId)))
        : members[0].oldParent;

    const group = {
        __type__: 'Object3D',
        name: params.name === undefined ? 'Group' : String(params.name),
    } as Object3D;

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    childrenOf(parent).push(group);
    for (const member of members)
    {
        const children = childrenOf(member.oldParent);
        const at = children.findIndex((child) => toRaw(child) === member.object);
        if (at >= 0) children.splice(at, 1);
        childrenOf(group).push(member.object);
    }

    pushCommand({
        label: `group ${members.length} objects`,
        undo: () =>
        {
            // 顺序很重要：先把成员从组里摘掉、移除组，最后才放回原父级。否则成员会**同时**
            // 挂在组与原父级下（同一个对象出现在两个 children 数组里），场景树随即损坏、
            // 后续遍历与撤销爆栈（实测踩过）
            const groupChildren = childrenOf(group);
            for (const member of members)
            {
                const at = groupChildren.findIndex((child) => toRaw(child) === toRaw(member.object));
                if (at >= 0) groupChildren.splice(at, 1);
            }

            const siblings = childrenOf(parent);
            const at = siblings.findIndex((child) => toRaw(child) === toRaw(group));
            if (at >= 0) siblings.splice(at, 1);

            // 再按原 index 升序放回原父级（同一父级下多个成员才能恢复原顺序）
            for (const member of [...members].sort((a, b) => a.index - b.index))
            {
                const children = childrenOf(member.oldParent);
                children.splice(Math.min(member.index, children.length), 0, member.object);
            }
        },
        redo: () =>
        {
            childrenOf(parent).push(group);
            for (const member of members)
            {
                // 同样要先从原父级摘掉，再放进组里
                const children = childrenOf(member.oldParent);
                const at = children.findIndex((child) => toRaw(child) === toRaw(member.object));
                if (at >= 0) children.splice(at, 1);
                childrenOf(group).push(member.object);
            }
        },
    });

    return {
        groupId: getObjectId(group),
        name: group.name,
        parentId: getObjectId(parent),
        members: members.map((member) => getObjectId(member.object)),
    };
}

export function sceneRemove(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds ?? (params.objectId === undefined ? [] : [params.objectId]);
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('需要 objectId，或非空的 objectIds 数组');
    if (rawIds.length > 200) throw new Error(`一次最多删除 200 个对象（收到 ${rawIds.length}）`);

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    // 先全部解析校验：任一项不合格都在删除前抛出。
    // 一律 toRaw：children 经响应式代理读出时元素是代理，与原始对象比较必须还原
    const targets = rawIds.map((id) =>
    {
        const objectId = String(id);
        const object = toRaw(resolveObjectId(objectId));
        const parent = toRaw(getLogic(object)?.parent as Object3D | null);
        if (!parent) throw new Error(`不能删除场景根对象：${objectId}`);

        return {
            objectId,
            object,
            parent,
            index: (parent.children ?? []).findIndex((child) => toRaw(child) === object),
        };
    });

    const detachAll = () =>
    {
        for (const target of targets)
        {
            const children = childrenOf(target.parent);
            const at = children.findIndex((child) => toRaw(child) === target.object);
            if (at >= 0) children.splice(at, 1);
        }
    };

    // 按原 index 升序插回：同一父级下多个对象才能恢复原来的顺序
    const attachAll = () =>
    {
        for (const target of [...targets].sort((a, b) => a.index - b.index))
        {
            const children = childrenOf(target.parent);
            children.splice(Math.min(target.index, children.length), 0, target.object);
        }
    };

    detachAll();
    pushCommand({
        label: targets.length === 1 ? `remove ${targets[0].objectId}` : `remove ${targets.length} objects`,
        undo: attachAll,
        redo: detachAll,
    });

    const parents: string[] = [];
    for (const target of targets)
    {
        const parentId = getObjectId(target.parent);
        if (!parents.includes(parentId)) parents.push(parentId);
    }

    return { removed: targets.map((target) => target.objectId), count: targets.length, parents };
}

// 供 P2 后续批次（reparent）复用
export { cloneValue, pushCommand, writeValue };
export type { Command };
