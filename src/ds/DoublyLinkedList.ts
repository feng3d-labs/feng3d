namespace ds
{
    /**
     * 双向链表
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
         * 删除链表中所有与指定值相等的结点
         * 
         * @param value 结点值
         */
        delete(value: T)
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

            // 判断表尾是否被删除
            if (this.compare.equal(this.tail.value, value))
            {
                this.tail = currentNode;
            }

            return deletedNode;
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