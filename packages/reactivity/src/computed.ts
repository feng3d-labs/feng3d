import { batch } from './batch';
import { Reactivity, forceTrack } from './Reactivity';

/**
 * 创建计算反应式对象。
 *
 * 计算属性会缓存计算结果，只有当依赖发生变化时才会重新计算。
 *
 * @param func 计算函数，可以访问其他响应式数据，并返回计算结果
 * @returns 包含 value 属性的计算属性对象
 */
export function computed<T>(func: (oldValue?: T) => T): Computed<T>
{
    return new ComputedReactivity(func) as any;
}

/**
 * 计算属性接口。
 *
 * 定义了计算属性的基本结构：
 * 1. value: 计算属性的当前值
 * 2. ComputedSymbol: 用于标识这是一个计算属性
 */
export interface Computed<T = any>
{
    readonly value: T
    [ComputedSymbol]: true
}
declare const ComputedSymbol: unique symbol;

/**
 * 计算反应式节点接口。
 *
 * 继承自 Computed 接口，表示这是一个计算反应式节点。
 */
export interface ComputedReactivity<T = any> extends Computed<T> { }

/**
 * 计算反应式节点类。
 *
 * 当使用 computed 函数时，会创建一个 ComputedReactivity 对象。
 * 实现了计算属性的核心功能：
 * 1. 缓存计算结果
 * 2. 按需重新计算
 * 3. 依赖追踪
 * 4. 变更通知
 */
export class ComputedReactivity<T = any> extends Reactivity<T>
{
    /**
     * 标识这是一个 ref 对象。
     *
     * @internal
     */
    readonly __v_isRef = true;

    /**
     * 计算函数。
     *
     * 用于计算属性值的函数，可以访问其他响应式数据。
     * 当依赖发生变化时，会重新执行此函数。
     */
    protected _func: (oldValue?: T) => T;

    /**
     * 失效子节点集合。
     *
     * 记录所有依赖此计算属性的子节点。
     * 当计算属性重新计算时，会通知这些子节点。
     *
     * @private
     */
    _children = new Map<Reactivity, any>();

    /**
     * 脏标记。
     *
     * 表示计算属性是否需要重新计算。
     * 当依赖发生变化时，会设置此标记。
     * 重新计算后会清除此标记。
     *
     * @private
     */
    _isDirty = true;

    /**
     * 版本号。
     *
     * 每次重新计算后自动递增。
     * 用于判断子节点中的父节点引用是否过期。
     * 当子节点发现父节点的版本号不匹配时，会重新建立依赖关系。
     *
     * @private
     */
    _version = -1;

    /**
     * 获取计算属性的值。
     *
     * 取值时会：
     * 1. 检查是否需要重新计算
     * 2. 建立与父节点的依赖关系
     * 3. 返回当前值
     */
    get value(): T
    {
        this.runIfDirty();
        this.track();

        return this._value;
    }

    /**
     * 创建计算反应式节点。
     *
     * @param func 计算函数，可以访问其他响应式数据，并返回计算结果
     */
    constructor(func: (oldValue?: T) => T)
    {
        super();
        this._func = func;
    }

    /**
     * 触发更新。
     *
     * 当依赖发生变化时，会调用此方法。
     * 如果当前正在执行计算，会将更新延迟到计算完成后。
     * 否则，立即通知所有父节点进行更新。
     */
    trigger(): void
    {
        // 正在运行时被触发，需要在运行结束后修复父子节点关系
        if (Reactivity.activeReactivity === this)
        {
            batch(this, Reactivity.activeReactivity === this);
        }

        super.trigger();
    }

    /**
     * 执行计算。
     *
     * 执行计算函数，更新当前值。
     * 在计算过程中会：
     * 1. 强制启用依赖跟踪
     * 2. 保存并设置当前活动节点
     * 3. 执行计算函数
     * 4. 恢复活动节点
     */
    run()
    {
        // 不受嵌套的 effect 影响
        forceTrack(() =>
        {
            // 保存当前节点作为父节点
            const parentReactiveNode = Reactivity.activeReactivity;

            // 设置当前节点为活跃节点
            Reactivity.activeReactivity = this as any;

            this._version++;
            this._value = this._func(this._value);

            // 执行完毕后恢复父节点
            Reactivity.activeReactivity = parentReactiveNode;
        });
    }

    /**
     * 检查并执行计算。
     *
     * 检查当前节点是否需要重新计算：
     * 1. 如果脏标记为 true，需要重新计算
     * 2. 如果子节点发生变化，需要重新计算
     *
     * 重新计算后会清除脏标记。
     */
    runIfDirty()
    {
        // 检查是否存在失效子节点字典
        this._isDirty = this._isDirty || this.isChildrenChanged();

        // 标记为脏的情况下，执行计算
        if (this._isDirty)
        {
            // 立即去除脏标记，避免循环多重计算
            this._isDirty = false;

            // 执行计算
            this.run();
        }
    }

    /**
     * 检查子节点是否发生变化。
     *
     * 遍历所有子节点，检查它们的值是否发生变化。
     * 如果发生变化，返回 true，否则返回 false。
     *
     * 在检查过程中会：
     * 1. 临时禁用依赖跟踪
     * 2. 检查每个子节点的值
     * 3. 如果子节点没有变化，重新建立依赖关系
     * 4. 清空子节点集合
     *
     * @returns 是否有子节点发生变化
     */
    protected isChildrenChanged()
    {
        if (this._children.size === 0) return false;

        // 检查是否存在子节点发生变化
        let isChanged = false;

        // 避免在检查过程建立依赖关系
        const preReactiveNode = Reactivity.activeReactivity;

        Reactivity.activeReactivity = undefined;

        // 检查子节点是否发生变化
        this._children.forEach((value, node) =>
        {
            if (isChanged) return;
            if (node.value !== value)
            {
                // 子节点变化，需要重新计算
                isChanged = true;

                return;
            }
        });

        // 恢复父节点
        Reactivity.activeReactivity = preReactiveNode;

        if (!isChanged)
        {
            // 修复与子节点关系
            this._children.forEach((version, node) =>
            {
                node._parents.set(this, this._version);
            });
        }

        // 清空子节点
        this._children.clear();

        return isChanged;
    }
}

