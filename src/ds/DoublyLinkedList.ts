namespace ds
{
    /**
     * 双向列表
     */
    export class DoublyLinkedList<T>
    {

    }

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