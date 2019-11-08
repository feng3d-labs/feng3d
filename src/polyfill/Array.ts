interface Array<T>
{
    /**
     * 使数组变得唯一，不存在两个相等的元素
     * 
     * @param compare 比较函数
     */
    unique(compare?: (a: T, b: T) => boolean): this;

    /**
     * 删除元素
     * 
     * @param item 被删除元素
     * @returns 被删除元素在数组中的位置
     */
    delete(item: T): number;

    /**
     * 连接一个或多个数组到自身
     * 
      * @param items 要添加到数组末尾的其他项。
      * @returns 返回自身
      */
    concatToSelf(...items: (T | ConcatArray<T>)[]): this;

    /**
     * 比较两个数组是否相等
     * 
     * @param arr 用于比较的数组
     */
    equal(arr: ArrayLike<T>): boolean;

    /**
     * 使用b元素替换数组中第一个a元素。
     * 
     * @param a 被替换的元素
     * @param b 用于替换的元素
     * @param isAdd 当数组中没有找到a元素时，是否需要把b元素添加到数组尾部。默认值为true。
     */
    replace(a: T, b: T, isAdd?: boolean): this;
}

Array.prototype.equal = function (arr: ArrayLike<any>)
{
    var self: any[] = this;
    if (self.length != arr.length) return false;
    var keys = Object.keys(arr);
    for (let i = 0, n = keys.length; i < n; i++)
    {
        var key = keys[i];
        if (self[key] != arr[key]) return false;
    }
    return true;
}

Array.prototype.concatToSelf = function (...items)
{
    var self: any[] = this;
    var arr = [];
    items.forEach(v => arr = arr.concat(v));
    arr.forEach(v => self.push(v));
    return self;
}

Array.prototype.unique = function (compare = (a, b) => a == b)
{
    var arr: any[] = this;
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

    return this;
}

Array.prototype.delete = function (item): number
{
    var arr: any[] = this;
    var index = arr.indexOf(item);
    if (index != -1) arr.splice(index, 1);
    return index;
}

Array.prototype.replace = function (a, b, isAdd = true)
{
    var arr: any[] = this;
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
    return this;
}

