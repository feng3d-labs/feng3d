import { toReactive } from './reactive';
import { ITERATE_KEY, MAP_KEY_ITERATE_KEY, ReactiveFlags, TrackOpTypes, TriggerOpTypes } from './shared/constants';
import { hasChanged, hasOwn, isMap, Target, toRaw, toRawType, warn } from './shared/general';
import { PropertyReactivity } from './property';

/**
 * 可变集合响应式处理器。
 *
 * 用于处理集合类型（Map、Set、WeakMap、WeakSet）的响应式代理。
 * 通过拦截集合的操作方法，实现响应式功能。
 */
export const mutableCollectionHandlers: ProxyHandler<CollectionTypes> = {
    get: createInstrumentationGetter(),
};

/**
 * 创建集合方法的拦截器。
 *
 * 返回一个 get 拦截器函数，用于：
 * 1. 处理响应式标识和原始对象获取
 * 2. 拦截集合的操作方法
 * 3. 转发其他属性访问
 *
 * @returns 集合方法的拦截器函数
 */
function createInstrumentationGetter()
{
    const instrumentations = createInstrumentations();

    return (
        target: CollectionTypes,
        key: string | symbol,
        receiver: CollectionTypes,
    ) =>
    {
        // 处理响应式标识
        if (key === ReactiveFlags.IS_REACTIVE)
        {
            return true;
        }
        // 获取原始对象
        else if (key === ReactiveFlags.RAW)
        {
            return target;
        }

        // 如果方法在增强对象中存在，则使用增强版本
        return Reflect.get(
            hasOwn(instrumentations, key) && key in target
                ? instrumentations
                : target,
            key,
            receiver,
        );
    };
}

/**
 * 集合方法增强类型。
 *
 * 定义了所有需要增强的集合方法的类型。
 */
type Instrumentations = Record<string | symbol, Function | number>;

/**
 * 创建集合方法的增强实现。
 *
 * 为集合类型（Map、Set、WeakMap、WeakSet）创建响应式增强方法：
 * 1. 基本操作：get、set、has、delete、clear
 * 2. 遍历操作：forEach、keys、values、entries
 * 3. 大小获取：size
 *
 * @returns 增强后的集合方法对象
 */
function createInstrumentations(): Instrumentations
{
    const instrumentations: Instrumentations = {
        /**
         * 获取 Map 中的值。
         *
         * 实现了以下功能：
         * 1. 支持原始键和响应式键的查找
         * 2. 自动追踪键的访问
         * 3. 自动将返回值转换为响应式
         *
         * @param key 要查找的键
         * @returns 找到的值，如果不存在则返回 undefined
         */
        get(this: MapTypes, key: unknown)
        {
            // #1772: readonly(reactive(Map)) 应该返回只读的响应式值
            const target = this[ReactiveFlags.RAW];
            const rawTarget = toRaw(target);
            const rawKey = toRaw(key);

            // 追踪键的访问
            if (hasChanged(key, rawKey))
            {
                PropertyReactivity.track(rawTarget, TrackOpTypes.GET, key);
            }
            PropertyReactivity.track(rawTarget, TrackOpTypes.GET, rawKey);

            const { has } = getProto(rawTarget);
            const wrap = toReactive;

            if (has.call(rawTarget, key))
            {
                return wrap(target.get(key));
            }
            else if (has.call(rawTarget, rawKey))
            {
                return wrap(target.get(rawKey));
            }
            else if (target !== rawTarget)
            {
                // #3602 readonly(reactive(Map))
                // 确保嵌套的响应式 Map 可以追踪自身
                target.get(key);
            }
        },

        /**
         * 获取集合的大小。
         *
         * 实现了以下功能：
         * 1. 追踪集合大小的访问
         * 2. 返回集合的实际大小
         */
        get size()
        {
            const target = (this as unknown as IterableCollections)[ReactiveFlags.RAW];

            PropertyReactivity.track(toRaw(target), TrackOpTypes.ITERATE, ITERATE_KEY);

            return Reflect.get(target, 'size', target);
        },

        /**
         * 检查集合是否包含某个值。
         *
         * 实现了以下功能：
         * 1. 支持原始键和响应式键的检查
         * 2. 自动追踪键的检查
         *
         * @param key 要检查的键
         * @returns 如果集合包含该键则返回 true，否则返回 false
         */
        has(this: CollectionTypes, key: unknown): boolean
        {
            const target = this[ReactiveFlags.RAW];
            const rawTarget = toRaw(target);
            const rawKey = toRaw(key);

            // 追踪键的检查
            if (hasChanged(key, rawKey))
            {
                PropertyReactivity.track(rawTarget, TrackOpTypes.HAS, key);
            }
            PropertyReactivity.track(rawTarget, TrackOpTypes.HAS, rawKey);

            return key === rawKey
                ? target.has(key)
                : target.has(key) || target.has(rawKey);
        },

        /**
         * 遍历集合中的所有元素。
         *
         * 实现了以下功能：
         * 1. 追踪集合的遍历操作
         * 2. 自动将遍历的值转换为响应式
         * 3. 保持回调函数的 this 上下文
         *
         * @param callback 遍历回调函数
         * @param thisArg 回调函数的 this 值
         */
        forEach(this: IterableCollections, callback: Function, thisArg?: unknown)
        {
            const observed = this;
            const target = observed[ReactiveFlags.RAW];
            const rawTarget = toRaw(target);
            const wrap = toReactive;

            PropertyReactivity.track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY);

            return target.forEach((value: unknown, key: unknown) =>
                // 重要：确保回调函数
                // 1. 使用响应式 map 作为 this 和第三个参数
                // 2. 接收到的值应该是相应的响应式/只读版本
                callback.call(thisArg, wrap(value), wrap(key), observed),
            );
        },

        /**
         * 向 Set 中添加值。
         *
         * 实现了以下功能：
         * 1. 自动将值转换为原始值
         * 2. 避免重复添加
         * 3. 触发添加操作的通知
         *
         * @param value 要添加的值
         * @returns 集合本身，支持链式调用
         */
        add(this: SetTypes, value: unknown)
        {
            value = toRaw(value);
            const target = toRaw(this);
            const proto = getProto(target);
            const hadKey = proto.has.call(target, value);

            if (!hadKey)
            {
                target.add(value);
                PropertyReactivity.trigger(target, TriggerOpTypes.ADD, value, value);
            }

            return this;
        },

        /**
         * 设置 Map 中的值。
         *
         * 实现了以下功能：
         * 1. 自动将值转换为原始值
         * 2. 支持原始键和响应式键的设置
         * 3. 触发添加或修改操作的通知
         *
         * @param key 要设置的键
         * @param value 要设置的值
         * @returns 集合本身，支持链式调用
         */
        set(this: MapTypes, key: unknown, value: unknown)
        {
            value = toRaw(value);
            const target = toRaw(this);
            const { has, get } = getProto(target);

            let hadKey = has.call(target, key);

            if (!hadKey)
            {
                key = toRaw(key);
                hadKey = has.call(target, key);
            }
            else if (__DEV__)
            {
                checkIdentityKeys(target, has, key);
            }

            const oldValue = get.call(target, key);

            target.set(key, value);
            if (!hadKey)
            {
                PropertyReactivity.trigger(target, TriggerOpTypes.ADD, key, value);
            }
            else if (hasChanged(value, oldValue))
            {
                PropertyReactivity.trigger(target, TriggerOpTypes.SET, key, value, oldValue);
            }

            return this;
        },

        /**
         * 从集合中删除值。
         *
         * 实现了以下功能：
         * 1. 支持原始键和响应式键的删除
         * 2. 触发删除操作的通知
         *
         * @param key 要删除的键
         * @returns 如果删除成功则返回 true，否则返回 false
         */
        delete(this: CollectionTypes, key: unknown)
        {
            const target = toRaw(this);
            const { has, get } = getProto(target);
            let hadKey = has.call(target, key);

            if (!hadKey)
            {
                key = toRaw(key);
                hadKey = has.call(target, key);
            }
            else if (__DEV__)
            {
                checkIdentityKeys(target, has, key);
            }

            const oldValue = get ? get.call(target, key) : undefined;
            // 在触发反应之前执行操作
            const result = target.delete(key);

            if (hadKey)
            {
                PropertyReactivity.trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue);
            }

            return result;
        },

        /**
         * 清空集合。
         *
         * 实现了以下功能：
         * 1. 清空集合中的所有元素
         * 2. 触发清空操作的通知
         * 3. 在开发模式下保存旧值用于调试
         *
         * @returns 如果清空成功则返回 true，否则返回 false
         */
        clear(this: IterableCollections)
        {
            const target = toRaw(this);
            const hadItems = target.size !== 0;
            const oldTarget = __DEV__
                ? isMap(target)
                    ? new Map(target)
                    : new Set(target)
                : undefined;
            // 在触发反应之前执行操作
            const result = target.clear();

            if (hadItems)
            {
                PropertyReactivity.trigger(
                    target,
                    TriggerOpTypes.CLEAR,
                    undefined,
                    undefined,
                    oldTarget,
                );
            }

            return result;
        },
    };

    // 添加迭代器方法
    const iteratorMethods = [
        'keys',
        'values',
        'entries',
        Symbol.iterator,
    ] as const;

    iteratorMethods.forEach((method) =>
    {
        instrumentations[method] = createIterableMethod(method);
    });

    return instrumentations;
}

/**
 * 创建迭代器方法。
 *
 * 为集合创建响应式的迭代器方法，包括：
 * 1. keys() - 返回键的迭代器
 * 2. values() - 返回值的迭代器
 * 3. entries() - 返回键值对的迭代器
 * 4. [Symbol.iterator] - 返回默认迭代器
 *
 * @param method 迭代器方法名
 * @returns 增强后的迭代器方法
 */
function createIterableMethod(method: string | symbol)
{
    return function (
        this: IterableCollections,
        ...args: unknown[]
    ): Iterable<unknown> & Iterator<unknown>
    {
        const target = this[ReactiveFlags.RAW];
        const rawTarget = toRaw(target);
        const targetIsMap = isMap(rawTarget);
        const isPair
            = method === 'entries' || (method === Symbol.iterator && targetIsMap);
        const isKeyOnly = method === 'keys' && targetIsMap;
        const innerIterator = target[method](...args);
        const wrap = toReactive;

        // 追踪迭代操作
        PropertyReactivity.track(
            rawTarget,
            TrackOpTypes.ITERATE,
            isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY,
        );

        // 返回一个包装的迭代器，它会返回响应式版本的值
        return {
            // 迭代器协议
            next()
            {
                const { value, done } = innerIterator.next();

                return done
                    ? { value, done }
                    : {
                        value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                        done,
                    };
            },
            // 可迭代协议
            [Symbol.iterator]()
            {
                return this;
            },
        };
    };
}

/**
 * 检查键的身份。
 *
 * 在开发模式下检查键的身份，确保不会出现重复的键。
 *
 * @param target 目标集合
 * @param has 检查方法
 * @param key 要检查的键
 */
function checkIdentityKeys(
    target: CollectionTypes,
    has: (key: unknown) => boolean,
    key: unknown,
)
{
    const rawKey = toRaw(key);

    if (rawKey !== key && has.call(target, rawKey))
    {
        const type = toRawType(target);

        warn(
            `响应式 ${type} 同时包含同一对象的原始版本和响应式版本` +
            `${type === `Map` ? `作为键` : ``}，` +
            `这可能导致不一致。` +
            `建议仅使用响应式版本。`,
        );
    }
}

/**
 * 获取对象的原型。
 *
 * @param v 目标对象
 * @returns 对象的原型
 */
const getProto = <T extends CollectionTypes>(v: T): any => Reflect.getPrototypeOf(v);

/**
 * 集合类型。
 *
 * 包括可迭代集合和弱引用集合。
 */
type CollectionTypes = IterableCollections | WeakCollections;

/**
 * 可迭代集合类型。
 *
 * 包括 Map 和 Set。
 */
type IterableCollections = (Map<any, any> | Set<any>) & Target;

/**
 * 弱引用集合类型。
 *
 * 包括 WeakMap 和 WeakSet。
 */
type WeakCollections = (WeakMap<any, any> | WeakSet<any>) & Target;

/**
 * Map 类型。
 *
 * 包括 Map 和 WeakMap。
 */
type MapTypes = (Map<any, any> | WeakMap<any, any>) & Target;

/**
 * Set 类型。
 *
 * 包括 Set 和 WeakSet。
 */
type SetTypes = (Set<any> | WeakSet<any>) & Target;
