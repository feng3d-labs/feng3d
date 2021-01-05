namespace feng3d
{
    /**
     * 队列，只能从后面进，前面出
     * 使用单向链表实现
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/queue/Queue.js
     */
    export class Queue<T>
    {
        private linkedList: LinkedList<T>;

        /**
         * 构建队列
         * 
         * @param comparatorFunction 比较函数
         */
        constructor()
        {
            this.linkedList = new LinkedList();
        }

        /**
         * 是否为空
         */
        isEmpty()
        {
            return this.linkedList.isEmpty();
        }

        /**
         * 清空
         */
        empty()
        {
            this.linkedList.empty();
        }

        /**
         * 读取队列前面的元素，但不删除它。
         */
        peek()
        {
            return this.linkedList.getHeadValue();
        }

        /**
         * 入队
         * 
         * 在队列的末尾(链表的尾部)添加一个新元素。
         * 这个元素将在它前面的所有元素之后被处理。
         * 
         * @param value 元素值
         */
        enqueue(value: T)
        {
            this.linkedList.addTail(value);
            return this;
        }

        /**
         * 出队
         * 
         * 删除队列前面的元素(链表的头)。如果队列为空，则返回null。
         */
        dequeue()
        {
            const removedValue = this.linkedList.deleteHead();
            return removedValue;
        }

        /**
         * 转换为字符串
         * 
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string)
        {
            return this.linkedList.toString(valueToString);
        }
    }
}