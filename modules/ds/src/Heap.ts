namespace feng3d
{
    /**
     * 堆
     * 
     * 最小和最大堆的父类。
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/heap/Heap.js
     */
    export abstract class Heap<T>
    {
        /**
         * 堆的数组表示。
         */
        private heapContainer: T[];

        /**
         * 比较器
         */
        protected compare: Comparator<T>;

        /**
         * 构建链表
         * 
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>)
        {
            if (new.target === Heap)
            {
                throw new TypeError('无法直接构造堆实例');
            }

            this.heapContainer = [];
            this.compare = new Comparator(comparatorFunction);
        }

        /**
         * 获取左边子结点索引
         * 
         * @param parentIndex 父结点索引
         */
        getLeftChildIndex(parentIndex: number)
        {
            return (2 * parentIndex) + 1;
        }

        /**
         * 获取右边子结点索引
         * 
         * @param parentIndex 父结点索引
         */
        getRightChildIndex(parentIndex: number)
        {
            return (2 * parentIndex) + 2;
        }

        /**
         * 获取父结点索引
         * 
         * @param childIndex 子结点索引
         */
        getParentIndex(childIndex: number)
        {
            return Math.floor((childIndex - 1) / 2);
        }

        /**
         * 是否有父结点
         * 
         * @param childIndex 子结点索引
         */
        hasParent(childIndex: number)
        {
            return this.getParentIndex(childIndex) >= 0;
        }

        /**
         * 是否有左结点
         * 
         * @param parentIndex 父结点索引
         */
        hasLeftChild(parentIndex: number)
        {
            return this.getLeftChildIndex(parentIndex) < this.heapContainer.length;
        }

        /**
         * 是否有右结点
         * 
         * @param parentIndex 父结点索引
         */
        hasRightChild(parentIndex: number)
        {
            return this.getRightChildIndex(parentIndex) < this.heapContainer.length;
        }

        /**
         * 获取左结点
         * 
         * @param parentIndex 父结点索引
         */
        leftChild(parentIndex: number)
        {
            return this.heapContainer[this.getLeftChildIndex(parentIndex)];
        }

        /**
         * 获取右结点
         * 
         * @param parentIndex 父结点索引
         */
        rightChild(parentIndex: number)
        {
            return this.heapContainer[this.getRightChildIndex(parentIndex)];
        }

        /**
         * 获取父结点
         * 
         * @param childIndex 子结点索引
         */
        parent(childIndex: number)
        {
            return this.heapContainer[this.getParentIndex(childIndex)];
        }

        /**
         * 交换两个结点数据
         * 
         * @param index1 索引1
         * @param index2 索引2
         */
        swap(index1: number, index2: number)
        {
            const tmp = this.heapContainer[index2];
            this.heapContainer[index2] = this.heapContainer[index1];
            this.heapContainer[index1] = tmp;
        }

        /**
         * 查看堆顶数据
         */
        peek()
        {
            if (this.heapContainer.length === 0) return null;
            return this.heapContainer[0];
        }

        /**
         * 出堆
         * 
         * 取出堆顶元素
         */
        poll()
        {
            if (this.heapContainer.length === 0) return null;

            if (this.heapContainer.length === 1) return this.heapContainer.pop();

            const item = this.heapContainer[0];

            // 将最后一个元素从末尾移动到堆顶。
            this.heapContainer[0] = this.heapContainer.pop();
            this.heapifyDown();

            return item;
        }

        /**
         * 新增元素
         * 
         * @param item 元素
         */
        add(item: T)
        {
            this.heapContainer.push(item);
            this.heapifyUp();
            return this;
        }

        /**
         * 移除所有指定元素
         * 
         * @param item 元素
         * @param comparator 比较器
         */
        remove(item: T, comparator = this.compare)
        {
            // 找到要删除的项的数量。
            const numberOfItemsToRemove = this.find(item, comparator).length;

            for (let iteration = 0; iteration < numberOfItemsToRemove; iteration += 1)
            {
                // 获取一个删除元素索引
                const indexToRemove = this.find(item, comparator).pop();

                // 删除元素为最后一个索引时
                if (indexToRemove === (this.heapContainer.length - 1))
                {
                    this.heapContainer.pop();
                } else
                {
                    // 把数组最后元素移动到删除位置
                    this.heapContainer[indexToRemove] = this.heapContainer.pop();

                    const parentItem = this.parent(indexToRemove);

                    if (
                        this.hasLeftChild(indexToRemove)
                        && (
                            !parentItem
                            || this.pairIsInCorrectOrder(parentItem, this.heapContainer[indexToRemove])
                        )
                    )
                    {
                        this.heapifyDown(indexToRemove);
                    } else
                    {
                        this.heapifyUp(indexToRemove);
                    }
                }
            }

            return this;
        }

        /**
         * 查找元素所在所有索引
         * 
         * @param item 查找的元素
         * @param comparator 比较器
         */
        find(item: T, comparator = this.compare)
        {
            const foundItemIndices: number[] = [];

            for (let itemIndex = 0; itemIndex < this.heapContainer.length; itemIndex += 1)
            {
                if (comparator.equal(item, this.heapContainer[itemIndex]))
                {
                    foundItemIndices.push(itemIndex);
                }
            }

            return foundItemIndices;
        }

        /**
         * 是否为空
         */
        isEmpty()
        {
            return !this.heapContainer.length;
        }

        /**
         * 转换为字符串
         */
        toString()
        {
            return this.heapContainer.toString();
        }

        /**
         * 堆冒泡
         * 
         * @param startIndex 堆冒泡起始索引
         */
        heapifyUp(startIndex?: number)
        {
            let currentIndex = startIndex || this.heapContainer.length - 1;

            while (
                this.hasParent(currentIndex)
                && !this.pairIsInCorrectOrder(this.parent(currentIndex), this.heapContainer[currentIndex])
            )
            {
                this.swap(currentIndex, this.getParentIndex(currentIndex));
                currentIndex = this.getParentIndex(currentIndex);
            }
        }

        /**
         * 堆下沉
         * 
         * @param startIndex 堆下沉起始索引
         */
        heapifyDown(startIndex = 0)
        {
            let currentIndex = startIndex;
            let nextIndex = null;

            while (this.hasLeftChild(currentIndex))
            {
                if (
                    this.hasRightChild(currentIndex)
                    && this.pairIsInCorrectOrder(this.rightChild(currentIndex), this.leftChild(currentIndex))
                )
                {
                    nextIndex = this.getRightChildIndex(currentIndex);
                } else
                {
                    nextIndex = this.getLeftChildIndex(currentIndex);
                }

                if (this.pairIsInCorrectOrder(
                    this.heapContainer[currentIndex],
                    this.heapContainer[nextIndex],
                ))
                {
                    break;
                }

                this.swap(currentIndex, nextIndex);
                currentIndex = nextIndex;
            }
        }


        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         * 
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        abstract pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}