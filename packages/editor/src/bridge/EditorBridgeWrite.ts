import { reactive } from '@feng3d/reactivity';
import { resolveObjectId } from './EditorBridge';

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
export const WRITE_HANDLERS: Record<string, (params: Record<string, unknown>) => unknown> = {
    'scene.set': (params) => sceneSet(params),
    'history.status': () => historyStatus(),
    'history.undo': () => historyUndo(),
    'history.redo': () => historyRedo(),
};

// 供 P2 后续批次（add / remove / reparent）复用
export { cloneValue, pushCommand, writeValue };
export type { Command };
