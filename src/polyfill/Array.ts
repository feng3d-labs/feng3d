interface Array<T>
{
    /**
     * 使数组变得唯一，不存在两个相等的元素
     * 
     * @param compare 比较函数
     */
    unique(compare?: (a: T, b: T) => boolean): this;
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