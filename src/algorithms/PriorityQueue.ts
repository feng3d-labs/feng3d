namespace feng3d
{
    /**
     * 优先队列
     * 
     * 所有元素按优先级排序
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    export class PriorityQueue<T>
    {
        private items: T[] = [];

        /**
         * 队列长度
         */
        get length()
        {
            return this.items.length;
        }

        /**
         * 比较函数
         */
        get compare()
        {
            return this._compare;
        }
        set compare(v)
        {
            this._compare = v;
            this.items.sort(this._compare);
        }
        private _compare: (a: T, b: T) => number;

        /**
         * 构建优先数组
         * @param   compare     比较函数
         */
        constructor(compare: (a: T, b: T) => number)
        {
            this.compare = compare;
        }

        /**
         * 尾部添加元素（进队）
         * @param items 元素列表
         * @returns 长度
         */
        push(...items: T[])
        {
            items.forEach(item =>
            {
                var insert = Array.binarySearchInsert(this.items, item, this._compare);
                this.items.splice(insert, 0, item);
            });
            return this.items.length;
        }

        /**
         * 头部移除元素（出队）
         */
        shift()
        {
            return this.items.shift();
        }

        /**
         * 转换为数组
         */
        toArray()
        {
            return this.items.concat();
        }

        /**
         * 从数组初始化链表
         */
        fromArray(array: T[])
        {
            this.items = array.concat();
            this.items.sort(this._compare);
        }
    }
}