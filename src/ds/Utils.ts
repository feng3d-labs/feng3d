namespace feng3d
{
    /**
     * 工具
     */
    export var utils: Utils;

    /**
     * 工具
     */
    export class Utils
    {
        /**
         * 创建数组
         * @param length 长度
         * @param itemFunc 创建元素方法
         */
        createArray<T>(length: number, itemFunc: (index: number) => T)
        {
            var arr: T[] = [];
            for (let i = 0; i < length; i++)
            {
                arr[i] = itemFunc(i);
            }
            return arr;
        }

        /**
         * 二分查找,如果有多个则返回第一个
         * @param   array   数组
         * @param	target	寻找的目标
         * @param	compare	比较函数
         * @param   start   起始位置
         * @param   end     结束位置
         * @return          查找到目标时返回所在位置，否则返回-1
         */
        binarySearch<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number
        {
            var insert = this.binarySearchInsert(array, target, compare, start, end);
            if (array[insert] == target)
                return insert;
            return -1;
        }

        /**
         * 二分查找插入位置,如果有多个则返回第一个
         * @param   array   数组
         * @param	target	寻找的目标
         * @param	compare	比较函数
         * @param   start   起始位置
         * @param   end     结束位置
         * @return          目标所在位置（如果该位置上不是目标对象，则该索引为该目标可插入的位置）
         */
        binarySearchInsert<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number
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
            return this.binarySearchInsert(array, target, compare, start, end);
        }
    }

    utils = new Utils();
}