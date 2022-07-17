namespace feng3d
{
    export class ArrayUtils
    {
        /**
          * 比较两个数组中元素是否相同
          *
          * @param array 被操作数组
          * @param arr 用于比较的数组
          */
        static equal<T>(array: T[], arr: ArrayLike<T>): boolean
        {
            if (array.length !== arr.length) return false;
            const keys = Object.keys(arr);
            for (let i = 0, n = keys.length; i < n; i++)
            {
                const key = keys[i];
                if (array[key] !== arr[key]) return false;
            }

            return true;
        }

        /**
         * 连接一个或多个数组到自身
         *
         * @param array 被操作数组
         * @param items 要添加到数组末尾的其他项。
         * @returns 返回自身
         */
        static concatToSelf<T>(array: T[], ...items: (T | ConcatArray<T>)[]): T[]
        {
            let arr: T[] = [];
            items.forEach((v) => { arr = arr.concat(v); });
            arr.forEach((v) => array.push(v));

            return array;
        }

        /**
         * 使数组变得唯一，不存在两个相等的元素
         *
         * @param array 被操作数组
         * @param compare 比较函数
         */
        static unique<T>(array: T[], compare = (a: T, b: T) => a === b): T[]
        {
            const keys = Object.keys(array);
            const ids = keys.map((v) => Number(v)).filter((v) => !isNaN(v));
            const deleteMap: { [id: number]: true } = {};
            //
            for (let i = 0, n = ids.length; i < n; i++)
            {
                const ki = ids[i];
                if (deleteMap[ki]) continue;
                for (let j = i + 1; j < n; j++)
                {
                    const kj = ids[j];
                    if (compare(array[ki], array[kj])) deleteMap[kj] = true;
                }
            }
            //
            for (let i = ids.length - 1; i >= 0; i--)
            {
                const id = ids[i];
                if (deleteMap[id]) array.splice(id, 1);
            }

            return array;
        }

        /**
         * 使用b元素替换数组中第一个a元素。
         *
         * @param array 被操作数组
         * @param a 被替换的元素
         * @param b 用于替换的元素
         * @param isAdd 当数组中没有找到a元素时，是否需要把b元素添加到数组尾部。默认值为true。
         */
        static replace<T>(array: T[], a: T, b: T, isAdd = true): T[]
        {
            let isreplace = false;
            for (let i = 0; i < array.length; i++)
            {
                if (array[i] === a)
                {
                    array[i] = b;
                    isreplace = true;
                    break;
                }
            }
            if (!isreplace && isAdd) array.push(b);

            return array;
        }

        /**
         * 创建数组
         * @param length 长度
         * @param itemFunc 创建元素方法
         */
        static create<T>(length: number, itemFunc: (index: number) => T): T[]
        {
            const arr: T[] = [];
            for (let i = 0; i < length; i++)
            {
                arr[i] = itemFunc(i);
            }

            return arr;
        }

        /**
         * 二分查找,如果有多个则返回第一个
         * @param array 数组
         * @param target 寻找的目标
         * @param compare 比较函数
         * @param start 起始位置
         * @param end 结束位置
         * @returns          查找到目标时返回所在位置，否则返回-1
         */
        static binarySearch<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number
        {
            const insert = ArrayUtils.binarySearchInsert(array, target, compare, start, end);
            if (array[insert] === target)
            { return insert; }

            return -1;
        }
        /**
         * 二分查找插入位置,如果有多个则返回第一个
         * @param array 数组
         * @param target 寻找的目标
         * @param compare 比较函数
         * @param start 起始位置
         * @param end 结束位置
         * @returns          目标所在位置（如果该位置上不是目标对象，则该索引为该目标可插入的位置）
         */
        static binarySearchInsert<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number
        {
            if (start === undefined) start = 0;
            if (end === undefined) end = array.length;
            if (start === end)
            { return start; }
            if (compare(array[start], target) === 0)
            {
                return start;
            }
            const middle = ~~((start + end) / 2);
            if (compare(array[middle], target) < 0)
            {
                start = middle + 1;
            }
            else
            {
                end = middle;
            }

            return ArrayUtils.binarySearchInsert(array, target, compare, start, end);
        }

        /**
         * 判断数组是否唯一
         *
         * @param array 被检查数组
         * @param compare 比较函数
         */
        static isUnique<T>(array: T[], compare = (a: T, b: T) => a === b): boolean
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

        /**
         * 删除元素
         *
         * @param array 被操作数组
         * @param item 被删除元素
         * @returns 被删除元素在数组中的位置
         */
        static deleteItem<T>(array: T[], item: T): number
        {
            const index = array.indexOf(item);
            if (index !== -1) array.splice(index, 1);

            return index;
        }
    }

}