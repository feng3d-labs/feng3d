namespace feng3d
{
    export interface ContainerEventMap<T = Container> extends EntityEventMap
    {
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        addChild: { parent: T, child: T }
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removeChild: { parent: T, child: T };

        /**
         * 自身被添加到父对象中事件
         */
        added: { parent: T };

        /**
         * 自身从父对象中移除事件
         */
        removed: { parent: T };
    }

    export interface Container
    {
        once<K extends keyof ContainerEventMap>(type: K, listener: (event: Event<ContainerEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof ContainerEventMap>(type: K, data?: ContainerEventMap[K], bubbles?: boolean): Event<ContainerEventMap[K]>;
        has<K extends keyof ContainerEventMap>(type: K): boolean;
        on<K extends keyof ContainerEventMap>(type: K, listener: (event: Event<ContainerEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof ContainerEventMap>(type?: K, listener?: (event: Event<ContainerEventMap[K]>) => any, thisObject?: any): void;
    }

    export class Container extends Entity
    {
        protected _parent: Container;
        protected _children: Container[] = [];

        get parent()
        {
            return this._parent;
        }

        /**
         * 子对象
         */
        @serialize
        get children()
        {
            return this._children.concat();
        }

        set children(value)
        {
            if (!value) return;
            for (var i = this._children.length - 1; i >= 0; i--)
            {
                this.removeChildAt(i)
            }
            for (var i = 0; i < value.length; i++)
            {
                this.addChild(value[i]);
            }
        }

        get numChildren()
        {
            return this._children.length;
        }

        /**
         * 是否包含指定对象
         * 
         * @param child 可能的子孙对象
         */
        contains(child: Container)
        {
            var checkitem = child;
            do
            {
                if (checkitem == this)
                    return true;
                checkitem = checkitem.parent;
            } while (checkitem);
            return false;
        }

        /**
         * 添加子对象
         * 
         * @param child 子对象
         */
        addChild(child: Container)
        {
            if (child == null)
                return;
            if (child.parent == this)
            {
                // 把子对象移动到最后
                var childIndex = this._children.indexOf(child);
                if (childIndex != -1) this._children.splice(childIndex, 1);
                this._children.push(child);
            } else
            {
                if (child.contains(this))
                {
                    console.error("无法添加到自身中!");
                    return;
                }
                if (child._parent) child._parent.removeChild(child);
                child._setParent(this);
                this._children.push(child);
                child.dispatch("added", { parent: this });
                this.dispatch("addChild", { child: child, parent: this }, true);
            }
            return child;
        }

        /**
         * 添加子对象
         * 
         * @param childarray 子对象
         */
        addChildren(...childarray: GameObject[])
        {
            for (var child_key_a in childarray)
            {
                var child: GameObject = childarray[child_key_a];
                this.addChild(child);
            }
        }

        /**
         * 移除自身
         */
        remove()
        {
            if (this.parent) this.parent.removeChild(this);
        }

        /**
         * 移除所有子对象
         */
        removeChildren()
        {
            for (let i = this.numChildren - 1; i >= 0; i--)
            {
                this.removeChildAt(i);
            }
        }

        /**
         * 移除子对象
         * 
         * @param child 子对象
         */
        removeChild(child: Container)
        {
            if (child == null) return;
            var childIndex = this._children.indexOf(child);
            if (childIndex != -1) this.removeChildInternal(childIndex, child);
        }

        /**
         * 删除指定位置的子对象
         * 
         * @param index 需要删除子对象的所有
         */
        removeChildAt(index: number)
        {
            var child = this._children[index];
            return this.removeChildInternal(index, child);
        }

        /**
         * 获取指定位置的子对象
         * 
         * @param index 
         */
        getChildAt(index: number)
        {
            index = index;
            return this._children[index];
        }

        /**
         * 获取子对象列表（备份）
         */
        getChildren()
        {
            return this._children.concat();
        }

        protected _setParent(value: Container | null)
        {
            this._parent = value;
        }

        private removeChildInternal(childIndex: number, child: Container)
        {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child._setParent(null);

            child.dispatch("removed", { parent: this as any });
            this.dispatch("removeChild", { child: child, parent: this as any }, true);
        }

    }
}