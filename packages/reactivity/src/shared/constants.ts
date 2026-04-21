/**
 * 响应式标志枚举，用于标识响应式对象的特殊属性或状态
 */
export enum ReactiveFlags
{
    IS_REACTIVE = '__v_isReactive', // 标识对象是否为响应式对象
    RAW = '__v_raw', // 获取对象的原始非响应式版本
    IS_REF = '__v_isRef', // 标识对象是否为 ref 对象
}

export enum TargetType
{
    INVALID = 0,
    COMMON = 1,
    COLLECTION = 2,
}

/**
 * 跟踪操作类型枚举，用于标识在响应式系统中对对象属性进行的操作类型
 */
export enum TrackOpTypes
{
    GET = 'get', // 获取属性值
    HAS = 'has', // 检查属性是否存在
    ITERATE = 'iterate', // 遍历对象属性
}

/**
 * 触发操作类型枚举，用于标识在响应式系统中对对象属性进行的修改操作类型
 */
export enum TriggerOpTypes
{
    SET = 'set', // 设置属性值
    ADD = 'add', // 添加新属性
    DELETE = 'delete', // 删除属性
    CLEAR = 'clear', // 清空对象属性
}

export const ITERATE_KEY: unique symbol = Symbol(__DEV__ ? 'Object iterate' : '');
export const MAP_KEY_ITERATE_KEY: unique symbol = Symbol(__DEV__ ? 'Map keys iterate' : '');
export const ARRAY_ITERATE_KEY: unique symbol = Symbol(__DEV__ ? 'Array iterate' : '');
