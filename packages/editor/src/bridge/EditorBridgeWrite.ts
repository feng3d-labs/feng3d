import { globalEmitter, logic as getLogic, serialization } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive } from '@feng3d/reactivity';
import { editorRS } from '../assets/EditorRS';
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
        if (current === null || typeof current !== 'object')
        {
            throw new Error(`路径中断于 ${segments.slice(0, i + 1).join('.')}：${path}`);
        }
        current = (current as Record<string, unknown>)[key];
    }

    if (current === null || typeof current !== 'object')
    {
        throw new Error(`路径终点不是对象/数组：${path}`);
    }

    const last = segments[segments.length - 1];

    return { holder: current as object, key: /^\d+$/.test(last) ? Number(last) : last };
}

/** 写入对象字段（可撤销） */
export function sceneSet(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    const path = String(params.path ?? '');
    if (!objectId || !path) throw new Error('需要 objectId 与 path，例如 { objectId: "/Untitled/Cube", path: "position.y", value: 1 }');

    const object = resolveObjectId(objectId);
    const { holder, key } = resolvePath(object, path);
    const hadKey = Object.prototype.hasOwnProperty.call(holder, key);
    const before = cloneValue((holder as Record<string | number, unknown>)[key]);
    const after = cloneValue(params.value);

    writeValue(holder, key, cloneValue(params.value));
    pushCommand({
        label: `set ${objectId}.${path}`,
        undo: () =>
        {
            if (hadKey) writeValue(holder, key, before);
            else delete (holder as Record<string | number, unknown>)[key];
        },
        redo: () => writeValue(holder, key, after),
    });

    return {
        objectId,
        path,
        before: hadKey ? before : null,
        after,
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

export const WRITE_HANDLERS: Record<string, (params: Record<string, unknown>) => unknown> = {
    'scene.set': (params) => sceneSet(params),
    'scene.add': (params) => sceneAdd(params),
    'scene.remove': (params) => sceneRemove(params),
    'scene.reparent': (params) => sceneReparent(params),
    'scene.save': (params) => sceneSave(params),
    'history.status': () => historyStatus(),
    'history.undo': () => historyUndo(),
    'history.redo': () => historyRedo(),
};

/**
 * 新增对象（可撤销）。
 *
 * `parentId` 省略时挂到场景根；`components` 用纯数据字面量数组，例如
 * `[{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } }]`。
 */
export function sceneAdd(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const parent = params.parentId ? resolveObjectId(String(params.parentId)) : requireSceneRoot();
    const object = {
        __type__: 'Object3D',
        name: params.name === undefined ? 'Object3D' : String(params.name),
        ...(params.position === undefined ? {} : { position: cloneValue(params.position) as object }),
        ...(params.rotation === undefined ? {} : { rotation: cloneValue(params.rotation) as object }),
        ...(params.scale === undefined ? {} : { scale: cloneValue(params.scale) as object }),
        ...(params.components === undefined ? {} : { components: cloneValue(params.components) as unknown[] }),
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
 * 删除对象（可撤销）。
 *
 * 撤销时直接插回**原对象**（而不是 `deserialize` 出来的副本）。这一点很关键：副本会改变引用，
 * 导致更早的 `add` 命令按引用找不到它、撤销失效——实测 `add → remove → undo(remove) → undo(add)`
 * 序列下最后一次撤销无效、对象残留。复用原引用后两个命令能正确互操作。
 */
export function sceneRemove(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('需要 objectId');

    const object = resolveObjectId(objectId);
    const parent = getLogic(object)?.parent as Object3D | null;
    if (!parent) throw new Error('不能删除场景根对象');

    const parentRef = parent;
    const index = (parentRef.children ?? []).indexOf(object);

    const detach = () =>
    {
        const children = reactive(parentRef as object as Record<string, unknown>).children as Object3D[];
        const at = children.indexOf(object);
        if (at >= 0) children.splice(at, 1);
    };

    detach();
    pushCommand({
        label: `remove ${objectId}`,
        undo: () =>
        {
            const children = reactive(parentRef as object as Record<string, unknown>).children as Object3D[];
            children.splice(Math.min(index, children.length), 0, object);
        },
        redo: detach,
    });

    return { removed: objectId, parentId: getObjectId(parentRef), index };
}

// 供 P2 后续批次（reparent）复用
export { cloneValue, pushCommand, writeValue };
export type { Command };
