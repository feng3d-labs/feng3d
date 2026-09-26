import {
    historyRedo, historyStatus, historyUndo, redoStack, requireWriteEnabled, rewindTo, sceneMark, sceneRollback, undoStack,
} from './write/writeCore';
import type { Command } from './write/writeCore';
import { sceneArrange, sceneSetFields, sceneSetMany, sceneSet } from './write/writeSet';
import { sceneSetMaterial, sceneSetEnvironment } from './write/writeMaterial';
import { sceneDuplicate, sceneAdd, sceneImport } from './write/writeObject';
import { sceneReparent, sceneRemove, sceneGroup } from './write/writeTree';
import { logClear, sceneSave } from './write/writeMisc';
export { isWriteEnabled } from './write/writeCore';

/** 批量操作的最多步数（超过这个规模，失败回滚的代价与不可控性都不划算） */
const MAX_BATCH_STEPS = 50;

/**
 * 把场景与**两个栈**都退回 `depth`：失败回滚与预演共用。
 *
 * 只回退撤销栈是不够的——被回滚的命令会落进重做栈，于是"已经回滚掉"的操作还能被一次
 * `history.redo` 重新装上；同时调用方原本的重做历史也被 `pushCommand` 清空了，
 * 等于"看一眼就丢掉了他的重做记录"。两个栈都恢复，才算真的像没发生过。
 *
 * @param depth 目标撤销栈深度
 * @param savedRedo 调用前重做栈的快照
 */
function restoreTo(depth: number, savedRedo: readonly Command[]): string[]
{
    let undone: string[] = [];
    try
    {
        undone = rewindTo(depth, { discard: true });
    }
    finally
    {
        redoStack.length = 0;
        for (const command of savedRedo) redoStack.push(command);
    }

    return undone;
}

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
    const savedRedo = redoStack.slice();
    const dryRun = params.dryRun === true;
    const results: unknown[] = [];

    // 先把整组步骤解析并校验一遍再动手：走到第 3 步才发现它不能回滚时，前两步已经落笔了，
    // "要么全成、要么全不成"从那一刻起就不成立
    const planned = steps.map((raw, index) =>
    {
        const step = raw as { method?: unknown, params?: unknown } | null;
        const method = String((step && step.method) ?? '');
        // 嵌套 batch 会让"失败回滚到哪一层"变得难以推理，直接拒绝
        if (method === 'scene.batch') throw new Error('steps 里不允许再嵌套 scene.batch');
        const handler = WRITE_HANDLERS[method];
        if (!handler) throw new Error(`第 ${index + 1} 步的 method 不是写方法：${method || '(空)'}`);
        // 事务的前提是每一步都能靠撤销栈退回来。`history.undo` 会把栈弄**短**、`scene.save` 与
        // `log.clear` 的效果根本不在栈上——放进事务里，"失败即回到调用前"就成了空话
        // （实测 batch 报"已回滚 0 步，场景回到调用前"，而它前面那步的撤销已经生效、对象已经消失）
        if (!REVERSIBLE_WRITE_METHODS.has(method))
        {
            throw new Error(
                `第 ${index + 1} 步的 method 不能放进 scene.batch：${method}`
                + '（它的效果不能用撤销栈回滚，事务语义不成立）。请在 batch 之外单独调用',
            );
        }

        return { index, method, handler, params: (step?.params ?? {}) as Record<string, unknown> };
    });

    for (const step of planned)
    {
        try
        {
            results.push(step.handler(step.params));
        }
        catch (error)
        {
            const undone = restoreTo(startDepth, savedRedo);
            throw new Error(
                `第 ${step.index + 1} 步（${step.method}）失败：${(error as { message?: string })?.message ?? error}`
                + `——已回滚 ${undone.length} 步，场景回到调用前`,
            );
        }
    }

    // dryRun：把这组操作**真的跑一遍**再原样回滚，于是返回的是"实际会发生什么"（每一步的结果、
    // 新对象的 id、校验是否通过），而不是靠调用方脑补。场景与撤销栈都回到调用前。
    if (dryRun)
    {
        const rolledBack = restoreTo(startDepth, savedRedo);

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
 * 支持 `dryRun` 预演的写方法，同时也是 `scene.batch` 允许的步骤白名单。
 *
 * 共同点是**效果都通过撤销栈可回滚**。反过来，`log.clear`（清空日志）、`scene.save`
 * （写存储）、`history.undo` 这些的效果不在撤销栈里——对它们"预演"等于真的执行了，
 * 放进事务里则连"失败回滚"都做不到，所以宁可明确拒绝，也不能假装什么都没发生。
 */
export const REVERSIBLE_WRITE_METHODS = new Set([
    'scene.set', 'scene.setMany', 'scene.setFields', 'scene.setEnvironment', 'scene.setMaterial',
    'scene.arrange', 'scene.add', 'scene.import', 'scene.duplicate', 'scene.group', 'scene.remove', 'scene.reparent',
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
            if (!REVERSIBLE_WRITE_METHODS.has(name))
            {
                throw new Error(`${name} 不支持 dryRun（它的效果不进撤销栈、无法回滚），请直接执行`);
            }

            const depth = undoStack.length;
            const savedRedo = redoStack.slice();
            try
            {
                const result = handler(params);
                const rolledBack = restoreTo(depth, savedRedo);

                return {
                    dryRun: true,
                    result,
                    rolledBack: rolledBack.length,
                    hint: '预演：场景与撤销栈均未变化。正式执行时去掉 dryRun',
                };
            }
            catch (error)
            {
                // handler 抛错时可能已经落笔了一半：照同样口径回滚（含重做栈），再原样抛出
                try
                {
                    restoreTo(depth, savedRedo);
                }
                catch
                {
                    // 回滚本身失败也不能掩盖原始错误
                }
                throw error;
            }
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
    'scene.import': (params) => sceneImport(params),
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
