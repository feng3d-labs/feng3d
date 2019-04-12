namespace feng3d
{
    /**
     * 数组工具，增强Array功能
     */
    export var arrayutils: ArrayUtils;

    /**
     * 数组工具，增强Array功能
     */
    export class ArrayUtils
    {
        /**
         * 使数组变得唯一，不存在两个相等的元素
         * 
         * @param arr 数组
         * @param compare 比较函数
         */
        unique<T>(arr: T[], compare?: (a: T, b: T) => boolean)
        {
            for (let i = 0; i < arr.length; i++)
            {
                for (let j = arr.length - 1; j > i; j--)
                {
                    if (compare(arr[i], arr[j])) arr.splice(j, 1);
                }
            }
            return arr;
        }

        /**
         * 删除第一个指定元素
         * 
         * @param arr 数组
         * @param item 被删除元素
         * 
         * @returns 被删除元素在数组中的位置
         */
        delete<T>(arr: T[], item: T): number
        {
            var index = arr.indexOf(item);
            if (index != -1) arr.splice(index, 1);
            return index;
        }
    }

    arrayutils = new ArrayUtils();
}