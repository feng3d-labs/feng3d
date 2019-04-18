namespace feng3d
{
    /**
     * 优先队列
     * 
     * 与最小堆相同，只是与元素比较时不同
     * 我们考虑的不是元素的值，而是它的优先级。
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    export class PriorityQueue1<T> extends MinHeap<T>
    {
        private priorities: any;

        constructor()
        {
            super();
            this.priorities = {};
            this.compare = new Comparator(this.comparePriority.bind(this));
        }

        /**
         * 新增元素
         * 
         * @param item 元素
         * @param priority 优先级
         */
        add(item: T, priority = 0)
        {
            this.priorities[item] = priority;
            super.add(item);

            return this;
        }

        /**
         * 移除元素
         * 
         * @param item 元素
         * @param customFindingComparator 自定义查找比较器
         */
        remove(item: T, customFindingComparator = this.compare)
        {
            super.remove(item, customFindingComparator);
            delete this.priorities[item];

            return this;
        }

        /**
         * 改变元素优先级
         * 
         * @param item 元素
         * @param priority 优先级
         */
        changePriority(item: T, priority: number)
        {
            this.remove(item, new Comparator(this.compareValue));
            this.add(item, priority);

            return this;
        }

        /**
         * 查找元素所在索引
         * 
         * @param item 元素
         */
        findByValue(item: T)
        {
            return this.find(item, new Comparator(this.compareValue));
        }

        /**
         * 是否拥有元素
         * 
         * @param item 元素
         */
        hasValue(item: T)
        {
            return this.findByValue(item).length > 0;
        }

        /**
         * 比较两个元素优先级
         * 
         * @param a 元素a
         * @param b 元素b
         */
        comparePriority(a: T, b: T)
        {
            if (this.priorities[a] === this.priorities[b])
            {
                return 0;
            }

            return this.priorities[a] < this.priorities[b] ? -1 : 1;
        }

        /**
         * 比较两个元素大小
         * 
         * @param a 元素a
         * @param b 元素b
         */
        compareValue(a: T, b: T)
        {
            if (a === b)
            {
                return 0;
            }

            return a < b ? -1 : 1;
        }
    }

}