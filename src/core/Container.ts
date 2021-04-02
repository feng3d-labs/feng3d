// namespace feng3d
// {
//     export interface ContainerEventMap
//     {
//         /**
//          * 添加了子对象，当child被添加到parent中时派发冒泡事件
//          */
//         addChild: { parent: Container, child: Container }
//         /**
//          * 删除了子对象，当child被parent移除时派发冒泡事件
//          */
//         removeChild: { parent: Container, child: Container };

//         /**
//          * 自身被添加到父对象中事件
//          */
//         added: { parent: Container };

//         /**
//          * 自身从父对象中移除事件
//          */
//         removed: { parent: Container };
//     }

//     /**
//      * 
//      */
//     export class Container<T extends ContainerEventMap = ContainerEventMap> extends EventEmitter<T>
//     {
//         /**
//          * 名称
//          */
//         name: string;

//         protected _parent: Container;
//         protected _children: Container[] = [];

//         get parent()
//         {
//             return this._parent;
//         }

//         private _setParent(value: Container)
//         {
//             this._parent = value;
//         }

//         get numChildren()
//         {
//             return this._children.length;
//         }

//         /**
//          * 根据名称查找对象
//          * 
//          * @param name 对象名称
//          */
//         find(name: string): Container
//         {
//             if (this.name == name)
//                 return this;
//             for (var i = 0; i < this._children.length; i++)
//             {
//                 var target = this._children[i].find(name);
//                 if (target)
//                     return target;
//             }
//             return null;
//         }

//         /**
//          * 是否包含指定对象
//          * 
//          * @param child 可能的子孙对象
//          */
//         contains(child: Container)
//         {
//             var checkitem = child;
//             do
//             {
//                 if (checkitem == this)
//                     return true;
//                 checkitem = checkitem.parent;
//             } while (checkitem);
//             return false;
//         }

//         /**
//          * 添加子对象
//          * 
//          * @param child 子对象
//          */
//         addChild(child: Container)
//         {
//             if (child == null)
//                 return;
//             if (child.parent == this)
//             {
//                 // 把子对象移动到最后
//                 var childIndex = this._children.indexOf(child);
//                 if (childIndex != -1) this._children.splice(childIndex, 1);
//                 this._children.push(child);
//             } else
//             {
//                 if (child.contains(this))
//                 {
//                     console.error("无法添加到自身中!");
//                     return;
//                 }
//                 if (child._parent) child._parent.removeChild(child);
//                 child._setParent(this);
//                 this._children.push(child);
//                 child.emit("added", { parent: this });
//                 this.emit("addChild", { child: child, parent: this }, true);
//             }
//             return child;
//         }

//         /**
//          * 添加子对象
//          * 
//          * @param children 子对象
//          */
//         addChildren(...children: Container[])
//         {
//             for (let i = 0; i < children.length; i++)
//             {
//                 this.addChild(children[i]);
//             }
//         }

//         /**
//          * 移除自身
//          */
//         remove()
//         {
//             if (this.parent) this.parent.removeChild(this);
//         }

//         /**
//          * 移除所有子对象
//          */
//         removeChildren()
//         {
//             for (let i = this.numChildren - 1; i >= 0; i--)
//             {
//                 this.removeChildAt(i);
//             }
//         }

//         /**
//          * 移除子对象
//          * 
//          * @param child 子对象
//          */
//         removeChild(child: Container)
//         {
//             if (child == null) return;
//             var childIndex = this._children.indexOf(child);
//             if (childIndex != -1) this.removeChildInternal(childIndex, child);
//         }

//         /**
//          * 删除指定位置的子对象
//          * 
//          * @param index 需要删除子对象的所有
//          */
//         removeChildAt(index: number)
//         {
//             var child = this._children[index];
//             return this.removeChildInternal(index, child);
//         }

//         /**
//          * 获取指定位置的子对象
//          * 
//          * @param index 
//          */
//         getChildAt(index: number)
//         {
//             index = index;
//             return this._children[index];
//         }

//         /**
//          * 获取子对象列表（备份）
//          */
//         getChildren()
//         {
//             return this._children.concat();
//         }

//         private removeChildInternal(childIndex: number, child: Container)
//         {
//             childIndex = childIndex;
//             this._children.splice(childIndex, 1);
//             child._setParent(null);

//             child.emit("removed", { parent: this });
//             this.emit("removeChild", { child: child, parent: this }, true);
//         }
//     }
// }