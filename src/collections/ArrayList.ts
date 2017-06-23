namespace feng3d
{
    export class ArrayList<T> extends EventDispatcher implements IList<T>
    {
        private readonly _source: T[];
        private readonly _eventDispatcher: EventDispatcher;

        /**
         * 此集合中的项目数。
         */
        get length()
        {
            return this._source.length;
        }

        constructor(source: T[] = null)
        {
            super();
            this._source = source || [];
            this._eventDispatcher = new EventDispatcher();
        }

        /**
         * 向列表末尾添加指定项目。
         */
        addItem(item: T | T[]): void
        {
            this.addItemAt(item, this._source.length);
        }

        /**
         * 在指定的索引处添加项目。
         */
        addItemAt(item: T | T[], index: number): void
        {
            if (item instanceof Array)
            {
                for (var i = item.length - 1; i >= 0; i--)
                {
                    this.addItemAt(item[i], index);
                }
            } else
            {
                this._source.splice(index, 0, item);
                if (item instanceof EventDispatcher)
                {
                    var _listenermap = this._eventDispatcher["_listenermap"];
                    for (var type in _listenermap)
                    {
                        var listenerVOs = _listenermap[type];
                        for (var i = 0; i < listenerVOs.length; i++)
                        {
                            var element = listenerVOs[i];
                            item.addEventListener(type, element.listener, element.thisObject, element.priority);
                        }
                    }
                }
            }
        }

        /**
         * 获取指定索引处的项目。
         */
        getItemAt(index: number): T
        {
            return this._source[index];
        }

        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        getItemIndex(item: T): number
        {
            return this._source.indexOf(item);
        }

        /**
         * 删除列表中的所有项目。
         */
        removeAll(): void
        {
            while (this._source.length > 0)
            {
                this.removeItemAt(this._source.length - 1);
            }
        }

        /**
         * 删除指定项目。
         */
        removeItem(item: T | T[]): void
        {
            if (item instanceof Array)
            {
                for (var i = item.length - 1; i >= 0; i--)
                {
                    this.removeItem(item[i]);
                }
            } else
            {
                var index = this.getItemIndex(item);
                if (index > -1)
                    this.removeItemAt(index);
            }
        }

        /**
         * 删除指定索引处的项目并返回该项目。
         */
        removeItemAt(index: number): T
        {
            var item = this._source.splice(index, 1)[0];
            if (item instanceof EventDispatcher)
            {
                var _listenermap = this._eventDispatcher["_listenermap"];
                for (var type in _listenermap)
                {
                    var listenerVOs = _listenermap[type];
                    for (var i = 0; i < listenerVOs.length; i++)
                    {
                        var element = listenerVOs[i];
                        item.removeEventListener(type, element.listener, element.thisObject);
                    }
                }
            }
            return item;
        }

        /**
         * 在指定的索引处放置项目。
         */
        setItemAt(item: T, index: number): T
        {
            var deleteItem = this.removeItemAt(index);
            this.addItemAt(item, index);
            return deleteItem;
        }

        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        toArray(): T[]
        {
            return this._source.concat();
        }

        /**
         * 添加项事件
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addItemEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority = 0): void
        {
            this._eventDispatcher.addEventListener(type, listener, thisObject, priority);
            for (var i = 0; i < this._source.length; i++)
            {
                if (item instanceof EventDispatcher)
                {
                    var item: EventDispatcher = <any>this._source[i]
                    item.addEventListener(type, listener, thisObject, priority);
                }
            }
        }

        /**
		 * 移除项事件
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeItemEventListener(type: string, listener: (event: Event) => void, thisObject: any): void
        {
            this._eventDispatcher.removeEventListener(type, listener, thisObject);
            for (var i = 0; i < this._source.length; i++)
            {
                var item: EventDispatcher = <any>this._source[i]
                if (item instanceof EventDispatcher)
                {
                    item.removeEventListener(type, listener, thisObject);
                }
            }
        }
    }
}