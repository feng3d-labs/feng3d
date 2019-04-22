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
}

Array.prototype.equal = function (arr: ArrayLike<any>)
{
    var self: any[] = this;
    if (self.length != arr.length) return false;

    for (let i = 0, n = self.length; i < n; i++)
    {
        if (self[i] != arr[i]) return false;
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
    for (let i = 0; i < arr.length; i++)
    {
        for (let j = arr.length - 1; j > i; j--)
        {
            if (compare(arr[i], arr[j])) arr.splice(j, 1);
        }
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