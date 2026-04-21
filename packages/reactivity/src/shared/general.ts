/* eslint-disable no-var */
import { ReactiveFlags, TargetType } from './constants';

export { };
declare global
{
    /**
     * 是否为开发模式。
     */
    var __DEV__: boolean;
}
globalThis.__DEV__ ??= true;

export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';
// 判断是否为数组
export const isArray: typeof Array.isArray = Array.isArray;
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol';
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isIntegerKey = (key: unknown): boolean =>
    isString(key)
    && key !== 'NaN'
    && key[0] !== '-'
    && `${parseInt(key as any, 10)}` === key;
export const isMap = (val: unknown): val is Map<any, any> =>
    toTypeString(val) === '[object Map]';

// 判断对象是否拥有指定属性
export const hasOwn = (
    val: object,
    key: string | symbol,
): key is keyof typeof val => Object.prototype.hasOwnProperty.call(val, key);

// 比较两个值是否发生变化，考虑 NaN 的情况
export const hasChanged = (value: any, oldValue: any): boolean =>
    !Object.is(value, oldValue);

function targetTypeMap(rawType: string)
{
    switch (rawType)
    {
        case 'Object':
        case 'Array':
            return TargetType.COMMON;
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return TargetType.COLLECTION;
        default:
            return TargetType.COMMON;
    }
}

export function getTargetType(value: Target)
{
    if (!Object.isExtensible(value)) return TargetType.INVALID;

    return targetTypeMap(toRawType(value));
}

const toTypeString = (value: unknown): string => Object.prototype.toString.call(value);

// 获取值的原始类型
export const toRawType = (value: unknown): string =>

    // 从类似 "[object RawType]" 的字符串中提取 "RawType"
    toTypeString(value).slice(8, -1);

export interface Target
{
    [ReactiveFlags.IS_REACTIVE]?: boolean
    [ReactiveFlags.RAW]?: any
}

/**
 * 将一个响应式对象转换为原始对象。
 * @param observed 响应式对象。
 * @returns 原始对象。
 */
export function toRaw<T>(observed: T): T
{
    const raw = observed && (observed as Target)[ReactiveFlags.RAW];

    return raw ? toRaw(raw) : observed;
}

export function warn(msg: string, ...args: any[]): void
{
    console.warn(`[警告] ${msg}`, ...args);
}

/**
 * 创建一个映射，并返回一个用于检查键是否存在于该映射中的函数。
 * 重要提示：所有调用此函数的地方都必须以 \/\*#\_\_PURE\_\_\*\/ 作为前缀，
 * 以便在必要时 Rollup 可以进行 tree-shaking。
 */

/* ! #__NO_SIDE_EFFECTS__ */
export function makeMap(str: string): (key: string) => boolean
{
    // 创建一个空对象作为映射，使用 Object.create(null) 避免原型链上的属性干扰
    const map = Object.create(null);

    // 将输入的字符串按逗号分隔，遍历每个键并将其添加到映射中，值为 1
    for (const key of str.split(',')) map[key] = 1;

    // 返回一个函数，该函数接受一个键值，并检查该键是否存在于映射中
    return (val) => val in map;
}
