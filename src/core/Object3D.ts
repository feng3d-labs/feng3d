import { oav } from '@feng3d/objectview';
import { Constructor, decoratorRegisterClass, gPartial, IDisposable } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialization, serialize } from '@feng3d/serialization';
import { AssetType } from '../assets/AssetType';
import { Component, Components } from '../component/Component';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';
import { Feng3dObject, Feng3dObjectEventMap } from './Feng3dObject';
import { MouseEventMap } from './Mouse3DManager';
import { Renderable } from './Renderable';
import { ScriptComponent } from './ScriptComponent';
import { Transform } from './Transform';

declare global
{
    interface MixinsObject3DEventMap { }
    interface MixinsPrimitiveObject3D { }
    interface MixinsObject3D { }
}

export interface Object3DEventMap extends MixinsObject3DEventMap, MouseEventMap, Feng3dObjectEventMap
{
    /**
     * 添加子组件事件
     */
    addComponent: { object3D: Object3D, component: Component };

    /**
     * 移除子组件事件
     */
    removeComponent: { object3D: Object3D, component: Component };

    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    addChild: { parent: Object3D, child: Object3D }
    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    removeChild: { parent: Object3D, child: Object3D };

    /**
     * 自身被添加到父对象中事件
     */
    added: { parent: Object3D };

    /**
     * 自身从父对象中移除事件
     */
    removed: { parent: Object3D };

    /**
     * 当Object3D的scene属性被设置是由Scene派发
     */
    addedToScene: Object3D;

    /**
     * 当Object3D的scene属性被清空时由Scene派发
     */
    removedFromScene: Object3D;

    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;

    /**
     * 刷新界面
     */
    refreshView: any;

    /**
     * 场景变换改变事件
     */
    scenetransformChanged: void;

    /**
     * 本地转世界矩阵更新事件
     */
    updateLocalToWorldMatrix: void;
}

export interface Object3D extends MixinsObject3D { }

/**
 * 游戏对象，场景唯一存在的对象类型
 */
@decoratorRegisterClass()
export class Object3D extends Feng3dObject<Object3DEventMap> implements IDisposable
{
    __class__: 'Object3D';

    assetType = AssetType.object3D;

    /**
     * 名称
     */
    @serialize
    @oav({ component: 'OAVObject3DName' })
    declare name: string;

    /**
     * The local active state of this Object3D.
     *
     * This returns the local active state of this Object3D. Note that a Object3D may be inactive because a parent is not active, even if this returns true. This state will then be used once all parents are active. Use Object3D.activeInHierarchy if you want to check if the Object3D is actually treated as active in the Scene.
     */
    @serialize
    get activeSelf()
    {
        return this._activeSelf;
    }
    set activeSelf(v)
    {
        if (this._activeSelf === v) return;
        this._activeSelf = v;
        this._invalidateActiveInHierarchy();
    }
    private _activeSelf = true;

    /**
     * Defines whether the Object3D is active in the Scene.
     *
     * This lets you know whether a Object3D is active in the game. That is the case if its Object3D.activeSelf property is enabled, as well as that of all its parents.
     */
    get activeInHierarchy()
    {
        if (this._activeInHierarchyInvalid)
        {
            this._updateActiveInHierarchy();
            this._activeInHierarchyInvalid = false;
        }

        return this._activeInHierarchy;
    }

    /**
     * The tag of this game object.
     */
    @serialize
    tag: string;

    /**
     * 自身以及子对象是否支持鼠标拾取
     */
    @serialize
    mouseEnabled = true;

    /**
     * 组件列表
     */
    @serialize
    @oav({ component: 'OAVComponentList' })
    get components()
    {
        return this._components.concat();
    }

    set components(value)
    {
        if (!value) return;
        for (let i = 0, n = value.length; i < n; i++)
        {
            const component = value[i];
            if (!component) continue;
            if (component.single) this.removeComponentsByType(<any>component.constructor);
            this.addComponentAt(value[i], this.numComponents);
        }
    }
    protected _components: Components[] = [];

    /**
     * 子组件个数
     */
    get numComponents()
    {
        return this._components.length;
    }

    /**
     * 预设资源编号
     */
    @serialize
    prefabId: string;

    /**
     * 资源编号
     */
    @serialize
    assetId: string;

    // ------------------------------------------
    // Variables
    // ------------------------------------------

    /**
     * The Transform attached to this Object3D.
     */
    readonly transform = new Transform();

    /**
     * 轴对称包围盒
     */
    get boundingBox()
    {
        if (!this._boundingBox)
        {
            this._boundingBox = new BoundingBox(this);
        }

        return this._boundingBox;
    }
    private _boundingBox: BoundingBox;

    get scene()
    {
        return this._scene;
    }

    protected _parent: Object3D;
    protected _children: Object3D[] = [];

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

    // ------------------------------------------
    // Functions
    // ------------------------------------------
    /**
     * 构建3D对象
     */
    constructor()
    {
        super();
        this.name = 'Object3D';
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
        this.activeSelf = value;
    }

    /**
     * Adds a component class of type componentType to the game object.
     *
     * @param Type A component class of type.
     * @returns The component that is added.
     */
    /**
     * 添加一个类型为`type`的组件到游戏对象。
     *
     * @param Type 组件类定义。
     * @returns 被添加的组件。
     */
    addComponent<T extends Component>(Type: Constructor<T>): T
    {
        let component = this.getComponent(Type);
        if (component && Component.isSingleComponent(Type))
        {
            // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
            return component;
        }
        const dependencies = Component.getDependencies(Type);
        // 先添加依赖
        dependencies.forEach((dependency) =>
        {
            this.addComponent(dependency);
        });
        //
        component = new Type();
        this.addComponentAt(component, this._components.length);

        return component;
    }

    /**
     * Returns the component of Type type if the game object has one attached, null if it doesn't.
     *
     * Using object3D.GetComponent will return the first component that is found. If you expect there to be more than one component of the
     * same type, use object3D.GetComponents instead, and cycle through the returned components testing for some unique property.
     *
     * @param type The type of Component to retrieve.
     * @returns The component to retrieve.
     */
    /**
     * 返回游戏对象附加的一个指定类型的组件，如果没有，则返回 null。
     *
     * 使用 object3D.GetComponent 将返回找到的第一个组件。如果您希望有多个相同类型的组件，请改用 object3D.GetComponents，并循环通过返回的组件测试某些唯一属性。
     *
     * @param type 要检索的组件类型。
     * @returns 要检索的组件。
     */
    getComponent<T extends Component>(type: Constructor<T>): T
    {
        for (let i = 0; i < this._components.length; i++)
        {
            if (this._components[i] instanceof type)
            {
                return this._components[i] as T;
            }
        }

        return null;
    }

    /**
     * Returns the component of Type type in the Object3D or any of its children using depth first search.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should Components on inactive Object3Ds be included in the found set?
     * @returns A component of the matching type, if found.
     */
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
            if (!includeInactive && !object3D.activeSelf) continue;
            const compnent = object3D.getComponentInChildren(type, includeInactive);
            if (compnent)
            {
                return compnent;
            }
        }

        return null;
    }

    /**
     * Retrieves the component of Type type in the Object3D or any of its parents.
     *
     * This method recurses upwards until it finds a Object3D with a matching component. Only components on active Object3Ds are matched.
     *
     * @param type Type of component to find.
     * @param includeInactive Should Components on inactive Object3Ds be included in the found set?
     * @returns Returns a component if a component matching the type is found. Returns null otherwise.
     */
    /**
     * 检索Object3D或其任何父项type中的 Type 组件。
     *
     * 此方法向上递归，直到找到具有匹配组件的 Object3D。仅匹配活动游戏对象上的组件。
     *
     * @param type 要查找的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
     */
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        if (includeInactive || this.activeSelf)
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
     * Returns all components of Type `type` in the Object3D.
     *
     * @param type The type of component to retrieve.
     * @param results List to receive the results.
     * @returns all components of Type type in the Object3D.
     */
    /**
     * 返回Object3D中指定类型的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param results 列出接收找到的组件。
     * @returns Object3D中指定类型的所有组件。
     */
    getComponents<T extends Component = Component>(type?: Constructor<T>, results: T[] = []): T[]
    {
        for (let i = 0; i < this._components.length; i++)
        {
            const component = this._components[i];
            if (!type || component instanceof type)
            {
                results.push(component as any);
            }
        }

        return results;
    }

    /**
     * Returns all components of Type type in the Object3D or any of its children children using depth first search. Works recursively.
     *
     * Unity searches for components recursively on child Object3Ds. This means that it also includes all the child Object3Ds of the target Object3D, and all subsequent child Object3Ds.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should Components on inactive Object3Ds be included in the found set?
     * @param results List to receive found Components.
     * @returns All found Components.
     */
    /**
     * 使用深度优先搜索返回 Object3D 或其任何子子项中 Type 的所有组件。递归工作。
     *
     * Unity 在子游戏对象上递归搜索组件。这意味着它还包括目标 Object3D 的所有子 Object3D，以及所有后续子 Object3D。
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
            const object3D = this.children[i];
            if (!includeInactive && !object3D.activeSelf) continue;
            object3D.getComponentsInChildren(type, includeInactive, results);
        }

        return results;
    }

    /**
     * Returns all components of Type type in the Object3D or any of its parents.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should inactive Components be included in the found set?
     * @param results List holding the found Components.
     * @returns All components of Type type in the Object3D or any of its parents.
     */
    /**
     * 返回Object3D或其任何父级中指定的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动组件是否应该包含在搜索结果中？
     * @param results 列出找到的组件。
     * @returns Object3D或其任何父级中指定的所有组件。
     */
    getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        if (includeInactive || this.activeSelf)
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
     * 获取指定位置索引的子组件
     * @param index			位置索引
     * @return				子组件
     */
    getComponentAt(index: number): Component
    {
        console.assert(index < this.numComponents, '给出索引超出范围');

        return this._components[index];
    }

    /**
     * 设置子组件的位置
     * @param component				子组件
     * @param index				位置索引
     */
    setComponentIndex(component: Components, index: number): void
    {
        console.assert(index >= 0 && index < this.numComponents, '给出索引超出范围');

        const oldIndex = this._components.indexOf(component);
        console.assert(oldIndex >= 0 && oldIndex < this.numComponents, '子组件不在容器内');

        this._components.splice(oldIndex, 1);
        this._components.splice(index, 0, component);
    }

    /**
     * 设置组件到指定位置
     * @param component		被设置的组件
     * @param index			索引
     */
    setComponentAt(component: Components, index: number)
    {
        if (this._components[index])
        {
            this.removeComponentAt(index);
        }
        this.addComponentAt(component, index);
    }

    /**
     * 移除组件
     * @param component 被移除组件
     */
    removeComponent(component: Components): void
    {
        console.assert(this.hasComponent(component), '只能移除在容器中的组件');

        const index = this.getComponentIndex(component);
        this.removeComponentAt(index);
    }

    /**
     * 获取组件在容器的索引位置
     * @param component			查询的组件
     * @return				    组件在容器的索引位置
     */
    getComponentIndex(component: Components): number
    {
        console.assert(this._components.indexOf(component) !== -1, '组件不在容器中');

        const index = this._components.indexOf(component);

        return index;
    }

    /**
     * 移除组件
     * @param index		要删除的 Component 的子索引。
     */
    removeComponentAt(index: number): Component
    {
        console.assert(index >= 0 && index < this.numComponents, '给出索引超出范围');

        const component: Component = this._components.splice(index, 1)[0];
        // 派发移除组件事件
        this.emit('removeComponent', { component, object3D: this as any }, true);
        component.dispose();

        return component;
    }

    /**
     * 交换子组件位置
     * @param index1		第一个子组件的索引位置
     * @param index2		第二个子组件的索引位置
     */
    swapComponentsAt(index1: number, index2: number): void
    {
        console.assert(index1 >= 0 && index1 < this.numComponents, '第一个子组件的索引位置超出范围');
        console.assert(index2 >= 0 && index2 < this.numComponents, '第二个子组件的索引位置超出范围');

        const temp: Components = this._components[index1];
        this._components[index1] = this._components[index2];
        this._components[index2] = temp;
    }

    /**
     * 交换子组件位置
     * @param a		第一个子组件
     * @param b		第二个子组件
     */
    swapComponents(a: Components, b: Components): void
    {
        console.assert(this.hasComponent(a), '第一个子组件不在容器中');
        console.assert(this.hasComponent(b), '第二个子组件不在容器中');

        this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
    }

    /**
     * 移除指定类型组件
     * @param type 组件类型
     */
    removeComponentsByType<T extends Components>(type: Constructor<T>)
    {
        const removeComponents: T[] = [];
        for (let i = this._components.length - 1; i >= 0; i--)
        {
            if (this._components[i].constructor === type)
            { removeComponents.push(this.removeComponentAt(i) as T); }
        }

        return removeComponents;
    }

    /**
     * 判断是否拥有组件
     * @param com	被检测的组件
     * @return		true：拥有该组件；false：不拥有该组件。
     */
    private hasComponent(com: Components): boolean
    {
        return this._components.indexOf(com) !== -1;
    }

    /**
     * 添加组件到指定位置
     * @param component		被添加的组件
     * @param index			插入的位置
     */
    protected addComponentAt(component: Components, index: number): void
    {
        if (!component)
        { return; }
        console.assert(index >= 0 && index <= this.numComponents, '给出索引超出范围');

        if (this.hasComponent(component))
        {
            index = Math.min(index, this._components.length - 1);
            this.setComponentIndex(component, index);

            return;
        }
        // 组件唯一时移除同类型的组件
        if (component.single)
        { this.removeComponentsByType(<Constructor<Components>>component.constructor); }

        this._components.splice(index, 0, component);
        component.setObject3D(this as any);
        component.init();
        // 派发添加组件事件
        this.emit('addComponent', { component, object3D: this as any }, true);
    }

    /**
     * 根据名称查找对象
     *
     * @param name 对象名称
     */
    find(name: string): Object3D
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
     * 添加脚本
     * @param script   脚本路径
     */
    addScript(scriptName: string)
    {
        const scriptComponent = new ScriptComponent();
        scriptComponent.scriptName = scriptName;
        this.addComponentAt(scriptComponent, this._components.length);

        return scriptComponent;
    }

    /**
     * 是否包含指定对象
     *
     * @param child 可能的子孙对象
     */
    contains(child: Object3D)
    {
        let checkitem = child;
        do
        {
            if (checkitem === this)
            { return true; }
            checkitem = checkitem.parent;
        } while (checkitem);

        return false;
    }

    /**
     * 添加子对象
     *
     * @param child 子对象
     */
    addChild(child: Object3D)
    {
        if (!child)
        { return; }
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
     * @param childarray 子对象
     */
    addChildren(...childarray: Object3D[])
    {
        for (const childKey in childarray)
        {
            const child: Object3D = childarray[childKey];
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
    removeChild(child: Object3D)
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

        return this.removeChildInternal(index, child);
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

    /**
     * 获取子对象列表（备份）
     */
    getChildren()
    {
        return this._children.concat();
    }

    private removeChildInternal(childIndex: number, child: Object3D)
    {
        this._children.splice(childIndex, 1);
        child._setParent(null);

        child.emit('removed', { parent: this as any });
        this.emit('removeChild', { child, parent: this as any }, true);
    }

    /**
     * 销毁
     */
    dispose()
    {
        if (this.parent)
        { this.parent.removeChild(this); }
        for (let i = this._children.length - 1; i >= 0; i--)
        {
            this.removeChildAt(i);
        }
        for (let i = this._components.length - 1; i >= 0; i--)
        {
            this.removeComponentAt(i);
        }
        super.dispose();
    }

    disposeWithChildren()
    {
        this.dispose();
        while (this.numChildren > 0)
        { this.getChildAt(0).dispose(); }
    }

    /**
     * 是否加载完成
     */
    get isSelfLoaded()
    {
        const model = this.getComponent(Renderable);
        if (model) return model.isLoaded;

        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onSelfLoadCompleted(callback: () => void)
    {
        if (this.isSelfLoaded)
        {
            callback();

            return;
        }
        const model = this.getComponent(Renderable);
        if (model)
        {
            model.onLoadCompleted(callback);
        }
        else callback();
    }

    /**
     * 是否加载完成
     */
    get isLoaded()
    {
        if (!this.isSelfLoaded) return false;
        for (let i = 0; i < this.children.length; i++)
        {
            const element = this.children[i];
            if (!element.isLoaded) return false;
        }

        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        let loadingNum = 0;
        if (!this.isSelfLoaded)
        {
            loadingNum++;
            this.onSelfLoadCompleted(() =>
            {
                loadingNum--;
                if (loadingNum === 0) callback();
            });
        }
        for (let i = 0; i < this.children.length; i++)
        {
            const element = this.children[i];
            if (!element.isLoaded)
            {
                loadingNum++;
                 
                element.onLoadCompleted(() =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }

    /**
     * 查找指定名称的游戏对象
     *
     * @param name
     */
    static find(name: string)
    {
        const object3Ds = Feng3dObject.getObjects(Object3D);
        const result = object3Ds.filter((v) => !v.disposed && (v.name === name));

        return result[0];
    }

    protected _scene: Scene;
    protected _activeInHierarchy = false;
    protected _activeInHierarchyInvalid = true;

    protected _updateActiveInHierarchy()
    {
        let activeSelf = this.activeSelf;
        if (this.parent)
        {
            activeSelf = activeSelf && this.parent.activeInHierarchy;
        }
        this._activeInHierarchy = activeSelf;
    }

    protected _invalidateActiveInHierarchy()
    {
        if (this._activeInHierarchyInvalid) return;

        this._activeInHierarchyInvalid = true;

        this._children.forEach((c) =>
        {
            c._invalidateActiveInHierarchy();
        });
    }

    protected _setParent(value: Object3D | null)
    {
        this._parent = value;
        this.updateScene();
        reactive(this.transform).parent = value ? value.transform : null;
    }

    private updateScene()
    {
        const newScene = this._parent ? this._parent._scene : null;
        if (this._scene === newScene)
        { return; }
        if (this._scene)
        {
            this.emit('removedFromScene', this);
        }
        this._scene = newScene;
        if (this._scene)
        {
            this.emit('addedToScene', this);
        }
        this.updateChildrenScene();
    }

    private updateChildrenScene()
    {
        for (let i = 0, n = this._children.length; i < n; i++)
        {
            this._children[i].updateScene();
        }
    }

    /**
     * 把事件分享到每个组件上。
     */
    getShareTargets()
    {
        return this.components;
    }

    /**
     * 创建指定类型的游戏对象。
     *
     * @param type 游戏对象类型。
     * @param param 游戏对象参数。
     */
    static createPrimitive<K extends keyof PrimitiveObject3D>(type: K, param?: gPartial<Object3D>)
    {
        const g = new Object3D();
        g.name = type;

        const createHandler = this._registerPrimitives[type];
        if (createHandler) createHandler(g);

        serialization.setValue(g, param);

        return g;
    }

    /**
     * 注册原始游戏对象，被注册后可以使用 Object3D.createPrimitive 进行创建。
     *
     * @param type 原始游戏对象类型。
     * @param handler 构建原始游戏对象的函数。
     */
    static registerPrimitive<K extends keyof PrimitiveObject3D>(type: K, handler: (object3D: Object3D) => void)
    {
        if (this._registerPrimitives[type])
        { console.warn(`重复注册原始游戏对象 ${type} ！`); }
        this._registerPrimitives[type] = handler;
    }
    static _registerPrimitives: { [type: string]: (object3D: Object3D) => void } = {};
}

/**
 * 原始游戏对象，可以通过Object3D.createPrimitive进行创建。
 */
export interface PrimitiveObject3D extends MixinsPrimitiveObject3D
{
}

// 在 Hierarchy 界面右键创建游戏
createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            new Object3D()
    },
);
