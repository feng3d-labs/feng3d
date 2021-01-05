interface ArrayConstructor
{
    /**
     * 使数组变得唯一，不存在两个相等的元素
     * 
     * @param array 被操作数组
     * @param compare 比较函数
     */
    unique<T>(array: T[], compare?: (a: T, b: T) => boolean): T[];

    /**
     * 判断数组是否唯一
     * 
     * @param array 被检查数组
     * @param compare 比较函数
     */
    isUnique<T>(array: T[], compare?: (a: T, b: T) => boolean): boolean;

    /**
     * 删除元素
     * 
     * @param array 被操作数组
     * @param item 被删除元素
     * @returns 被删除元素在数组中的位置
     */
    delete<T>(array: T[], item: T): number;

    /**
     * 连接一个或多个数组到自身
     * 
     * @param array 被操作数组
     * @param items 要添加到数组末尾的其他项。
     * @returns 返回自身
     */
    concatToSelf<T>(array: T[], ...items: (T | ConcatArray<T>)[]): T[];

    /**
     * 比较两个数组中元素是否相同
     * 
     * @param array 被操作数组
     * @param arr 用于比较的数组
     */
    equal<T>(array: T[], arr: ArrayLike<T>): boolean;

    /**
     * 使用b元素替换数组中第一个a元素。
     * 
     * @param array 被操作数组
     * @param a 被替换的元素
     * @param b 用于替换的元素
     * @param isAdd 当数组中没有找到a元素时，是否需要把b元素添加到数组尾部。默认值为true。
     */
    replace<T>(array: T[], a: T, b: T, isAdd?: boolean): T[];

    /**
     * 创建数组
     * @param length 长度
     * @param itemFunc 创建元素方法
     */
    create<T>(length: number, itemFunc: (index: number) => T): T[];

    /**
     * 二分查找,如果有多个则返回第一个
     * @param   array   数组
     * @param	target	寻找的目标
     * @param	compare	比较函数
     * @param   start   起始位置
     * @param   end     结束位置
     * @return          查找到目标时返回所在位置，否则返回-1
     */
    binarySearch<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number;

    /**
     * 二分查找插入位置,如果有多个则返回第一个
     * @param   array   数组
     * @param	target	寻找的目标
     * @param	compare	比较函数
     * @param   start   起始位置
     * @param   end     结束位置
     * @return          目标所在位置（如果该位置上不是目标对象，则该索引为该目标可插入的位置）
     */
    binarySearchInsert<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number;
}

interface Array<T>
{
    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    includes(searchElement: T, fromIndex?: number): boolean;
}

if (!Array.prototype.includes)
{
    Object.defineProperty(Array.prototype, "includes", {
        configurable: true,
        enumerable: false,
        value: function (searchElement: any, fromIndex: number)
        {
            for (let i = fromIndex, n = this.length; i < n; i++)
            {
                if (searchElement == this[i]) return true;
            }
            return false;
        },
        writable: true,
    })
}

Array.equal = function (self, arr)
{
    if (self.length != arr.length) return false;
    var keys = Object.keys(arr);
    for (let i = 0, n = keys.length; i < n; i++)
    {
        var key = keys[i];
        if (self[key] != arr[key]) return false;
    }
    return true;
}

Array.concatToSelf = function <T>(self: T[], ...items: (T | ConcatArray<T>)[])
{
    var arr: T[] = [];
    items.forEach(v => arr = arr.concat(v));
    arr.forEach(v => self.push(v));
    return self;
}

Array.unique = function (arr, compare = (a, b) => a == b)
{
    var keys = Object.keys(arr);
    var ids = keys.map(v => Number(v)).filter(v => !isNaN(v));
    var deleteMap: { [id: number]: true } = {};
    //
    for (let i = 0, n = ids.length; i < n; i++)
    {
        var ki = ids[i];
        if (deleteMap[ki]) continue;
        for (let j = i + 1; j < n; j++)
        {
            var kj = ids[j];
            if (compare(arr[ki], arr[kj])) deleteMap[kj] = true;
        }
    }
    //
    for (let i = ids.length - 1; i >= 0; i--)
    {
        var id = ids[i];
        if (deleteMap[id]) arr.splice(id, 1);
    }

    return arr;
}

/**
 * 数组元素是否唯一
 * @param equalFn 比较函数
 */
Array.isUnique = function (array, compare = (a, b) => a == b)
{
    for (let i = array.length - 1; i >= 0; i--)
    {
        for (let j = 0; j < i; j++)
        {
            if (compare(array[i], array[j]))
            {
                return false;
            }
        }
    }
    return true;
}

Array.delete = function (arr, item)
{
    var index = arr.indexOf(item);
    if (index != -1) arr.splice(index, 1);
    return index;
}

Array.replace = function (arr, a, b, isAdd = true)
{
    var isreplace = false;
    for (let i = 0; i < arr.length; i++)
    {
        if (arr[i] == a)
        {
            arr[i] = b;
            isreplace = true;
            break;
        }
    }
    if (!isreplace && isAdd) arr.push(b);
    return arr;
}

Array.create = function <T>(length: number, itemFunc: (index: number) => T)
{
    var arr: T[] = [];
    for (let i = 0; i < length; i++)
    {
        arr[i] = itemFunc(i);
    }
    return arr;
}

Array.binarySearch = function (array, target, compare, start, end)
{
    var insert = Array.binarySearchInsert(array, target, compare, start, end);
    if (array[insert] == target)
        return insert;
    return -1;
}

Array.binarySearchInsert = function (array, target, compare, start, end): number
{
    if (start === undefined) start = 0;
    if (end === undefined) end = array.length;
    if (start == end)
        return start;
    if (compare(array[start], target) == 0)
    {
        return start;
    }
    var middle = ~~((start + end) / 2);
    if (compare(array[middle], target) < 0)
    {
        start = middle + 1;
    }
    else
    {
        end = middle;
    }
    return Array.binarySearchInsert(array, target, compare, start, end);
}