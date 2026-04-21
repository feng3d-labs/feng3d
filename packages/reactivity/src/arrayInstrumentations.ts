/* eslint-disable prefer-rest-params */

import { batchRun } from './batch';
import { noTrack } from './Reactivity';
import { PropertyReactivity } from './property';
import { isProxy, toReactive } from './reactive';
import { ARRAY_ITERATE_KEY, TrackOpTypes } from './shared/constants';
import { isArray, toRaw } from './shared/general';

/**
 * 数组方法增强对象。
 *
 * 为数组提供响应式增强的方法实现，包括：
 * 1. 迭代器方法：Symbol.iterator、entries、keys、values
 * 2. 查找方法：includes、indexOf、lastIndexOf、find、findIndex、findLast、findLastIndex
 * 3. 遍历方法：forEach、map、filter、some、every、reduce、reduceRight
 * 4. 修改方法：push、pop、shift、unshift、splice、toReversed、toSorted、toSpliced
 * 5. 其他方法：concat、join
 */
export const arrayInstrumentations: Record<string | symbol, Function> = <any>{
    __proto__: null,

    /**
     * 返回一个迭代器，用于遍历数组的响应式值。
     *
     * 实现了以下功能：
     * 1. 创建数组的迭代器
     * 2. 自动将迭代的值转换为响应式
     * 3. 自动追踪数组的访问
     *
     * @returns 数组的迭代器
     */
    [Symbol.iterator]()
    {
        return iterator(this, Symbol.iterator, toReactive);
    },

    /**
     * 连接数组并返回新数组。
     *
     * 实现了以下功能：
     * 1. 处理响应式数组的连接
     * 2. 自动将参数中的数组转换为响应式
     * 3. 保持原始值的引用
     *
     * @param args 要连接的数组或值
     * @returns 连接后的新数组
     */
    concat(...args: unknown[])
    {
        return reactiveReadArray(this).concat(
            ...args.map((x) => (isArray(x) ? reactiveReadArray(x) : x)),
        );
    },

    /**
     * 返回一个迭代器，用于遍历数组的键值对。
     *
     * 实现了以下功能：
     * 1. 创建数组的键值对迭代器
     * 2. 自动将值转换为响应式
     * 3. 自动追踪数组的访问
     *
     * @returns 数组的键值对迭代器
     */
    entries()
    {
        return iterator(this, 'entries', (value: [number, unknown]) =>
        {
            value[1] = toReactive(value[1]);

            return value;
        });
    },

    /**
     * 测试数组中的所有元素是否都通过了指定函数的测试。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的测试
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 如果所有元素都通过测试则返回 true，否则返回 false
     */
    every(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'every', fn, thisArg, undefined, arguments);
    },

    /**
     * 创建一个新数组，包含通过指定函数测试的所有元素。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 自动将结果转换为响应式
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 包含通过测试的元素的新数组
     */
    filter(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'filter', fn, thisArg, (v) => v.map(toReactive), arguments);
    },

    /**
     * 返回数组中满足指定测试函数的第一个元素。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 自动将结果转换为响应式
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 第一个满足测试的元素，如果没有则返回 undefined
     */
    find(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'find', fn, thisArg, toReactive, arguments);
    },

    /**
     * 返回数组中满足指定测试函数的第一个元素的索引。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的查找
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 第一个满足测试的元素的索引，如果没有则返回 -1
     */
    findIndex(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'findIndex', fn, thisArg, undefined, arguments);
    },

    /**
     * 返回数组中满足指定测试函数的最后一个元素。
     *
     * 实现了以下功能：
     * 1. 从后向前遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 自动将结果转换为响应式
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 最后一个满足测试的元素，如果没有则返回 undefined
     */
    findLast(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'findLast', fn, thisArg, toReactive, arguments);
    },

    /**
     * 返回数组中满足指定测试函数的最后一个元素的索引。
     *
     * 实现了以下功能：
     * 1. 从后向前遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的查找
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 最后一个满足测试的元素的索引，如果没有则返回 -1
     */
    findLastIndex(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'findLastIndex', fn, thisArg, undefined, arguments);
    },

    // flat, flatMap 可以从 ARRAY_ITERATE 中受益，但实现起来不太直接

    /**
     * 对数组中的每个元素执行指定函数。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行回调函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的遍历
     *
     * @param fn 回调函数
     * @param thisArg 回调函数的 this 值
     */
    forEach(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'forEach', fn, thisArg, undefined, arguments);
    },

    /**
     * 判断数组是否包含指定元素。
     *
     * 实现了以下功能：
     * 1. 处理响应式值的查找
     * 2. 自动追踪数组的访问
     * 3. 处理代理对象的查找
     *
     * @param args 要查找的元素
     * @returns 如果数组包含该元素则返回 true，否则返回 false
     */
    includes(...args: unknown[])
    {
        return searchProxy(this, 'includes' as any, args);
    },

    /**
     * 返回数组中指定元素第一次出现的索引。
     *
     * 实现了以下功能：
     * 1. 处理响应式值的查找
     * 2. 自动追踪数组的访问
     * 3. 处理代理对象的查找
     *
     * @param args 要查找的元素
     * @returns 元素第一次出现的索引，如果没有则返回 -1
     */
    indexOf(...args: unknown[])
    {
        return searchProxy(this, 'indexOf', args);
    },

    /**
     * 将数组的所有元素连接成一个字符串。
     *
     * 实现了以下功能：
     * 1. 处理响应式数组的连接
     * 2. 自动追踪数组的访问
     * 3. 保持原始值的引用
     *
     * @param separator 分隔符
     * @returns 连接后的字符串
     */
    join(separator?: string)
    {
        return reactiveReadArray(this).join(separator);
    },

    // keys() 迭代器只读取 length，不需要优化

    /**
     * 返回数组中指定元素最后一次出现的索引。
     *
     * 实现了以下功能：
     * 1. 处理响应式值的查找
     * 2. 自动追踪数组的访问
     * 3. 处理代理对象的查找
     *
     * @param args 要查找的元素
     * @returns 元素最后一次出现的索引，如果没有则返回 -1
     */
    lastIndexOf(...args: unknown[])
    {
        return searchProxy(this, 'lastIndexOf', args);
    },

    /**
     * 创建一个新数组，包含对原数组每个元素调用指定函数的结果。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行映射函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的映射
     *
     * @param fn 映射函数
     * @param thisArg 映射函数的 this 值
     * @returns 包含映射结果的新数组
     */
    map(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'map', fn, thisArg, undefined, arguments);
    },

    /**
     * 移除数组的最后一个元素并返回该元素。
     *
     * 实现了以下功能：
     * 1. 移除最后一个元素
     * 2. 避免跟踪长度变化
     * 3. 处理响应式值的移除
     *
     * @returns 被移除的元素
     */
    pop()
    {
        return noTracking(this, 'pop');
    },

    /**
     * 向数组末尾添加一个或多个元素。
     *
     * 实现了以下功能：
     * 1. 添加新元素
     * 2. 避免跟踪长度变化
     * 3. 处理响应式值的添加
     *
     * @param args 要添加的元素
     * @returns 数组的新长度
     */
    push(...args: unknown[])
    {
        return noTracking(this, 'push', args);
    },

    /**
     * 对数组中的每个元素执行累加器函数。
     *
     * 实现了以下功能：
     * 1. 从左到右遍历数组元素
     * 2. 对每个元素执行累加器函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的累加
     *
     * @param fn 累加器函数
     * @param args 初始值（可选）
     * @returns 累加的结果
     */
    reduce(fn: (
        acc: unknown,
        item: unknown,
        index: number,
        array: unknown[],
    ) => unknown,
    ...args: unknown[]
    )
    {
        return reduce(this, 'reduce', fn, args);
    },

    /**
     * 从右到左对数组中的每个元素执行累加器函数。
     *
     * 实现了以下功能：
     * 1. 从右到左遍历数组元素
     * 2. 对每个元素执行累加器函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的累加
     *
     * @param fn 累加器函数
     * @param args 初始值（可选）
     * @returns 累加的结果
     */
    reduceRight(
        fn: (
            acc: unknown,
            item: unknown,
            index: number,
            array: unknown[],
        ) => unknown,
        ...args: unknown[]
    )
    {
        return reduce(this, 'reduceRight', fn, args);
    },

    /**
     * 移除数组的第一个元素并返回该元素。
     *
     * 实现了以下功能：
     * 1. 移除第一个元素
     * 2. 避免跟踪长度变化
     * 3. 处理响应式值的移除
     *
     * @returns 被移除的元素
     */
    shift()
    {
        return noTracking(this, 'shift');
    },

    // slice 可以使用 ARRAY_ITERATE，但似乎也需要范围追踪

    /**
     * 测试数组中的某些元素是否通过了指定函数的测试。
     *
     * 实现了以下功能：
     * 1. 遍历数组元素
     * 2. 对每个元素执行测试函数
     * 3. 自动追踪数组的访问
     * 4. 处理响应式值的测试
     *
     * @param fn 测试函数
     * @param thisArg 测试函数的 this 值
     * @returns 如果有元素通过测试则返回 true，否则返回 false
     */
    some(
        fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'some', fn, thisArg, undefined, arguments);
    },

    /**
     * 通过删除或替换现有元素或添加新元素来修改数组。
     *
     * 实现了以下功能：
     * 1. 修改数组内容
     * 2. 避免跟踪长度变化
     * 3. 处理响应式值的修改
     *
     * @param args 要删除的起始索引、要删除的元素数量和要添加的元素
     * @returns 包含被删除元素的新数组
     */
    splice(...args: unknown[])
    {
        return noTracking(this, 'splice', args);
    },

    /**
     * 返回一个新数组，包含原数组的反转副本。
     *
     * 实现了以下功能：
     * 1. 创建数组的反转副本
     * 2. 自动将结果转换为响应式
     * 3. 保持原始值的引用
     *
     * @returns 反转后的新数组
     */
    toReversed()
    {
        return reactiveReadArray(this).toReversed();
    },

    /**
     * 返回一个新数组，包含原数组的排序副本。
     *
     * 实现了以下功能：
     * 1. 创建数组的排序副本
     * 2. 自动将结果转换为响应式
     * 3. 保持原始值的引用
     *
     * @param comparer 比较函数
     * @returns 排序后的新数组
     */
    toSorted(comparer?: (a: unknown, b: unknown) => number)
    {
        return reactiveReadArray(this).toSorted(comparer);
    },

    /**
     * 返回一个新数组，包含原数组的切片副本。
     *
     * 实现了以下功能：
     * 1. 创建数组的切片副本
     * 2. 自动将结果转换为响应式
     * 3. 保持原始值的引用
     *
     * @param args 起始索引和结束索引
     * @returns 切片后的新数组
     */
    toSpliced(...args: unknown[])
    {
        // @ts-expect-error user code may run in es2016+
        return reactiveReadArray(this).toSpliced(...args);
    },

    /**
     * 向数组开头添加一个或多个元素。
     *
     * 实现了以下功能：
     * 1. 添加新元素
     * 2. 避免跟踪长度变化
     * 3. 处理响应式值的添加
     *
     * @param args 要添加的元素
     * @returns 数组的新长度
     */
    unshift(...args: unknown[])
    {
        return noTracking(this, 'unshift', args);
    },

    /**
     * 返回一个迭代器，用于遍历数组的值。
     *
     * 实现了以下功能：
     * 1. 创建数组的值迭代器
     * 2. 自动将迭代的值转换为响应式
     * 3. 自动追踪数组的访问
     *
     * @returns 数组的值迭代器
     */
    values()
    {
        return iterator(this, 'values', toReactive);
    },
};

/**
 * 创建数组的迭代器。
 *
 * 实现了以下功能：
 * 1. 创建数组的迭代器
 * 2. 自动将迭代的值转换为响应式
 * 3. 自动追踪数组的访问
 *
 * 注意：在这里获取 ARRAY_ITERATE 依赖并不完全等同于在代理数组上调用迭代。
 * 创建迭代器时不会访问任何数组属性：
 * 只有在调用 .next() 时才会访问 length 和索引。
 * 从极端情况来看，迭代器可以在一个 effect scope 中创建，
 * 在另一个 scope 中部分迭代，然后在第三个 scope 中继续迭代。
 * 考虑到 JS 迭代器只能读取一次，这似乎不是一个合理的用例，
 * 所以这种跟踪简化是可以接受的。
 *
 * @param self 目标数组
 * @param method 迭代器方法名
 * @param wrapValue 值包装函数，用于将值转换为响应式
 * @returns 数组的迭代器
 */
function iterator(
    self: unknown[],
    method: keyof Array<unknown>,
    wrapValue: (value: any) => unknown,
)
{
    const arr = shallowReadArray(self);
    const iter = (arr[method] as any)() as IterableIterator<unknown> & {
        _next: IterableIterator<unknown>['next']
    };

    if (arr !== self)
    {
        iter._next = iter.next;
        iter.next = () =>
        {
            const result = iter._next();

            if (result.value)
            {
                result.value = wrapValue(result.value);
            }

            return result;
        };
    }

    return iter;
}

/**
 * 创建数组的浅层响应式副本。
 *
 * 实现了以下功能：
 * 1. 跟踪数组的迭代操作
 * 2. 返回原始数组的引用
 *
 * 注意：此函数只跟踪数组的迭代操作，不会递归转换数组中的值。
 * 主要用于优化性能，避免不必要的响应式转换。
 *
 * @param arr 目标数组
 * @returns 数组的浅层响应式副本
 */
function shallowReadArray<T>(arr: T[]): T[]
{
    PropertyReactivity.track((arr = toRaw(arr)), TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);

    return arr;
}

/**
 * 创建数组的深层响应式副本。
 *
 * 实现了以下功能：
 * 1. 跟踪数组的迭代操作
 * 2. 递归转换所有值为响应式
 *
 * 注意：此函数会递归转换数组中的所有值为响应式，
 * 包括嵌套的数组和对象。这可能会导致性能开销，
 * 但确保了所有值都是响应式的。
 *
 * @param array 目标数组
 * @returns 数组的深层响应式副本
 */
function reactiveReadArray<T>(array: T[]): T[]
{
    const raw = toRaw(array);

    if (raw === array) return raw;
    PropertyReactivity.track(raw, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);

    return raw.map(toReactive);
}

/**
 * 数组方法类型。
 *
 * 包括所有需要增强的数组方法。
 * 注意：在代码库中我们强制使用 es2016，但用户代码可能在更高版本的环境中运行。
 */
type ArrayMethods = keyof Array<any> | 'findLast' | 'findLastIndex';

/**
 * 应用数组方法。
 *
 * 实现了以下功能：
 * 1. 调用数组方法
 * 2. 自动追踪数组的访问
 * 3. 处理回调函数的执行
 * 4. 处理返回值的转换
 *
 * 注意：如果调用的方法来自用户扩展的 Array，参数将是未知的
 * （未知顺序和未知参数类型）。在这种情况下，我们跳过 shallowReadArray
 * 处理，直接使用 self 调用 apply。
 *
 * @param self 目标数组
 * @param method 方法名
 * @param fn 回调函数
 * @param thisArg 回调函数的 this 值
 * @param wrappedRetFn 返回值包装函数，用于将返回值转换为响应式
 * @param args 方法参数
 * @returns 方法的执行结果
 */
function apply(
    self: unknown[],
    method: ArrayMethods,
    fn: (item: unknown, index: number, array: unknown[]) => unknown,
    thisArg?: unknown,
    wrappedRetFn?: (result: any) => unknown,
    args?: IArguments,
)
{
    const arr = shallowReadArray(self);
    const needsWrap = arr !== self;
    const methodFn = arr[method] as Function;

    // #11759
    // If the method being called is from a user-extended Array, the arguments will be unknown
    // (unknown order and unknown parameter types). In this case, we skip the shallowReadArray
    // handling and directly call apply with self.
    if (methodFn !== Array.prototype[method as any])
    {
        const result = methodFn.apply(self, args);

        return needsWrap ? toReactive(result) : result;
    }

    let wrappedFn = fn;

    if (arr !== self)
    {
        if (needsWrap)
        {
            wrappedFn = function (this: unknown, item, index)
            {
                return fn.call(this, toReactive(item), index, self);
            };
        }
        else if (fn.length > 2)
        {
            wrappedFn = function (this: unknown, item, index)
            {
                return fn.call(this, item, index, self);
            };
        }
    }
    const result = methodFn.call(arr, wrappedFn, thisArg);

    return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}

/**
 * 应用数组的归约方法。
 *
 * 实现了以下功能：
 * 1. 调用数组的归约方法
 * 2. 自动追踪数组的访问
 * 3. 处理回调函数的执行
 * 4. 处理响应式值的归约
 *
 * 注意：此函数用于处理 reduce 和 reduceRight 方法，
 * 确保在归约过程中正确处理响应式值。
 *
 * @param self 目标数组
 * @param method 方法名（'reduce' 或 'reduceRight'）
 * @param fn 归约函数
 * @param args 方法参数，包括初始值（可选）
 * @returns 归约的结果
 */
function reduce(
    self: unknown[],
    method: keyof Array<any>,
    fn: (acc: unknown, item: unknown, index: number, array: unknown[]) => unknown,
    args: unknown[],
)
{
    const arr = shallowReadArray(self);
    let wrappedFn = fn;

    if (arr !== self)
    {
        wrappedFn = function (this: unknown, acc, item, index)
        {
            return fn.call(this, acc, toReactive(item), index, self);
        };
    }

    return (arr[method] as any)(wrappedFn, ...args);
}

/**
 * 在数组中搜索元素。
 *
 * 实现了以下功能：
 * 1. 处理响应式值的搜索
 * 2. 自动追踪数组的访问
 * 3. 处理代理对象的搜索
 *
 * 注意：我们首先使用原始参数（可能是响应式的）运行方法。
 * 如果那不起作用，我们再次使用原始值运行。
 * 这确保了在搜索响应式值时能够正确处理。
 *
 * @param self 目标数组
 * @param method 方法名（'includes'、'indexOf' 或 'lastIndexOf'）
 * @param args 搜索参数
 * @returns 搜索的结果（布尔值或索引）
 */
function searchProxy(
    self: unknown[],
    method: keyof Array<any>,
    args: unknown[],
)
{
    const arr = toRaw(self) as any;

    PropertyReactivity.track(arr, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);
    // we run the method using the original args first (which may be reactive)
    const res = arr[method](...args);

    // if that didn't work, run it again using raw values.
    if ((res === -1 || res === false) && isProxy(args[0]))
    {
        args[0] = toRaw(args[0]);

        return arr[method](...args);
    }

    return res;
}

/**
 * 执行不跟踪的数组操作。
 *
 * 实现了以下功能：
 * 1. 执行数组操作
 * 2. 避免跟踪长度变化
 * 3. 在批处理中执行操作
 *
 * 注意：这用于避免在某些情况下（#2137）由于跟踪长度变化而导致的无限循环。
 * 通过使用批处理和禁用跟踪，我们可以安全地执行这些操作。
 *
 * @param self 目标数组
 * @param method 方法名（'push'、'pop'、'shift'、'unshift' 或 'splice'）
 * @param args 方法参数
 * @returns 操作的执行结果
 */
function noTracking(
    self: unknown[],
    method: keyof Array<any>,
    args: unknown[] = [],
)
{
    const res = batchRun(() =>
        noTrack(() =>
            (toRaw(self) as any)[method].apply(self, args),
        ),
    );

    return res;
}
