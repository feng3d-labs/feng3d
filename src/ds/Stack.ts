namespace ds
{
    /**
     * 栈
     * 
     * 后进先出
     */
    export class Stack<T>
    {
        private linkedList = new LinkedList<T>();

        /**
         * 是否为空
         */
        isEmpty()
        {
            return !this.linkedList.head;
        }

        /**
         * 查看第一个元素值
         */
        peek()
        {
            if (this.isEmpty()) return null;
            return this.linkedList.head.value;
        }

        /**
         * 入栈
         * 
         * @param value 元素值
         */
        push(value: T)
        {
            this.linkedList.addHead(value);
        }

        /**
         * 出栈
         */
        pop()
        {
            const removedValue = this.linkedList.deleteHead();
            return removedValue;
        }

        /**
         * 转换为数组
         */
        toArray()
        {
            return this.linkedList.toArray();
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