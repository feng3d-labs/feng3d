import { Constructor } from '../../polyfill/Types';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Component } from '../component/Component';
import { Entity, EntityEventMap } from './Entity';

export interface ContainerEventMap extends EntityEventMap
{
    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    addChild: { parent: Container, child: Container }

    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    removeChild: { parent: Container, child: Container };

    /**
     * 自身被添加到父对象中事件
     */
    added: { parent: Container };

    /**
     * 自身从父对象中移除事件
     */
    removed: { parent: Container };
}

/**
 * 容器
 *
 * 可以包含子对象，用于构成场景树结构。
 */
export class Container<T extends ContainerEventMap = ContainerEventMap> extends Entity<T>
{
    protected _parent: Container;
    protected _children: Container[] = [];

    /**
     * 父对象
     */
    get parent()
    {
        return this._parent;
    }

    /**
     * 子对象列表
     */
    @SerializeProperty
    get children()
    {
        return this._children.concat();
    }

    set children(value)
    {
        if (!value) return;
        for (let i = this._children.length - 1; i >= 0; i--)
        {
            this.removeChildAt(i);
        }
        for (let i = 0; i < value.length; i++)
        {
            this.addChild(value[i]);
        }
    }

    get numChildren()
    {
        return this._children.length;
    }

    /**
     * 自身以及子对象是否支持鼠标拾取
     */
    @SerializeProperty
    mouseEnabled = true;

    /**
     * 是否可见。
     */
    @SerializeProperty
    get visible()
    {
        return this._activeSelf;
    }
    set visible(v)
    {
        if (this._activeSelf === v) return;
        this._activeSelf = v;
        this._invalidateGlobalVisible();
    }
    private _activeSelf = true;

    /**
     * 是否全局可见。
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

    protected _updateGlobalVisible()
    {
        let visible = this.visible;
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

        this._children.forEach((c) =>
        {
            c._invalidateGlobalVisible();
        });
    }

    /**
     * 是否包含指定对象
     *
     * @param child 可能的子孙对象
     */
    contains(child: Container)
    {
        let checkItem = child;
        do
        {
            if (checkItem === this)
            {
                return true;
            }
            checkItem = checkItem.parent;
        } while (checkItem);

        return false;
    }

    /**
     * 添加子对象
     *
     * @param child 子对象
     */
    addChild(child: Container)
    {
        if (!child)
        {
            return;
        }
        if (child.parent === this)
        {
            // 把子对象移动到最后
            const childIndex = this._children.indexOf(child);
            if (childIndex !== -1) this._children.splice(childIndex, 1);
            this._children.push(child);
        }
        else
        {
            if (child.contains(this))
            {
                console.error('无法添加到自身中!');

                return;
            }
            if (child._parent) child._parent.removeChild(child);
            child._setParent(this);
            this._children.push(child);
            child.emit('added', { parent: this });
            this.emit('addChild', { child, parent: this }, true);
        }

        return child;
    }

    /**
     * 添加子对象
     *
     * @param children 子对象
     */
    addChildren(...children: Container[])
    {
        for (const childKey in children)
        {
            const child: Container = children[childKey];
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
        if (!child) return;
        const childIndex = this._children.indexOf(child);
        if (childIndex !== -1) this.removeChildInternal(childIndex, child);
    }

    /**
     * 删除指定位置的子对象
     *
     * @param index 需要删除子对象的所有
     */
    removeChildAt(index: number)
    {
        const child = this._children[index];
        this.removeChildInternal(index, child);

        return child;
    }

    /**
     * 获取指定位置的子对象
     *
     * @param index
     */
    getChildAt(index: number)
    {
        return this._children[index];
    }

    private removeChildInternal(childIndex: number, child: Container)
    {
        this._children.splice(childIndex, 1);
        child._setParent(null);

        child.emit('removed', { parent: this as any });
        this.emit('removeChild', { child, parent: this as any }, true);
    }

    protected _setParent(value: Container | null)
    {
        this._parent = value;
    }

    /**
     * Activates/Deactivates the Object3D, depending on the given true or false value.
     *
     * A Object3D may be inactive because a parent is not active. In that case, calling SetActive will not activate it, but only set the local state of the Object3D, which you can check using Object3D.activeSelf. Unity can then use this state when all parents become active.
     *
     * @param value Activate or deactivate the object, where true activates the Object3D and false deactivates the Object3D.
     */
    setActive(value: boolean)
    {
        this.visible = value;
    }

    /**
     * 根据名称查找对象
     *
     * @param name 对象名称
     */
    find(name: string): Container
    {
        if (this.name === name)
        {
            return this;
        }
        for (let i = 0; i < this._children.length; i++)
        {
            const target = this._children[i].find(name);
            if (target)
            {
                return target;
            }
        }

        return null;
    }

    /**
     * 遍历自身以及所有子结点。
     *
     * @param callback 回调函数。
     * @param results 存放回调函数结果的列表。
     *
     * @returns 回调函数结果的列表。
     */
    traverse<T>(callback: (container: Container) => T, results: T[] = [])
    {
        const result = callback(this);
        results.push(result);
        const children = this.children;
        for (let i = 0, l = children.length; i < l; i++)
        {
            children[i].traverse(callback, results);
        }

        return results;
    }

    /**
     * 遍历自身以及所有可见子结点。
     *
     * @param callback 回调函数。
     * @param results 存放回调函数结果的列表。
     *
     * @returns 回调函数结果的列表。
     */
    traverseVisible(callback: (container: Container) => T, results: T[] = [])
    {
        if (this.visible === false) return;
        const result = callback(this);
        results.push(result);
        const children = this.children;
        for (let i = 0, l = children.length; i < l; i++)
        {
            children[i].traverseVisible(callback, results);
        }

        return results;
    }

    /**
     * 遍历祖先结点。
     *
     * @param callback 回调函数。
     * @param results 存放回调函数结果的列表。
     *
     * @returns 回调函数结果的列表。
     */
    traverseAncestors(callback: (container: Container) => T, results: T[] = [])
    {
        const parent = this.parent;
        if (parent !== null)
        {
            const result = callback(parent);
            results.push(result);
            parent.traverseAncestors(callback, results);
        }

        return results;
    }

    /**
     * 使用深度优先搜索返回 Object3D 或其任何子项中的 Type 组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 匹配类型的组件（如果找到）。
     */
    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        const component = this.getComponent(type);
        if (component)
        {
            return component;
        }

        for (let i = 0; i < this.numChildren; i++)
        {
            const object3D = this.children[i];
            if (!includeInactive && !object3D.visible) continue;
            const component = object3D.getComponentInChildren(type, includeInactive);
            if (component)
            {
                return component;
            }
        }

        return null;
    }

    /**
     * 检索Container或其任何父项type中的 Type 组件。
     *
     * 此方法向上递归，直到找到具有匹配组件的 Container。仅匹配活动游戏对象上的组件。
     *
     * @param type 要查找的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
     */
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        if (includeInactive || this.visible)
        {
            const component = this.getComponent(type);
            if (component)
            {
                return component;
            }
        }

        if (this.parent)
        {
            const component = this.parent.getComponentInParent(type, includeInactive);
            if (component)
            {
                return component;
            }
        }

        return null;
    }

    /**
     * 使用深度优先搜索返回 Object3D 或其任何子子项中 Type 的所有组件。递归工作。
     *
     * Unity 在子游戏对象上递归搜索组件。这意味着它还包括目标 Object3D 的所有子 Container，以及所有后续子 Container。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动游戏对象上的组件是否应该包含在搜索结果中？
     * @param results 列出接收找到的组件。
     * @returns 所有找到的组件。
     */
    getComponentsInChildren<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        this.getComponents(type, results);

        for (let i = 0; i < this.children.length; i++)
        {
            const container = this.children[i];
            if (!includeInactive && !container.visible) continue;
            container.getComponentsInChildren(type, includeInactive, results);
        }

        return results;
    }

    /**
     * 返回Container或其任何父级中指定的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动组件是否应该包含在搜索结果中？
     * @param results 列出找到的组件。
     * @returns Container或其任何父级中指定的所有组件。
     */
    getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        if (includeInactive || this.visible)
        {
            this.getComponents(type, results);
        }

        if (this.parent)
        {
            this.parent.getComponentsInParent(type, includeInactive, results);
        }

        return results;
    }

    /**
     * 销毁
     */
    dispose()
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }
        for (let i = this._children.length - 1; i >= 0; i--)
        {
            const child = this.removeChildAt(i);
            child.dispose();
        }
        this._parent = null;
        this._children = null;
        super.dispose();
    }
}
