namespace feng3d
{
    export interface ComponentEventMap extends NodeEventMap { }

    export interface NodeEventMap
    {
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        childAdded: { parent: Node, child: Node, index: number }

        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        childRemoved: { parent: Node, child: Node, index: number };

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

    @RegisterComponent({ single: true })
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
            return this._children;
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
         * 自身以及子对象是否支持鼠标拾取
         */
        @serialize
        mouseEnabled = true;

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
        addChild<T extends Node[]>(...children: T): T[0]
        {
            if (children.length > 1)
            {
                for (let i = 0; i < children.length; i++)
                {
                    this.addChild(children[i]);
                }
            }
            else
            {
                const child = children[0];
                this.addChildAt(child, this._children.length);
            }
            return children[0];
        }

        addChildAt<T extends Node>(child: T, index: number): T
        {
            if (index < 0 || index > this._children.length)
            {
                throw new Error(`${child}addChildAt: The index ${index} supplied is out of bounds ${this._children.length}`);
            }

            if (child._parent)
            {
                child._parent.removeChild(child);
            }

            child._setParent(this);

            this._children.splice(index, 0, child);

            this.onChildrenChange(index);
            child.emit("added", { parent: this });
            this.emit("childAdded", { child: child, parent: this, index: index }, true);
            return child;
        }

        /**
         * 
         * @param child 
         * @param child2 
         */
        swapChildren(child: Node, child2: Node)
        {
            if (child === child2)
            {
                return;
            }

            const index1 = this.getChildIndex(child);
            const index2 = this.getChildIndex(child2);

            this._children[index1] = child2;
            this._children[index2] = child;
            this.onChildrenChange(index1 < index2 ? index1 : index2);

            return this;
        }

        /***
         * 
         */
        protected onChildrenChange(index?: number): void
        {
            /* empty */
        }

        /**
         * 
         * @param child 
         */
        getChildIndex(child: Node): number
        {
            const index = this._children.indexOf(child);

            if (index === -1)
            {
                throw new Error('The supplied Node must be a child of the caller');
            }

            return index;
        }

        /**
         * 
         * @param child 
         * @param index 
         */
        setChildIndex(child: Node, index: number): void
        {
            if (index < 0 || index >= this._children.length)
            {
                throw new Error(`The index ${index} supplied is out of bounds ${this._children.length}`);
            }

            const currentIndex = this.getChildIndex(child);

            this._children.splice(currentIndex, 1);
            this._children.splice(index, 0, child);

            this.onChildrenChange(index);
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
        removeChildren(beginIndex = 0, endIndex = this._children.length): Node[]
        {
            beginIndex = Math.clamp(beginIndex, 0, this._children.length);
            endIndex = Math.clamp(endIndex, 0, this._children.length);

            var removed = this._children.slice(beginIndex, endIndex);
            for (let i = endIndex - 1; i >= beginIndex; i--)
            {
                this.removeChildAt(i);
            }
            return removed;
        }

        /**
         * 移除子对象
         * 
         * @param child 子对象
         */
        removeChild<T extends Node[]>(...children: T): T[0]
        {
            if (children.length > 1)
            {
                for (let i = 0; i < children.length; i++)
                {
                    this.removeChild(children[i]);
                }
            }
            else
            {
                const child = children[0];
                const index = this._children.indexOf(child);

                if (index === -1) return null;

                this.removeChildAt(index);
            }
            return children[0];
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

            this.onChildrenChange(index);
            child.emit("removed", { parent: this });
            this.emit("childRemoved", { child: child, parent: this, index }, true);
            return child;
        }

        /**
         * 获取指定位置的子对象
         * 
         * @param index 
         */
        getChildAt(index: number)
        {
            if (index < 0 || index >= this._children.length)
            {
                throw new Error(`getChildAt: Index (${index}) does not exist.`);
            }
            return this._children[index];
        }

        /**
         * 获取子对象列表（备份）
         */
        getChildren(start?: number, end?: number)
        {
            return this._children.slice(start, end);
        }

        /**
         * 从自身与子代（孩子，孩子的孩子，...）Entity 中获取所有指定类型的组件
         * 
         * @param type		要检索的组件的类型。
         * @return			返回与给出类定义一致的组件
         * 
         * @todo 与 Node3D.getComponentsInChildren 代码重复，有待优化
         */
        getComponentsInChildren<T extends Components>(type?: Constructor<T>, filter?: (compnent: T) => {
            /**
             * 是否继续查找子项
             */
            findchildren: boolean,
            /**
             * 是否为需要查找的组件
             */
            value: boolean
        }, result?: T[]): T[]
        {
            result = result || [];
            var findchildren = true;
            var cls = type;
            var components = this.entity.components;
            for (var i = 0, n = components.length; i < n; i++)
            {
                var item = <T>components[i];
                if (!cls)
                {
                    result.push(item);
                } else if (item instanceof cls)
                {
                    if (filter)
                    {
                        var filterresult = filter(item);
                        filterresult && filterresult.value && result.push(item);
                        findchildren = filterresult ? (filterresult && filterresult.findchildren) : false;
                    }
                    else
                    {
                        result.push(item);
                    }
                }
            }
            if (findchildren)
            {
                const children = this.children;
                for (var i = 0, n = children.length; i < n; i++)
                {
                    const child = children[i];
                    if (child instanceof Node2D)
                    {
                        child.getComponentsInChildren(type, filter, result);
                    }
                }
            }
            return result;
        }

        /**
         * 从父代（父亲，父亲的父亲，...）中获取组件
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends Components>(type?: Constructor<T>, result?: T[]): T[]
        {
            result = result || [];
            var parent = this.parent;
            while (parent)
            {
                var compnent = parent.getComponent(type);
                compnent && result.push(compnent);
                parent = parent.parent;
            }
            return result;
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