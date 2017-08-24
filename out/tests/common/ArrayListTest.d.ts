declare namespace feng3d {
    class ArrayListTest {
        constructor();
        /**
         * 此集合中的项目数。
         */
        testLength(): void;
        /**
         * 向列表末尾添加指定项目。
         */
        testAddItem(): void;
        /**
         * 在指定的索引处添加项目。
         */
        testAddItemAt(): void;
        /**
         * 获取指定索引处的项目。
         */
        testGetItemAt(): void;
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        testGetItemIndex(): void;
        /**
         * 删除列表中的所有项目。
         */
        testRemoveAll(): void;
        /**
         * 删除指定项目。
         */
        testRemoveItem(): void;
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        testRemoveItemAt(): void;
        /**
         * 在指定的索引处放置项目。
         */
        testSetItemAt(): void;
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        testToArray(): void;
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        testAddItemEventListener(): void;
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        testRemoveItemEventListener(): void;
    }
}
