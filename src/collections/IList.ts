namespace feng3d
{
    /**
     * 按顺序组织的项目的集合。提供基于索引的访问和处理方法。
     */
    export interface IList<T>
    {
        /**
         * 此集合中的项目数。
         */
        readonly length: number;

        /**
         * 向列表末尾添加指定项目。
         */
        addItem(item: T): void

        /**
         * 在指定的索引处添加项目。
         */
        addItemAt(item: T, index: number): void

        /**
         * 获取指定索引处的项目。
         */
        getItemAt(index: number): T

        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        getItemIndex(item: T): number

        /**
         * 删除列表中的所有项目。
         */
        removeAll(): void

        /**
         * 删除指定项目。
         */
        removeItem(item: T): void;

        /**
         * 删除指定索引处的项目并返回该项目。
         */
        removeItemAt(index: number): T

        /**
         * 在指定的索引处放置项目。
         */
        setItemAt(item: T, index: number): T

        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        toArray(): T[];

        /**
         * 添加项事件
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addItemEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;

        /**
		 * 移除项事件
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeItemEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
    }
}