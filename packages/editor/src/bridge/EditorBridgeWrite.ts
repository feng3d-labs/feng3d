import { globalEmitter, logic as getLogic, serialization } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive } from '@feng3d/reactivity';
import { editorRS } from '../assets/EditorRS';
import { clearEditorLogs } from '../utils/editorLog';
import { getObjectId, requireSceneRoot, resolveObjectId } from './EditorBridge';

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

    const object = resolveObjectId(objectId);
    const newParent = resolveObjectId(parentId);
    const oldParent = getLogic(object)?.parent as Object3D | null;
    if (!oldParent) throw new Error('不能移动场景根对象');

    // 防环：把对象挂到自己的子孙下会让场景树遍历死循环
    let ancestor: Object3D | null = newParent;
    while (ancestor)
    {
        if (ancestor === object) throw new Error('不能把对象移动到它自己的子孙下');
        ancestor = getLogic(ancestor)?.parent as Object3D | null;
    }

    const oldIndex = (oldParent.children ?? []).indexOf(object);
    const newIndex = params.index === undefined ? undefined : Number(params.index);

    const childrenOf = (parent: Object3D) =>
        reactive(parent as object as Record<string, unknown>).children as Object3D[];
    const detach = (parent: Object3D) =>
    {
        const children = childrenOf(parent);
        const at = children.indexOf(object);
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
    'scene.add': (params) => sceneAdd(params),
    'scene.duplicate': (params) => sceneDuplicate(params),
    'scene.remove': (params) => sceneRemove(params),
    'scene.reparent': (params) => sceneReparent(params),
    'scene.save': (params) => sceneSave(params),
    'history.status': () => historyStatus(),
    'history.undo': () => historyUndo(),
    'history.redo': () => historyRedo(),
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
            const index = children.indexOf(object);
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
            const index = children.indexOf(clone);
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
export function sceneRemove(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds ?? (params.objectId === undefined ? [] : [params.objectId]);
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('需要 objectId，或非空的 objectIds 数组');
    if (rawIds.length > 200) throw new Error(`一次最多删除 200 个对象（收到 ${rawIds.length}）`);

    const childrenOf = (target: Object3D) =>
        reactive(target as object as Record<string, unknown>).children as Object3D[];

    // 先全部解析校验：任一项不合格都在删除前抛出
    const targets = rawIds.map((id) =>
    {
        const objectId = String(id);
        const object = resolveObjectId(objectId);
        const parent = getLogic(object)?.parent as Object3D | null;
        if (!parent) throw new Error(`不能删除场景根对象：${objectId}`);

        return { objectId, object, parent, index: (parent.children ?? []).indexOf(object) };
    });

    const detachAll = () =>
    {
        for (const target of targets)
        {
            const children = childrenOf(target.parent);
            const at = children.indexOf(target.object);
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
