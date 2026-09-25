import {
    historyRedo, historyStatus, historyUndo, redoStack, requireWriteEnabled, rewindTo, sceneMark, sceneRollback, undoStack,
} from './write/writeCore';
import { sceneArrange, sceneSetFields, sceneSetMany, sceneSet } from './write/writeSet';
import { sceneSetMaterial, sceneSetEnvironment } from './write/writeMaterial';
import { sceneDuplicate, sceneAdd } from './write/writeObject';
import { sceneReparent, sceneRemove, sceneGroup } from './write/writeTree';
import { logClear, sceneSave } from './write/writeMisc';
export { isWriteEnabled } from './write/writeCore';

/** 批量操作的最多步数（超过这个规模，失败回滚的代价与不可控性都不划算） */
const MAX_BATCH_STEPS = 50;

/**
 * 一次调用执行多步写操作，**要么全成、要么全不成**（事务语义）。
 *
 * 为什么需要它：AI 搭一个多部件的东西（比如四条腿的桌子）要连着调五六次——中途任一步失败，
 * 前面几步留下的半成品就得靠**再调几次**去清理，而失败信息里并不包含"我已经建了哪些"。
 * 这里把整组操作当成一个事务：失败时逆序撤销已完成的步骤，场景直接回到起点。
 *
 * 与 `scene.mark` / `scene.rollback` 的区别：那两个是**显式**的试验-回退（适合探索），
 * 这个是**自动**的（适合"确定要做的事，只是步骤多"）。
 *
 * @param params.steps 形如 `[{ method: 'scene.add', params: {...} }, ...]`，最多 50 步；
 *   只接受写方法（只读方法请单独调用），不允许嵌套 `scene.batch`
 * @param params.dryRun 传 `true` 时只**预演**：整组操作照常执行一遍再全部回滚，
 *   返回每一步的结果供确认，场景与撤销栈都不变
 */
export function sceneBatch(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const steps = params.steps;
    if (!Array.isArray(steps) || steps.length === 0)
    {
        throw new Error('需要非空的 steps 数组，例如 [{ method: "scene.add", params: { name: "Leg" } }]');
    }
    if (steps.length > MAX_BATCH_STEPS) throw new Error(`一次最多 ${MAX_BATCH_STEPS} 步（收到 ${steps.length}）——拆成多次 scene.batch 调用即可`);

    const startDepth = undoStack.length;
    const dryRun = params.dryRun === true;
    const results: unknown[] = [];

    for (let index = 0; index < steps.length; index++)
    {
        const step = steps[index] as { method?: unknown, params?: unknown } | null;
        const method = String((step && step.method) ?? '');
        const handler = WRITE_HANDLERS[method];
        // 嵌套 batch 会让"失败回滚到哪一层"变得难以推理，直接拒绝
        if (method === 'scene.batch') throw new Error('steps 里不允许再嵌套 scene.batch');
        if (!handler) throw new Error(`第 ${index + 1} 步的 method 不是写方法：${method || '(空)'}`);

        try
        {
            results.push(handler((step?.params ?? {}) as Record<string, unknown>));
        }
        catch (error)
        {
            const undone = rewindTo(startDepth);
            throw new Error(
                `第 ${index + 1} 步（${method}）失败：${(error as { message?: string })?.message ?? error}`
                + `——已回滚 ${undone.length} 步，场景回到调用前`,
            );
        }
    }

    // dryRun：把这组操作**真的跑一遍**再原样回滚，于是返回的是"实际会发生什么"（每一步的结果、
    // 新对象的 id、校验是否通过），而不是靠调用方脑补。场景与撤销栈都回到调用前。
    if (dryRun)
    {
        const rolledBack = rewindTo(startDepth);

        return {
            dryRun: true,
            steps: results.length,
            results,
            rolledBack: rolledBack.length,
            hint: '预演：场景与撤销栈均未变化。正式执行时去掉 dryRun（新对象的 id 会重新分配）',
        };
    }

    return {
        steps: results.length,
        results,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
        hint: '整组操作在撤销栈上仍是分开的条目，可用 scene.mark/scene.rollback 一次退回',
    };
}

/**
 * 支持 `dryRun` 预演的写方法。
 *
 * 共同点是**效果都通过撤销栈可回滚**。反过来，`log.clear`（清空日志）、`scene.save`
 * （写存储）、`history.undo` 这些的效果不在撤销栈里——对它们"预演"等于真的执行了，
 * 所以宁可明确拒绝，也不能假装什么都没发生。
 */
const DRY_RUN_METHODS = new Set([
    'scene.set', 'scene.setMany', 'scene.setFields', 'scene.setEnvironment', 'scene.setMaterial',
    'scene.arrange', 'scene.add', 'scene.duplicate', 'scene.group', 'scene.remove', 'scene.reparent',
]);

/**
 * 给写方法统一加上 `dryRun`：传 `true` 时照常执行一遍再原样回滚，返回"实际会发生什么"
 * （每步结果、新对象 id、校验是否通过），而场景与撤销栈都回到调用前。
 *
 * 放在这一层而不是每个方法里各写一遍：`scene.batch` 已有自己的 dryRun（它还要区分成功/失败
 * 路径），其余方法共用这里就够了——否则迟早出现"有的方法支持、有的不支持"。
 *
 * `scene.batch` 会被原样放行（它自己处理）。
 */
function withDryRun(
    handlers: Record<string, (params: Record<string, unknown>) => unknown>,
): Record<string, (params: Record<string, unknown>) => unknown>
{
    const wrapped: Record<string, (params: Record<string, unknown>) => unknown> = {};
    for (const [name, handler] of Object.entries(handlers))
    {
        if (name === 'scene.batch')
        {
            wrapped[name] = handler;
            continue;
        }
        wrapped[name] = (params) =>
        {
            if (params.dryRun !== true) return handler(params);
            if (!DRY_RUN_METHODS.has(name))
            {
                throw new Error(`${name} 不支持 dryRun（它的效果不进撤销栈、无法回滚），请直接执行`);
            }

            const depth = undoStack.length;
            const result = handler(params);
            const rolledBack = rewindTo(depth);

            return {
                dryRun: true,
                result,
                rolledBack: rolledBack.length,
                hint: '预演：场景与撤销栈均未变化。正式执行时去掉 dryRun',
            };
        };
    }

    return wrapped;
}

const RAW_WRITE_HANDLERS: Record<string, (params: Record<string, unknown>) => unknown> = {
    'scene.set': (params) => sceneSet(params),
    'scene.setMany': (params) => sceneSetMany(params),
    'scene.setFields': (params) => sceneSetFields(params),
    'scene.setEnvironment': (params) => sceneSetEnvironment(params),
    'scene.setMaterial': (params) => sceneSetMaterial(params),
    'scene.arrange': (params) => sceneArrange(params),
    'scene.add': (params) => sceneAdd(params),
    'scene.duplicate': (params) => sceneDuplicate(params),
    'scene.group': (params) => sceneGroup(params),
    'scene.remove': (params) => sceneRemove(params),
    'scene.reparent': (params) => sceneReparent(params),
    'scene.save': (params) => sceneSave(params),
    'history.status': (params) => historyStatus(params),
    'history.undo': (params) => historyUndo(params),
    'history.redo': (params) => historyRedo(params),
    'scene.mark': (params) => sceneMark(params),
    'scene.rollback': (params) => sceneRollback(params),
    'scene.batch': (params) => sceneBatch(params),
    'log.clear': () => logClear(),
};

/** 写方法总表（统一带上 dryRun 预演；`scene.batch` 自己处理） */
export const WRITE_HANDLERS = withDryRun(RAW_WRITE_HANDLERS);
