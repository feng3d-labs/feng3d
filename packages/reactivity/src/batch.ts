import { ComputedReactivity } from './computed';
import { Reactivity } from './Reactivity';

/**
 * 合批处理依赖。
 *
 * 将依赖添加到待处理队列中，根据依赖的运行状态决定处理方式：
 * 1. 如果依赖正在运行，添加到已运行队列
 * 2. 如果依赖未运行，添加到待运行队列
 *
 * @param dep 要处理的依赖
 * @param isRunning 依赖是否正在运行
 */
export function batch(dep: ComputedReactivity, isRunning: boolean): void
{
    if (isRunning)
    {
        // 如果依赖已经在队列中，直接返回，避免重复添加
        if (_isRunedDeps.indexOf(dep) !== -1)
        {
            return;
        }

        _isRunedDeps.push(dep);
    }
    else
    {
        // 如果依赖已经在队列中，直接返回，避免重复添加
        if (_needEffectDeps.indexOf(dep) !== -1)
        {
            return;
        }

        _needEffectDeps.push(dep);
    }
}

/**
 * 批次执行多次修改反应式对象。
 *
 * 将多个响应式更新合并为一个批次执行，可以减少不必要的反应式触发。
 * 在批次执行期间：
 * 1. 所有响应式更新都会被收集
 * 2. 批次结束后统一处理所有更新
 * 3. 避免中间状态触发不必要的更新
 *
 * 示例：
 * ```ts
 * batchRun(() => {
 *     // 修改反应式对象
 *     reactiveObj.a = 1;
 *     reactiveObj.b = 2;
 * })
 * ```
 *
 * @param fn 要执行的函数，在此函数中多次修改反应式对象
 * @returns 函数的执行结果
 */
export function batchRun<T>(fn: () => T): T
{
    _batchDepth++;

    const result = fn();

    if (--_batchDepth > 0)
    {
        return result;
    }

    // 处理已经运行过的依赖
    if (_isRunedDeps.length > 0)
    {
        _isRunedDeps.forEach((dep) =>
        {
            // 此时依赖以及子依赖都已经运行过了，只需修复与子节点关系
            __DEV__ && console.assert(dep._isDirty === false, 'dep.dirty === false');

            // 修复与子节点关系
            dep._children.forEach((version, node) =>
            {
                node._parents.set(dep, dep._version);
            });
            dep._children.clear();
        });
        _isRunedDeps.length = 0;
    }

    // 批次处理待运行的依赖
    if (_needEffectDeps.length > 0)
    {
        _needEffectDeps.forEach((dep) =>
        {
            // 独立执行回调，避免影响其他依赖
            const pre = Reactivity.activeReactivity;

            Reactivity.activeReactivity = undefined;

            dep.runIfDirty();

            Reactivity.activeReactivity = pre;
        });
        _needEffectDeps.length = 0;
    }

    return result;
}

/**
 * 批次深度。
 *
 * 用于跟踪嵌套的批次执行。
 * 当深度大于 0 时，表示当前正在批次执行中。
 */
let _batchDepth = 0;

/**
 * 待运行的依赖队列。
 *
 * 存储需要执行但尚未执行的依赖。
 * 在批次执行结束后，会统一处理这些依赖。
 */
const _needEffectDeps: ComputedReactivity[] = [];

/**
 * 已运行的依赖队列。
 *
 * 存储已经执行过的依赖。
 * 这些依赖只需要修复与子节点的关系，不需要重新执行。
 */
const _isRunedDeps: ComputedReactivity[] = [];
