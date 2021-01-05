namespace feng3d
{
    /**
     * 链表
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/linked-list/LinkedList.js
     */
    export class LinkedList<T>
    {
        /**
         * 表头
         */
        private head: LinkedListNode<T>;
        /**
         * 表尾
         */
        private tail: LinkedListNode<T>;

        /**
         * 比较器
         */
        private compare: Comparator<T>;

        /**
         * 构建双向链表
         * 
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>)
        {
            this.head = null;
            this.tail = null;
            this.compare = new Comparator(comparatorFunction);
        }

        /**
         * 是否为空
         */
        isEmpty()
        {
            return !this.head;
        }

        /**
         * 清空
         */
        empty()
        {
            this.head = null;
            this.tail = null;
        }

        /**
         * 获取表头值
         */
        getHeadValue()
        {
            return this.head && this.head.value;
        }

        /**
         * 添加新结点到表头
         * 
         * @param value 结点数据
         */
        addHead(value: T)
        {
            var newNode: LinkedListNode<T> = { value: value, next: this.head };
            this.head = newNode;
            if (!this.tail) this.tail = newNode;
            return this;
        }

        /**
         * 添加新结点到表尾
         * 
         * @param value 结点数据
         */
        addTail(value: T)
        {
            var newNode: LinkedListNode<T> = { value: value, next: null };
            if (this.tail) this.tail.next = newNode;
            this.tail = newNode;
            if (!this.head) this.head = newNode;
            return this;
        }

        /**
         * 删除链表中第一个与指定值相等的结点
         * 
         * @param value 结点值
         */
        delete(value: T)
        {
            if (!this.head) return null;

            let deletedNode: LinkedListNode<T> = null;

            // 从表头删除结点
            while (this.head && !deletedNode && this.compare.equal(this.head.value, value))
            {
                deletedNode = this.head;
                this.head = this.head.next;
            }

            let currentNode = this.head;

            if (!deletedNode && currentNode)
            {
                // 删除相等的下一个结点
                while (!deletedNode && currentNode.next)
                {
                    if (this.compare.equal(currentNode.next.value, value))
                    {
                        deletedNode = currentNode.next;
                        currentNode.next = currentNode.next.next;
                    } else
                    {
                        currentNode = currentNode.next;
                    }
                }
            }

            // currentNode 是否为表尾
            if (currentNode == null || currentNode.next == null)
            {
                this.tail = currentNode;
            }

            return deletedNode;
        }

        /**
         * 删除链表中所有与指定值相等的结点
         * 
         * @param value 结点值
         */
        deleteAll(value: T)
        {
            if (!this.head) return null;

            let deletedNode: LinkedListNode<T> = null;

            // 从表头删除结点
            while (this.head && this.compare.equal(this.head.value, value))
            {
                deletedNode = this.head;
                this.head = this.head.next;
            }

            let currentNode = this.head;

            if (currentNode !== null)
            {
                // 删除相等的下一个结点
                while (currentNode.next)
                {
                    if (this.compare.equal(currentNode.next.value, value))
                    {
                        deletedNode = currentNode.next;
                        currentNode.next = currentNode.next.next;
                    } else
                    {
                        currentNode = currentNode.next;
                    }
                }
            }

            // currentNode 是否为表尾
            if (currentNode == null || currentNode.next == null)
            {
                this.tail = currentNode;
            }

            return deletedNode;
        }

        /**
         * 查找与结点值相等的结点
         * 
         * @param value 结点值
         */
        find(value: T)
        {
            if (!this.head) return null;

            let currentNode = this.head;

            while (currentNode)
            {
                if (this.compare.equal(currentNode.value, value)) return currentNode;
                currentNode = currentNode.next;
            }
            return null;
        }

        /**
         * 查找与结点值相等的结点
         * 
         * @param callback 判断是否为查找的元素
         */
        findByFunc(callback: (value: T) => Boolean)
        {
            if (!this.head) return null;

            let currentNode = this.head;

            while (currentNode)
            {
                if (callback(currentNode.value)) return currentNode;
                currentNode = currentNode.next;
            }
            return null;
        }

        /**
         * 删除表头
         * 
         * 删除链表前面的元素(链表的头)并返回元素值。如果队列为空，则返回null。
         */
        deleteHead()
        {
            if (!this.head) return null;

            const deletedHead = this.head;

            if (this.head.next)
            {
                this.head = this.head.next;
            } else
            {
                this.head = null;
                this.tail = null;
            }

            return deletedHead.value;
        }

        /**
         * 删除表尾
         */
        deleteTail()
        {
            if (!this.tail) return null;

            const deletedTail = this.tail;

            if (this.head === this.tail)
            {
                this.head = null;
                this.tail = null;

                return deletedTail.value;
            }

            // 遍历链表删除表尾
            let currentNode = this.head;
            while (currentNode.next)
            {
                if (!currentNode.next.next)
                {
                    currentNode.next = null;
                } else
                {
                    currentNode = currentNode.next;
                }
            }

            this.tail = currentNode;

            return deletedTail.value;
        }

        /**
         * 从数组中初始化链表
         * 
         * @param values 结点值列表
         */
        fromArray(values: T[])
        {
            this.empty();
            values.forEach(value => this.addTail(value));
            return this;
        }

        /**
         * 转换为数组
         */
        toArray()
        {
            var values: T[] = [];
            var currentNode = this.head;
            while (currentNode)
            {
                values.push(currentNode.value);
                currentNode = currentNode.next;
            }
            return values;
        }

        /**
         * 转换为字符串
         * 
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string)
        {
            return this.toArray().map(value => valueToString ? valueToString(value) : `${value}`).toString();
        }

        /**
         * 反转链表
         */
        reverse()
        {
            let currNode = this.head;
            let prevNode = null;
            let nextNode = null;

            while (currNode)
            {
                // 存储下一个结点
                nextNode = currNode.next;

                // 反转结点的next指向
                currNode.next = prevNode;

                // 存储上一个节点
                prevNode = currNode;

                // 遍历指针向后移动
                currNode = nextNode;
            }

            // 重置表头与表尾
            this.tail = this.head;
            this.head = prevNode;

            return this;
        }

        /**
         * 核查结构是否正确
         */
        checkStructure()
        {
            if (this.head)
            {
                var currNode = this.head;
                while (currNode.next)
                {
                    currNode = currNode.next;
                }
                return this.tail == currNode;
            }
            return !this.tail;
        }
    }

    /**
     * 链表结点
     */
    export interface LinkedListNode<T>
    {
        /**
         * 值
         */
        value: T;
        /**
         * 下一个结点
         */
        next: LinkedListNode<T>;
    }
}