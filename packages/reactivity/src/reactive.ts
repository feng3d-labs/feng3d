import { mutableHandlers } from './baseHandlers';
import { mutableCollectionHandlers } from './collectionHandlers';
import { Computed } from './computed';
import { Ref } from './ref';
import { ReactiveFlags, TargetType } from './shared/constants';
import { getTargetType, isObject, Target } from './shared/general';

/**
 * 移除对象属性中的 readonly 关键字。
 *
 * 用于将只读类型转换为可写类型。
 */
export type UnReadonly<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * 创建或者获取响应式对象的代理对象。
 *
 * 将普通对象转换为响应式对象，使其属性可以被追踪和更新。
 *
 * 特点：
 * 1. 支持对象和集合类型的响应式转换
 * 2. 自动处理嵌套对象的响应式转换
 * 3. 缓存已创建的代理对象
 * 4. 支持只读属性的响应式转换
 *
 * 注意：
 * 1. 扩大被反应式的对象的类型范围，只有 `Object.isExtensible` 不通过的对象不被响应化。
 *    Float32Array 等都允许被响应化。
 * 2. 被反应式的对象的只读属性也会被标记为可编辑。希望被反应对象属性一般为只读属性，
 *    通过反应式来改变属性值，同时又通过反应式系统来处理其更改后响应逻辑。
 *
 * @param target 要转换为响应式的对象
 * @returns 响应式代理对象
 */
export function reactive<T extends object>(target: T): Reactive<T>
{
    if (!isObject(target))
    {
        return target;
    }

    if ((target as any)[ReactiveFlags.RAW])
    {
        return target as any;
    }

    // 只有特定类型的值可以被观察
    const targetType = getTargetType(target);

    if (targetType === TargetType.INVALID)
    {
        return target as any;
    }

    // 如果目标已经有对应的代理对象，直接返回
    const existingProxy = reactiveMap.get(target);

    if (existingProxy)
    {
        return existingProxy;
    }

    // 创建新的代理对象
    const proxy = new Proxy<T>(
        target,
        targetType === TargetType.COLLECTION ? mutableCollectionHandlers : mutableHandlers as any,
    ) as T;

    reactiveMap.set(target, proxy);

    return proxy as any;
}

/**
 * 响应式对象缓存映射。
 *
 * 用于缓存已创建的响应式代理对象，避免重复创建。
 */
export const reactiveMap = new WeakMap<Target, any>();

/**
 * 判断一个对象是否为响应式对象。
 *
 * 通过检查对象是否具有 IS_REACTIVE 标志来判断。
 *
 * @param value 要检查的对象
 * @returns 如果是响应式对象则返回 true，否则返回 false
 */
export function isReactive(value: unknown): boolean
{
    return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 转换为响应式对象。
 *
 * 如果输入是对象，则将其转换为响应式对象。
 * 如果输入不是对象，则直接返回。
 *
 * @param value 要转换的值
 * @returns 转换后的响应式对象或原值
 */
export const toReactive = <T>(value: T): T =>
{
    if (isObject(value))
    {
        return reactive(value as any) as any;
    }

    return value;
};

/**
 * 判断一个对象是否为代理对象。
 *
 * 通过检查对象是否具有 RAW 标志来判断。
 *
 * @param value 要检查的对象
 * @returns 如果是代理对象则返回 true，否则返回 false
 */
export function isProxy(value: any): boolean
{
    return value ? !!value[ReactiveFlags.RAW] : false;
}

/**
 * 响应式类型。
 *
 * 表示一个对象的所有属性都是响应式的。
 */
export type Reactive<T> = UnReadonly<UnwrapRefSimple<T>>;

/**
 * 原始类型。
 *
 * 包括：字符串、数字、布尔值、大整数、符号、undefined、null。
 */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * 内置类型。
 *
 * 包括：原始类型、函数、日期、错误、正则表达式。
 */
export type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * 用于扩展不被解包的类型。
 *
 * 可以通过声明合并来扩展此接口，添加不需要被解包的类型。
 *
 * 示例：
 * ```ts
 * declare module '@vue/reactivity' {
 *   export interface RefUnwrapBailTypes {
 *     runtimeDOMBailTypes: Node | Window
 *   }
 * }
 * ```
 */
export interface RefUnwrapBailTypes { }

/**
 * 解包类型。
 *
 * 递归地解包响应式对象的类型，包括：
 * 1. 内置类型直接返回
 * 2. Ref 类型解包为内部类型
 * 3. Computed 类型解包为内部类型
 * 4. 对象类型递归解包其属性
 * 5. 其他类型直接返回
 */
export type UnwrapRefSimple<T> =
    T extends
    | Builtin
    | Ref
    | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
    ? T :
    T extends Ref<infer TT> ? TT :
    T extends Computed<infer TT> ? TT :
    T extends object ? {
        [K in keyof T]: UnwrapRefSimple<T[K]>
    } :
    T;
