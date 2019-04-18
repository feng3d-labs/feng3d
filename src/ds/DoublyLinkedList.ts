namespace feng3d
{
    /**
     * 双向链表
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/doubly-linked-list/DoublyLinkedList.js
     */
    export class DoublyLinkedList<T>
    {
        /**
         * 表头
         */
        private head: DoublyLinkedListNode<T>;
        /**
         * 表尾
         */
        private tail: DoublyLinkedListNode<T>;

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
         * 添加新结点到表头
         * 
         * @param value 结点数据
         */
        addHead(value: T)
        {
            const newNode: DoublyLinkedListNode<T> = { value: value, previous: null, next: this.head };
            if (this.head) this.head.previous = newNode;
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
            var newNode: DoublyLinkedListNode<T> = { value: value, previous: this.tail, next: null };
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

            let deletedNode: DoublyLinkedListNode<T> = null;

            // 从表头删除结点
            while (this.head && !deletedNode && this.compare.equal(this.head.value, value))
            {
                deletedNode = this.head;
                this.head = this.head.next;
                this.head.previous = null;
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
                        if (currentNode.next) currentNode.next.previous = currentNode;
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

            let deletedNode: DoublyLinkedListNode<T> = null;

            // 从表头删除结点
            while (this.head && this.compare.equal(this.head.value, value))
            {
                deletedNode = this.head;
                this.head = this.head.next;
                this.head.previous = null;
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
                        if (currentNode.next) currentNode.next.previous = currentNode;
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
         */
        deleteHead()
        {
            if (!this.head) return undefined;

            const deletedHead = this.head;

            if (this.head.next)
            {
                this.head = this.head.next;
                this.head.previous = null;
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
            if (!this.tail) return undefined;

            const deletedTail = this.tail;

            if (this.head === this.tail)
            {
                this.head = null;
                this.tail = null;

                return deletedTail.value;
            }

            this.tail = this.tail.previous;
            this.tail.next = null;

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
                // 存储当前结点的next与previous指向
                nextNode = currNode.next;
                prevNode = currNode.previous;

                // 反转结点的next与previous指向
                currNode.next = prevNode;
                currNode.previous = nextNode;

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
                // 核查正向链表
                var currNode = this.head;
                while (currNode.next)
                {
                    currNode = currNode.next;
                }
                if (this.tail !== currNode) return false;

                // 核查逆向链表
                currNode = this.tail;
                while (currNode.previous)
                {
                    currNode = currNode.previous;
                }
                return this.head == currNode;
            }
            return !this.tail;
        }
    }

    /**
     * 双向链接结点
     */
    export interface DoublyLinkedListNode<T>
    {
        /**
         * 值
         */
        value: T;

        /**
         * 上一个结点
         */
        previous: DoublyLinkedListNode<T>;

        /**
         * 下一个结点
         */
        next: DoublyLinkedListNode<T>;
    }
}