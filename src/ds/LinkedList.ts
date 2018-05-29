namespace ds
{
    /**
     * (双向)链表
     */
    export class LinkedList<T>
    {
        private first: Node<T>;
        private last: Node<T>;
        private length = 0;

        /**
         * 头部添加元素，如果多个元素则保持顺序不变
         * @param items 元素列表
         * @returns 长度
         */
        unshift(...items: T[])
        {
            for (let i = items.length - 1; i >= 0; i--)
            {
                const item = items[i];
                var newitem: Node<T> = { item: item, previous: null, next: this.first };
                if (this.first) this.first.previous = newitem;
                this.first = newitem;
                if (!this.last) this.last = this.first;
                this.length++
            }
            return this.length
        }

        /**
         * 尾部添加元素，如果多个元素则保持顺序不变
         * @param items 元素列表
         * @returns 长度
         */
        push(...items: T[])
        {
            items.forEach(item =>
            {
                var node: Node<T> = { item: item, previous: this.last, next: null };
                if (this.last) this.last.next = node;
                this.last = node;
                if (!this.first) this.first = node;
                this.length++;
            });
            return this.length;
        }

        /**
         * 头部移除元素
         */
        shift(): T | undefined
        {
            var removeitem = this.first ? this.first.item : undefined;
            if (this.length == 1)
                this.first = this.last = null;
            if (this.first)
                this.first = this.first.next;
            if (this.first)
                this.first.previous = null;
            return removeitem;
        }

        /**
         * 尾部移除元素
         */
        pop(): T | undefined
        {
            var removeitem = this.last ? this.last.item : undefined;
            if (this.length == 1)
                this.first = this.last = null;
            if (this.last)
                this.last = this.last.previous;
            if (this.last)
                this.last.next = null;
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
        previous: Node<T>;
        next: Node<T>;
    }
}