namespace feng3d
{
    export interface ComponentEventMap extends NodeEventMap { }

    export interface NodeEventMap
    {
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        addChild: { parent: Node, child: Node, index: number }

        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removeChild: { parent: Node, child: Node, index: number };

        /**
         * 自身被添加到父对象中事件
         */
        added: { parent: Node };

        /**
         * 自身从父对象中移除事件
         */
        removed: { parent: Node };

        /**
         * 当GameObject的scene属性被设置是由Scene派发
         */
        addedToScene: Node;

        /**
         * 当GameObject的scene属性被清空时由Scene派发
         */
        removedFromScene: Node;
    }

    export class Node<T extends ComponentEventMap = ComponentEventMap> extends Component<T>
    {
        protected _children: Node[] = [];

        get parent()
        {
            return this._parent;
        }
        protected _parent: Node;

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
         * 是否显示
         */
        @serialize
        get visible()
        {
            this.on("added",(e)=>{
                e.data.parent
            })
            return this._visible;
        }
        set visible(v)
        {
            if (this._visible == v) return;
            this._visible = v;
            this._invalidateGlobalVisible();
        }
        private _visible = true;

        /**
         * 全局是否可见
         */
        get globalVisible()
        {
            if (this._globalVisibleInvalid)
            {
                this._updateGlobalVisible();
                this._globalVisibleInvalid = false;
            }
            return this._globalVisible;
        }
        protected _globalVisible = false;
        protected _globalVisibleInvalid = true;


        /**
         * 根据名称查找对象
         * 
         * @param name 对象名称
         */
        find(name: string): Node
        {
            if (this.name == name)
                return this;
            for (var i = 0; i < this._children.length; i++)
            {
                var target = this._children[i].find(name);
                if (target)
                    return target;
            }
            return null;
        }

        /**
         * 是否包含指定对象
         * 
         * @param child 可能的子孙对象
         */
        contains(child: Node)
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
        addChild(child: Node)
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
                this.addChildAt(child, this._children.length);
            }
            return child;
        }

        addChildAt<T extends Node>(child: T, index: number): T
        {
            if (child._parent)
            {
                child._parent.removeChild(child);
            }
            child._setParent(this);
            this._children.push(child);
            child.emit("added", { parent: this });
            this.emit("addChild", { child: child, parent: this, index: index }, true);
            return child;
        }

        /**
         * 添加子对象
         * 
         * @param children 子对象
         */
        addChildren(...children: Node[])
        {
            for (let i = 0; i < children.length; i++)
            {
                this.addChild(children[i]);
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
        removeChild(child: Node)
        {
            if (child == null) return;
            var childIndex = this._children.indexOf(child);
            if (childIndex != -1)
            {
                this.removeChildAt(childIndex);
            }
        }

        /**
         * 删除指定位置的子对象
         * 
         * @param index 需要删除子对象的所有
         */
        removeChildAt(index: number)
        {
            var child = this._children[index];
            this._children.splice(index, 1);
            child._setParent(null);

            child.emit("removed", { parent: this });
            this.emit("removeChild", { child: child, parent: this, index }, true);
            return child;
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
        getChildren(start?: number, end?: number)
        {
            return this._children.slice(start, end);
        }

        protected _setParent(value: Node)
        {
            this._parent = value;
        }

        protected _updateGlobalVisible()
        {
            var visible = this.visible;
            if (this.parent)
            {
                visible = visible && this.parent.globalVisible;
            }
            this._globalVisible = visible;
        }

        protected _invalidateGlobalVisible()
        {
            if (this._globalVisibleInvalid) return;

            this._globalVisibleInvalid = true;

            this._children.forEach(c =>
            {
                c._invalidateGlobalVisible();
            });
        }
    }
}