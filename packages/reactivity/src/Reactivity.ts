import { type ComputedReactivity } from './computed';

/**
 * 反应式节点基类。
 *
 * 拥有节点值以及被捕捉与触发的能力。
 * 用于被 computed、effect 等构建的节点所继承。
 *
 * 实现了响应式系统的核心功能：
 * 1. 值的存储和访问
 * 2. 依赖关系的建立（track）
 * 3. 变更通知的传播（trigger）
 */
export class Reactivity<T = any>
{
    /**
     * 获取当前节点值。
     *
     * 取值时将会建立与父节点的依赖关系。
     * 当其他响应式节点访问此值时，会自动建立依赖关系。
     */
    get value(): T
    {
        this.track();

        return this._value;
    }

    /**
     * @private
     */
    _value!: T;

    /**
     * 父反应节点集合。
     *
     * 记录了哪些节点依赖了当前节点。
     * 当当前节点值发生变化时，会通知所有父节点。
     *
     * Map 的 key 是父节点，value 是父节点的版本号。
     * 版本号用于判断依赖关系是否过期。
     *
     * @private
     */
    _parents = new Map<ComputedReactivity, number>();

    /**
     * 建立依赖关系。
     *
     * 当其他节点访问当前节点的值时，会调用此方法。
     * 将当前节点与访问者（父节点）建立依赖关系。
     *
     * 如果当前没有活动的响应式节点，或者不应该跟踪依赖，则不会建立依赖关系。
     */
    track()
    {
        if (!Reactivity.activeReactivity || !_shouldTrack) return;

        // 连接父节点和子节点。
        const parent = Reactivity.activeReactivity;

        if (parent)
        {
            this._parents.set(parent, parent._version);
        }
    }

    /**
     * 触发更新。
     *
     * 当节点值发生变化时，会调用此方法。
     * 通知所有依赖此节点的父节点进行更新。
     *
     * 更新过程：
     * 1. 遍历所有父节点
     * 2. 检查父节点的版本号是否匹配
     * 3. 触发父节点的更新
     * 4. 将当前节点添加到父节点的失效子节点集合中
     */
    trigger()
    {
        // 冒泡到所有父节点，设置失效子节点字典。
        this._parents.forEach((version, parent) =>
        {
            if (parent._version !== version) return;

            parent.trigger();
            // 失效时添加子节点到父节点中。
            parent._children.set(this, this._value);
        });

        //
        this._parents.clear();
    }

    /**
     * 当前正在执行的反应式节点。
     *
     * 用于在依赖收集过程中标识当前正在执行的节点。
     * 当其他节点访问此节点的值时，会将其作为父节点。
     *
     * @internal
     */
    static activeReactivity: ComputedReactivity | undefined;
}

/**
 * 反应式节点链。
 *
 * 用于表示响应式节点之间的依赖关系链。
 * 每个节点包含：
 * 1. 节点本身
 * 2. 节点的值
 * 3. 下一个节点的引用
 */
export type ReactivityLink = { node: Reactivity, value: any, next: ReactivityLink };

/**
 * 强制跟踪依赖。
 *
 * 在函数执行期间强制启用依赖跟踪。
 * 即使当前处于不跟踪状态，也会建立依赖关系。
 *
 * @param fn 要执行的函数
 * @returns 函数的执行结果
 */
export function forceTrack<T>(fn: () => T): T
{
    const preShouldTrack = _shouldTrack;

    _shouldTrack = true;
    const result = fn();

    _shouldTrack = preShouldTrack;

    return result;
}

/**
 * 禁用依赖跟踪。
 *
 * 在函数执行期间禁用依赖跟踪。
 * 即使当前处于跟踪状态，也不会建立依赖关系。
 *
 * @param fn 要执行的函数
 * @returns 函数的执行结果
 */
export function noTrack<T>(fn: () => T): T
{
    const preShouldTrack = _shouldTrack;

    _shouldTrack = false;
    const result = fn();

    _shouldTrack = preShouldTrack;

    return result;
}

/**
 * 是否应该跟踪依赖的标志。
 *
 * 控制是否进行依赖跟踪。
 * 可以通过 forceTrack 和 noTrack 函数临时修改此值。
 *
 * @private
 */
let _shouldTrack = true;
