import { batchRun } from './batch';
import { Reactivity } from './Reactivity';
import { toReactive } from './reactive';
import { ReactiveFlags } from './shared/constants';
import { hasChanged, toRaw } from './shared/general';

/**
 * 创建一个引用，该引用的值可以被响应式系统追踪和更新。
 *
 * ref 是响应式系统中最基本的响应式对象。
 * 它可以包装任何类型的值，使其成为响应式的。
 *
 * 特点：
 * 1. 可以包装任何类型的值
 * 2. 通过 .value 访问和修改值
 * 3. 自动解包原始值
 * 4. 支持嵌套的响应式对象
 *
 * @param value 要包装的值
 * @returns 包含 value 属性的响应式引用对象
 */
export function ref<T>(value?: T): Ref<T>
{
    if (isRef(value))
    {
        return value as any;
    }

    return new RefReactivity<T>(value as T) as any;
}

/**
 * 判断一个对象是否为引用。
 *
 * 通过检查对象是否具有 IS_REF 标志来判断。
 *
 * @param r 要检查的对象
 * @returns 如果是引用则返回 true，否则返回 false
 */
export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>;
export function isRef(r: any): r is Ref
{
    return r ? r[ReactiveFlags.IS_REF] === true : false;
}

/**
 * 引用反应式节点接口。
 *
 * 继承自 Ref 接口，表示这是一个引用反应式节点。
 */
export interface RefReactivity<T = any> extends Ref<T> { }

/**
 * 引用反应式节点类。
 *
 * 当使用 ref 函数时，会创建一个 RefReactivity 对象。
 * 实现了引用的核心功能：
 * 1. 值的存储和访问
 * 2. 值的自动解包
 * 3. 变更通知
 * 4. 依赖追踪
 */
export class RefReactivity<T = any> extends Reactivity<T> implements Ref<T>
{
    /**
     * 标识这是一个 ref 对象。
     *
     * 用于 isRef 函数判断对象是否为引用。
     */
    public readonly [ReactiveFlags.IS_REF] = true;

    /**
     * 获取引用的值。
     *
     * 取值时会：
     * 1. 建立依赖关系
     * 2. 返回当前值
     */
    get value()
    {
        this.track();

        return this._value;
    }

    /**
     * 设置引用的值。
     *
     * 设置值时会：
     * 1. 比较新旧值是否发生变化
     * 2. 如果值发生变化，则：
     *    - 触发更新通知
     *    - 更新原始值
     *    - 更新响应式值
     *
     * @param v 要设置的新值
     */
    set value(v: T)
    {
        const oldValue = this._rawValue;
        const newValue = toRaw(v);

        if (!hasChanged(oldValue, newValue)) return;

        batchRun(() =>
        {
            this.trigger();

            this._rawValue = newValue;
            this._value = toReactive(newValue);
        });
    }

    /**
     * 原始值。
     *
     * 存储未经响应式处理的原始值。
     * 用于比较值是否发生变化。
     *
     * @private
     */
    private _rawValue: T;

    /**
     * 创建引用反应式节点。
     *
     * @param value 要包装的值
     */
    constructor(value: T)
    {
        super();
        this._rawValue = toRaw(value);
        this._value = toReactive(value);
    }
}

/**
 * 引用接口。
 *
 * 定义了引用的基本结构：
 * 1. value: 引用的值，可读可写
 * 2. RefSymbol: 用于标识这是一个引用
 */
export interface Ref<T = any, S = T>
{
    get value(): T
    set value(_: S)
    [RefSymbol]: true
}
declare const RefSymbol: unique symbol;
