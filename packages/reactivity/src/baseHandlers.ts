import { arrayInstrumentations } from './arrayInstrumentations';
import { reactive, reactiveMap } from './reactive';
import { isRef } from './ref';
import { ITERATE_KEY, ReactiveFlags, TrackOpTypes, TriggerOpTypes } from './shared/constants';
import { hasChanged, hasOwn, isArray, isIntegerKey, isObject, isSymbol, makeMap, Target, toRaw } from './shared/general';
import { PropertyReactivity } from './property';

/**
 * 基础响应式处理器。
 *
 * 实现了 Proxy 的 get 拦截器，用于：
 * 1. 响应式对象的标识和原始对象获取
 * 2. 数组方法的特殊处理
 * 3. 属性的依赖追踪
 * 4. 值的自动解包和响应式转换
 */
class BaseReactiveHandler implements ProxyHandler<Target>
{
    /**
     * 获取对象的属性值。
     *
     * 实现了以下功能：
     * 1. 响应式对象标识检查
     * 2. 原始对象获取
     * 3. 数组方法拦截
     * 4. 属性依赖追踪
     * 5. 值的自动解包
     * 6. 对象的自动响应式转换
     *
     * @param target 被代理的原始对象
     * @param key 要获取的属性名
     * @param receiver 代理对象本身
     * @returns 获取到的属性值
     */
    get(target: Target, key: string | symbol, receiver: object): any
    {
        // 检查是否为响应式对象
        if (key === ReactiveFlags.IS_REACTIVE)
        {
            return true;
        }
        // 获取原始对象
        else if (key === ReactiveFlags.RAW)
        {
            if (
                receiver === reactiveMap.get(target)
                // receiver 不是响应式代理，但具有相同的原型
                // 这意味着 receiver 是响应式代理的用户代理
                || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
            )
            {
                return target;
            }

            // 提前返回 undefined
            return;
        }

        const targetIsArray = isArray(target);

        // 处理数组方法
        let fn: Function | undefined;

        if (targetIsArray && (fn = arrayInstrumentations[key]))
        {
            return fn;
        }
        // 处理 hasOwnProperty 方法
        if (key === 'hasOwnProperty')
        {
            return hasOwnProperty;
        }

        // 获取属性值
        const res = Reflect.get(
            target,
            key,
            isRef(target) ? target : receiver,
        );

        // 跳过内置 Symbol 和非追踪键的依赖追踪
        if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key))
        {
            return res;
        }

        // 追踪属性访问
        PropertyReactivity.track(target, TrackOpTypes.GET, key as any);

        // 自动解包 ref 值
        if (isRef(res))
        {
            return targetIsArray && isIntegerKey(key) ? res : res.value;
        }

        // 自动转换对象为响应式
        if (isObject(res))
        {
            return reactive(res);
        }

        return res;
    }
}

/**
 * 可变响应式处理器。
 *
 * 继承自基础响应式处理器，增加了：
 * 1. 属性设置拦截
 * 2. 属性删除拦截
 * 3. 属性存在性检查拦截
 * 4. 属性遍历拦截
 */
class MutableReactiveHandler extends BaseReactiveHandler
{
    /**
     * 设置对象的属性值。
     *
     * 实现了以下功能：
     * 1. 值的原始化处理
     * 2. ref 值的特殊处理
     * 3. 属性变更通知
     * 4. 数组长度的特殊处理
     *
     * @param target 被代理的原始对象
     * @param key 要设置的属性名
     * @param value 要设置的新值
     * @param receiver 代理对象本身
     * @returns 设置是否成功
     */
    set(
        target: Record<string | symbol, unknown>,
        key: string | symbol,
        value: unknown,
        receiver: object,
    ): boolean
    {
        let oldValue = target[key];

        // 获取原始值进行比较
        oldValue = toRaw(oldValue);
        value = toRaw(value);

        // 处理 ref 值的特殊情况
        if (!isArray(target) && isRef(oldValue) && !isRef(value))
        {
            oldValue.value = value;

            return true;
        }

        // 检查属性是否存在
        const hadKey
            = isArray(target) && isIntegerKey(key)
                ? Number(key) < target.length
                : hasOwn(target, key);
        const result = Reflect.set(
            target,
            key,
            value,
            isRef(target) ? target : receiver,
        );

        // 确保目标在原始原型链中
        __DEV__ && console.assert(target === toRaw(receiver));

        // 触发属性变更通知
        if (target === toRaw(receiver))
        {
            if (!hadKey)
            {
                // 新增属性
                PropertyReactivity.trigger(target, TriggerOpTypes.ADD, key, value);
            }
            else if (hasChanged(value, oldValue))
            {
                // 修改属性
                PropertyReactivity.trigger(target, TriggerOpTypes.SET, key, value, oldValue);
            }
        }

        return result;
    }

    /**
     * 删除对象的属性。
     *
     * 实现了以下功能：
     * 1. 属性删除操作
     * 2. 删除后的变更通知
     *
     * @param target 被代理的原始对象
     * @param key 要删除的属性名
     * @returns 删除是否成功
     */
    deleteProperty(
        target: Record<string | symbol, unknown>,
        key: string | symbol,
    ): boolean
    {
        const hadKey = hasOwn(target, key);
        const oldValue = target[key];
        const result = Reflect.deleteProperty(target, key);

        if (result && hadKey)
        {
            // 触发删除通知
            PropertyReactivity.trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue);
        }

        return result;
    }

    /**
     * 检查对象是否包含某个属性。
     *
     * 实现了以下功能：
     * 1. 属性存在性检查
     * 2. 属性访问依赖追踪
     *
     * @param target 被代理的原始对象
     * @param key 要检查的属性名
     * @returns 属性是否存在
     */
    has(target: Record<string | symbol, unknown>, key: string | symbol): boolean
    {
        const result = Reflect.has(target, key);

        if (!isSymbol(key) || !builtInSymbols.has(key))
        {
            // 追踪属性访问
            PropertyReactivity.track(target, TrackOpTypes.HAS, key);
        }

        return result;
    }

    /**
     * 获取对象的所有属性名。
     *
     * 实现了以下功能：
     * 1. 属性遍历
     * 2. 遍历操作的依赖追踪
     *
     * @param target 被代理的原始对象
     * @returns 对象的所有属性名数组
     */
    ownKeys(target: Record<string | symbol, unknown>): (string | symbol)[]
    {
        // 追踪遍历操作
        PropertyReactivity.track(
            target,
            TrackOpTypes.ITERATE,
            isArray(target) ? 'length' : ITERATE_KEY,
        );

        return Reflect.ownKeys(target);
    }
}

/**
 * 可变响应式处理器实例。
 *
 * 用于创建可变的响应式对象。
 */
export const mutableHandlers: ProxyHandler<object> = new MutableReactiveHandler();

/**
 * 自定义 hasOwnProperty 方法。
 *
 * 实现了以下功能：
 * 1. 属性存在性检查
 * 2. 属性访问依赖追踪
 *
 * @param this 调用对象
 * @param key 要检查的属性名
 * @returns 属性是否存在
 */
function hasOwnProperty(this: object, key: unknown)
{
    // #10455 hasOwnProperty 可能被非字符串值调用
    if (!isSymbol(key)) key = String(key);
    const obj = toRaw(this);

    // 追踪属性访问
    PropertyReactivity.track(obj, TrackOpTypes.HAS, key);

    return obj.hasOwnProperty(key as string);
}

/**
 * 内置 Symbol 集合。
 *
 * 用于过滤不需要追踪的 Symbol 属性。
 */
const builtInSymbols = new Set(
    /* @__PURE__ */
    Object.getOwnPropertyNames(Symbol)
        // ios10.x Object.getOwnPropertyNames(Symbol) 可以枚举 'arguments' 和 'caller'
        // 但在 Symbol 上访问它们会导致 TypeError，因为 Symbol 是严格模式函数
        .filter((key) => key !== 'arguments' && key !== 'caller')
        .map((key) => Symbol[key as keyof SymbolConstructor])
        .filter(isSymbol),
);

/**
 * 非追踪键集合。
 *
 * 用于过滤不需要追踪的属性名。
 */
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
