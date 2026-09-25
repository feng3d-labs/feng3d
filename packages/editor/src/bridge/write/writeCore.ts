import { globalEmitter } from 'feng3d';
import { reactive } from '@feng3d/reactivity';

interface Command
{
    readonly label: string;
    undo(): void;
    redo(): void;
}

/** 撤销栈与重做栈 */
export const undoStack: Command[] = [];

export const redoStack: Command[] = [];

/**
 * 撤销栈上限。
 *
 * 取 500 而不是更小：AI 搭一整个场景可能连着写上百次，上限太小会让"撤回到起点"变成
 * **悄悄做不到**——用户以为撤销是完整的，实际早期的操作早已被挤掉。
 */
const MAX_HISTORY = 500;

/** 是否发生过裁剪（一旦发生，"撤销到底"就不等于"回到最初"了，得如实告诉调用方） */
let historyTruncated = false;

export function pushCommand(command: Command): void
{
    undoStack.push(command);
    redoStack.length = 0;
    if (undoStack.length > MAX_HISTORY)
    {
        undoStack.shift();
        historyTruncated = true;
    }

    // 写操作后通知编辑器刷新：层级面板 / 检查器等组件监听 editor.selectedObjectsChanged。
    // 不发这个事件的话，新增或删除的对象在这些面板里看不到（实测层级面板不出现新对象）。
    globalEmitter.emit('editor.selectedObjectsChanged' as never);
}

/** 写入原始数据（经响应式代理，与人工编辑同构） */
export function writeValue(holder: object, key: string | number, value: unknown): void
{
    const r_holder = reactive(holder as Record<string | number, unknown>);
    r_holder[key] = value;
}

// cloneValue 是纯函数，实现放在 writePure（好让单元测试直接覆盖）；这里转出，既有 import 路径不变
export { cloneValue } from './writePure';

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

export function requireWriteEnabled(): void
{
    if (isWriteEnabled()) return;
    throw new Error(
        '写通道未启用（P2 默认关闭）。启用方式：在编辑器 URL 后加 ?bridge=write，'
        + '或在控制台执行 localStorage.setItem("editor-bridge-write", "1") 后刷新。',
    );
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
 * 把撤销栈回退到指定深度，返回被撤销的操作标签（按撤销顺序）。
 *
 * `scene.rollback`（退回标记处）与 `scene.batch`（失败时回滚）本来就是同一件事，抽出来共用——
 * 两份实现很容易在其中一处漏掉"被撤销的命令还要进 redo 栈"这类细节。
 *
 * @param depth 目标深度（即 `undoStack.length` 要变成的值）
 */
export function rewindTo(depth: number): string[]
{
    const undone: string[] = [];
    while (undoStack.length > depth)
    {
        const command = undoStack.pop();
        if (!command) break;
        command.undo();
        redoStack.push(command);
        undone.push(command.label);
    }

    return undone;
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

    const undone = rewindTo(depth);
    marksMap.delete(name);

    return {
        mark: name,
        undoneCount: undone.length,
        undone,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/**
 * 撤销栈状态。
 *
 * `labels` 默认只给最近 20 条：两百个对象的场景里全量标签会让每次调用多出几百个字符串，
 * 而 AI 通常只关心"我刚做了什么、还能退几步"。
 *
 * @param params.labels 返回最近多少条操作标签，默认 20，传 0 表示不返回，上限 200
 */
export function historyStatus(params: Record<string, unknown> = {}): unknown
{
    const requested = params.labels === undefined ? 20 : Number(params.labels);
    const labelCount = Number.isFinite(requested) ? Math.max(0, Math.min(200, Math.floor(requested))) : 20;

    return {
        writeEnabled: isWriteEnabled(),
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        limit: MAX_HISTORY,
        // 发生过裁剪时，`history.undo` 连按到底也回不到最初状态——这比"还能退几步"更需要被知道
        ...(historyTruncated ? { truncated: true, hint: `历史超过 ${MAX_HISTORY} 步，更早的操作已被丢弃` } : {}),
        ...(labelCount > 0 ? { labels: undoStack.slice(-labelCount).map((c) => c.label) } : {}),
    };
}

/**
 * 撤销若干步。
 *
 * @param params.count 撤销步数（默认 1，上限 50）——"退掉我刚才那几步"不必调 N 次往返
 * @param params.labels 是否返回被撤销的操作标签（默认 `true`）
 */
export function historyUndo(params: Record<string, unknown> = {}): unknown
{
    requireWriteEnabled();

    const requested = params.count === undefined ? 1 : Number(params.count);
    if (!Number.isFinite(requested) || requested < 1)
    {
        throw new Error(`count 需要正整数，收到：${JSON.stringify(params.count)}`);
    }
    const count = Math.min(50, Math.floor(requested));

    const undone: string[] = [];
    for (let i = 0; i < count; i++)
    {
        const command = undoStack.pop();
        if (!command) break;
        command.undo();
        redoStack.push(command);
        undone.push(command.label);
    }
    if (undone.length === 0) return { undone: null, message: '没有可撤销的操作' };

    return {
        // 单步时保持原来的形态（调用方可能直接读它当标签用）
        undone: undone.length === 1 ? undone[0] : `已撤销 ${undone.length} 步`,
        undoneCount: undone.length,
        ...(params.labels === false ? {} : { labels: undone }),
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/**
 * 重做若干步。
 *
 * @param params.count 重做步数（默认 1，上限 50）
 * @param params.labels 是否返回被重做的操作标签（默认 `true`）
 */
export function historyRedo(params: Record<string, unknown> = {}): unknown
{
    requireWriteEnabled();

    const requested = params.count === undefined ? 1 : Number(params.count);
    if (!Number.isFinite(requested) || requested < 1)
    {
        throw new Error(`count 需要正整数，收到：${JSON.stringify(params.count)}`);
    }
    const count = Math.min(50, Math.floor(requested));

    const redone: string[] = [];
    for (let i = 0; i < count; i++)
    {
        const command = redoStack.pop();
        if (!command) break;
        command.redo();
        undoStack.push(command);
        redone.push(command.label);
    }
    if (redone.length === 0) return { redone: null, message: '没有可重做的操作' };

    return {
        redone: redone.length === 1 ? redone[0] : `已重做 ${redone.length} 步`,
        redoneCount: redone.length,
        ...(params.labels === false ? {} : { labels: redone }),
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/** P2 写方法表（供 EditorBridge 合并；全部需要写通道已启用） */
