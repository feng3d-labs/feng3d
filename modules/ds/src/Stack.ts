namespace feng3d
{
    /**
     * 栈
     * 
     * 后进先出
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/stack/Stack.js
     */
    export class Stack<T>
    {
        private linkedList = new LinkedList<T>();

        /**
         * 是否为空
         */
        isEmpty()
        {
            return this.linkedList.isEmpty();
        }

        /**
         * 查看第一个元素值
         */
        peek()
        {
            return this.linkedList.getHeadValue();
        }

        /**
         * 入栈
         * 
         * @param value 元素值
         */
        push(value: T)
        {
            this.linkedList.addHead(value);
            return this;
        }

        /**
         * 出栈
         */
        pop()
        {
            return this.linkedList.deleteHead();
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