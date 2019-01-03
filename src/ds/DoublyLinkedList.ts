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
         * 上一个节点
         */
        previous: DoublyLinkedListNode<T>;

        /**
         * 下一个节点
         */
        next: DoublyLinkedListNode<T>;
    }
}