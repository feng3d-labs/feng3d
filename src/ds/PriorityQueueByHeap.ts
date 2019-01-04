module ds
{
    /**
     * 优先队列，自动按优先级排序
     * 
     * 与最小堆相同，只是与元素比较时不同
     * 我们考虑的不是元素的值，而是它的优先级。
     */
    export class PriorityQueueByHeap<T>
    {
        /**
         * 优先值Map
         */
        private priorities: any;

        /**
         * 最小堆
         */
        private minHeap: MinHeap<T>;

        /**
         * 构建优先队列
         */
        constructor()
        {
            this.priorities = {};
            this.minHeap = new MinHeap(this.comparePriority.bind(this));
        }

        /**
         * 新增元素
         * 
         * @param item 元素
         */
        add(item: T, priority = 0)
        {
            this.priorities[item] = priority;
            this.minHeap.add(item);

            return this;
        }

        /**
         * 移除指定元素 
         * @param item 元素
         * @param customFindingComparator 自定义查找比较器
         */
        remove(item: T, customFindingComparator: Comparator<T>)
        {
            this.minHeap.remove(item, customFindingComparator);
            delete this.priorities[item];

            return this;
        }

        /**
         * 改变指定元素优先级
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
         * 查找指定元素索引
         * 
         * @param item 元素
         */
        findByValue(item: T)
        {
            return this.minHeap.find(item, new Comparator(this.compareValue));
        }

        /**
         * 是否拥有指定元素
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
         * 比较两个元素
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