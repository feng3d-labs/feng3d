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