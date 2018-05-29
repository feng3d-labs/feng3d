namespace ds
{
    /**
     * 队列，只能从后面进，前面出
     * 使用单向链表实现
     */
    export class Queue<T>
    {
        private first: Node<T>;
        private last: Node<T>;
        private length = 0;

        /**
         * 尾部添加元素（进队）
         * @param items 元素列表
         * @returns 长度
         */
        push(...items: T[])
        {
            items.forEach(item =>
            {
                var node: Node<T> = { item: item, next: null };
                if (this.last) this.last.next = node;
                this.last = node;
                if (!this.first) this.first = node;
                this.length++;
            });
            return this.length;
        }

        /**
         * 头部移除元素（出队）
         */
        shift()
        {
            var removeitem = this.first ? this.first.item : undefined;
            if (this.length == 1)
                this.first = this.last = null;
            if (this.first)
                this.first = this.first.next;
            return removeitem;
        }

        /**
         * 转换为数组
         */
        toArray()
        {
            var arr: T[] = [];
            var node = this.first;
            while (node)
            {
                arr.push(node.item);
                node = node.next;
            }
            return arr;
        }

        /**
         * 从数组初始化链表
         */
        fromArray(array: T[])
        {
            this.first = this.last = null;
            this.push.apply(this, array);
            return this;
        }
    }

    interface Node<T>
    {
        item: T;
        next: Node<T>;
    }
}