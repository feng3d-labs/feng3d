import { Event } from "@feng3d/eventsystem";
import { IDisposable } from "@feng3d/polyfill";
import { serialize, serialization } from "@feng3d/serialization";
import { oav } from "@feng3d/objectview";
import { Box3 } from "@feng3d/math";

import { MouseEventMap } from "./Mouse3DManager";
import { Component, ComponentNames, ComponentMap, componentMap, Components } from "../component/Component";
import { Geometry } from "../geometry/Geometry";
import { Feng3dObject } from "./Feng3dObject";
import { AssetType } from "../assets/AssetType";
import { Transform } from "./Transform";
import { BoundingBox } from "./BoundingBox";
import { ScriptComponent } from "./ScriptComponent";
import { Scene } from "../scene/Scene";

export type Constructor<T> = (new (...args) => T);

export interface GameObjectEventMap extends GlobalMixins.GameObjectEventMap { }

export interface GameObjectEventMap extends MouseEventMap
{
    /**
     * 添加子组件事件
     */
    addComponent: { gameobject: GameObject, component: Component };
    /**
     * 移除子组件事件
     */
    removeComponent: { gameobject: GameObject, component: Component };
    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    addChild: { parent: GameObject, child: GameObject }
    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    removeChild: { parent: GameObject, child: GameObject };

    /**
     * 自身被添加到父对象中事件
     */
    added: { parent: GameObject };

    /**
     * 自身从父对象中移除事件
     */
    removed: { parent: GameObject };

    /**
     * 当GameObject的scene属性被设置是由Scene派发
     */
    addedToScene: GameObject;

    /**
     * 当GameObject的scene属性被清空时由Scene派发
     */
    removedFromScene: GameObject;

    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;

    /**
     * 刷新界面
     */
    refreshView: any;
}

export interface GameObject
{
    once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
    dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
    has<K extends keyof GameObjectEventMap>(type: K): boolean;
    on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
    off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any): void;
}

/**
 * 游戏对象，场景唯一存在的对象类型
 */
export class GameObject extends Feng3dObject implements IDisposable
{

    __class__: "feng3d.GameObject";

    assetType = AssetType.gameobject;

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

    /**
     * 名称
     */
    @serialize
    @oav({ component: "OAVGameObjectName" })
    name: string;

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
     * 自身以及子对象是否支持鼠标拾取
     */
    @serialize
    mouseEnabled = true;

    //------------------------------------------
    // Variables
    //------------------------------------------

    /**
     * 变换
     */
    get transform()
    {
        if (!this._transform)
            this._transform = this.getComponent("Transform");
        return this._transform;
    }
    private _transform: Transform;

    /**
     * 轴对称包围盒
     */
    get boundingBox()
    {
        if (!this._boundingBox)
        {
            this._boundingBox = this.getComponent("BoundingBox");
        }
        return this._boundingBox;
    }
    private _boundingBox: BoundingBox;

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
     * 子组件个数
     */
    get numComponents()
    {
        return this._components.length;
    }

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

    get scene()
    {
        return this._scene;
    }

    @serialize
    @oav({ component: "OAVComponentList" })
    get components()
    {
        return this._components.concat();
    }
    set components(value)
    {
        if (!value) return;
        this._transform = <any>null;
        for (var i = 0, n = value.length; i < n; i++)
        {
            var compnent = value[i];
            if (!compnent) continue;
            if (compnent.single) this.removeComponentsByType(<any>compnent.constructor);
            this.addComponentAt(value[i], this.numComponents);
        }
    }

    //------------------------------------------
    // Functions
    //------------------------------------------
    /**
     * 构建3D对象
     */
    constructor()
    {
        super();
        this.name = "GameObject";
        this.addComponent("Transform");

        this.onAny(this._onAnyListener, this);
    }

    /**
     * 根据名称查找对象
     * 
     * @param name 对象名称
     */
    find(name: string): GameObject
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
    contains(child: GameObject)
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
    addChild(child: GameObject)
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
    removeChild(child: GameObject)
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

    /**
     * 获取指定位置索引的子组件
     * @param index			位置索引
     * @return				子组件
     */
    getComponentAt(index: number): Component
    {
        console.assert(index < this.numComponents, "给出索引超出范围");
        return this._components[index];
    }

    /**
     * 添加指定组件类型到游戏对象
     * 
     * @type type 被添加组件
     */
    addComponent<T extends ComponentNames>(type: T, callback: (component: ComponentMap[T]) => void = null): ComponentMap[T]
    {
        var component = this.getComponent(type);
        if (component && component.single)
        {
            // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
            return component;
        }
        var cls: any = componentMap[type];
        component = new cls();
        this.addComponentAt(component, this._components.length);
        callback && callback(component);
        return component;
    }

    /**
     * 添加脚本
     * @param script   脚本路径
     */
    addScript(scriptName: string)
    {
        var scriptComponent = new ScriptComponent();
        scriptComponent.scriptName = scriptName;
        this.addComponentAt(scriptComponent, this._components.length);
        return scriptComponent;
    }

    /**
     * 获取游戏对象上第一个指定类型的组件，不存在时返回null
     * 
     * @param type				类定义
     * @return                  返回指定类型组件
     */
    getComponent<T extends ComponentNames>(type: T): ComponentMap[T]
    {
        var component = this.getComponents(type)[0];
        return component;
    }

    /**
     * 获取游戏对象上所有指定类型的组件数组
     * 
     * @param type		类定义
     * @return			返回与给出类定义一致的组件
     */
    getComponents<T extends ComponentNames>(type: T): ComponentMap[T][]
    {
        console.assert(!!type, `类型不能为空！`);

        var cls: any = componentMap[type];
        if (!cls)
        {
            console.warn(`无法找到 ${type} 组件类定义，请使用 @feng3d.RegisterComponent() 在组件类上标记。`);
            return [];
        }
        var filterResult: any = this._components.filter(v => v instanceof cls);
        return filterResult;
    }

    /**
     * 从自身与子代（孩子，孩子的孩子，...）游戏对象中获取所有指定类型的组件
     * 
     * @param type		类定义
     * @return			返回与给出类定义一致的组件
     */
    getComponentsInChildren<T extends ComponentNames>(type?: T, filter?: (compnent: ComponentMap[T]) => { findchildren: boolean, value: boolean }, result?: ComponentMap[T][]): ComponentMap[T][]
    {
        result = result || [];
        var findchildren = true;
        var cls: any = componentMap[type];
        for (var i = 0, n = this._components.length; i < n; i++)
        {
            var item = <ComponentMap[T]>this._components[i];
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
            for (var i = 0, n = this.numChildren; i < n; i++)
            {
                this.getChildAt(i).getComponentsInChildren(type, filter, result);
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
    getComponentsInParents<T extends ComponentNames>(type?: T, result?: ComponentMap[T][]): ComponentMap[T][]
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

    /**
     * 设置子组件的位置
     * @param component				子组件
     * @param index				位置索引
     */
    setComponentIndex(component: Components, index: number): void
    {
        console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

        var oldIndex = this._components.indexOf(component);
        console.assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");

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
        console.assert(this.hasComponent(component), "只能移除在容器中的组件");

        var index = this.getComponentIndex(component);
        this.removeComponentAt(index);
    }

    /**
     * 获取组件在容器的索引位置
     * @param component			查询的组件
     * @return				    组件在容器的索引位置
     */
    getComponentIndex(component: Components): number
    {
        console.assert(this._components.indexOf(component) != -1, "组件不在容器中");

        var index = this._components.indexOf(component);
        return index;
    }

    /**
     * 移除组件
     * @param index		要删除的 Component 的子索引。
     */
    removeComponentAt(index: number): Component
    {
        console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

        var component: Component = this._components.splice(index, 1)[0];
        //派发移除组件事件
        this.dispatch("removeComponent", { component: component, gameobject: this }, true);
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
        console.assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
        console.assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");

        var temp: Components = this._components[index1];
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
        console.assert(this.hasComponent(a), "第一个子组件不在容器中");
        console.assert(this.hasComponent(b), "第二个子组件不在容器中");

        this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
    }

    /**
     * 移除指定类型组件
     * @param type 组件类型
     */
    removeComponentsByType<T extends Components>(type: Constructor<T>)
    {
        var removeComponents: T[] = [];
        for (var i = this._components.length - 1; i >= 0; i--)
        {
            if (this._components[i].constructor == type)
                removeComponents.push(<T>this.removeComponentAt(i));
        }
        return removeComponents;
    }

    /**
     * 世界包围盒
     */
    get worldBounds()
    {
        var model = this.getComponent("Renderable");
        var box = model ? model.selfWorldBounds : new Box3(this.transform.worldPosition, this.transform.worldPosition);
        this.children.forEach(element =>
        {
            var ebox = element.worldBounds;
            box.union(ebox);
        });
        return box;
    }

    /**
     * 监听对象的所有事件并且传播到所有组件中
     */
    private _onAnyListener(e: Event<any>)
    {
        this.components.forEach(element =>
        {
            element.dispatchEvent(e);
        });
    }

    /**
     * 销毁
     */
    dispose()
    {
        if (this.parent)
            this.parent.removeChild(this);
        for (var i = this._children.length - 1; i >= 0; i--)
        {
            this.removeChildAt(i);
        }
        for (var i = this._components.length - 1; i >= 0; i--)
        {
            this.removeComponentAt(i);
        }
        super.dispose();
    }

    disposeWithChildren()
    {
        this.dispose();
        while (this.numChildren > 0)
            this.getChildAt(0).dispose();
    }

    /**
     * 是否加载完成
     */
    get isSelfLoaded()
    {
        var model = this.getComponent("Renderable");
        if (model) return model.isLoaded
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
        var model = this.getComponent("Renderable");
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
        var loadingNum = 0;
        if (!this.isSelfLoaded) 
        {
            loadingNum++;
            this.onSelfLoadCompleted(() =>
            {
                loadingNum--;
                if (loadingNum == 0) callback();
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
                    if (loadingNum == 0) callback();
                });
            }
        }
        if (loadingNum == 0) callback();
    }

    //------------------------------------------
    // Static Functions
    //------------------------------------------
    /**
     * 查找指定名称的游戏对象
     * 
     * @param name 
     */
    static find(name: string)
    {
        var gameobjects = Feng3dObject.getObjects(GameObject)
        var result = gameobjects.filter(v => !v.disposed && (v.name == name));
        return result[0];
    }

    //------------------------------------------
    // Protected Properties
    //------------------------------------------
    /**
     * 组件列表
     */
    protected _components: Components[] = [];
    protected _children: GameObject[] = [];
    protected _scene: Scene;
    protected _parent: GameObject;
    protected _globalVisible = false;
    protected _globalVisibleInvalid = true;

    //------------------------------------------
    // Protected Functions
    //------------------------------------------

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
    //------------------------------------------
    // Private Properties
    //------------------------------------------

    //------------------------------------------
    // Private Methods
    //------------------------------------------

    private _setParent(value: GameObject | null)
    {
        this._parent = value;
        this.updateScene();
        this.transform["_invalidateSceneTransform"]();
    }

    private updateScene()
    {
        var newScene = this._parent ? this._parent._scene : null;
        if (this._scene == newScene)
            return;
        if (this._scene)
        {
            this.dispatch("removedFromScene", this);
        }
        this._scene = newScene;
        if (this._scene)
        {
            this.dispatch("addedToScene", this);
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

    private removeChildInternal(childIndex: number, child: GameObject)
    {
        childIndex = childIndex;
        this._children.splice(childIndex, 1);
        child._setParent(null);

        child.dispatch("removed", { parent: this });
        this.dispatch("removeChild", { child: child, parent: this }, true);
    }

    /**
     * 判断是否拥有组件
     * @param com	被检测的组件
     * @return		true：拥有该组件；false：不拥有该组件。
     */
    private hasComponent(com: Components): boolean
    {
        return this._components.indexOf(com) != -1;
    }

    /**
     * 添加组件到指定位置
     * @param component		被添加的组件
     * @param index			插入的位置
     */
    private addComponentAt(component: Components, index: number): void
    {
        if (component == null)
            return;
        console.assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");

        if (this.hasComponent(component))
        {
            index = Math.min(index, this._components.length - 1);
            this.setComponentIndex(component, index)
            return;
        }
        //组件唯一时移除同类型的组件
        if (component.single)
            this.removeComponentsByType(<Constructor<Components>>component.constructor);

        this._components.splice(index, 0, component);
        component.setGameObject(this);
        component.init();
        //派发添加组件事件
        this.dispatch("addComponent", { component: component, gameobject: this }, true);
    }

    /**
     * 创建指定类型的游戏对象。
     * 
     * @param type 游戏对象类型。
     * @param param 游戏对象参数。
     */
    static createPrimitive<K extends keyof PrimitiveGameObject>(type: K, param?: gPartial<GameObject>)
    {
        var g = new GameObject();
        g.name = type;

        var createHandler = this._registerPrimitives[type];
        if (createHandler != null) createHandler(g);

        serialization.setValue(g, param);
        return g;
    }

    /**
     * 注册原始游戏对象，被注册后可以使用 GameObject.createPrimitive 进行创建。
     * 
     * @param type 原始游戏对象类型。
     * @param handler 构建原始游戏对象的函数。
     */
    static registerPrimitive<K extends keyof PrimitiveGameObject>(type: K, handler: (gameObject: GameObject) => void)
    {
        if (this._registerPrimitives[type])
            console.warn(`重复注册原始游戏对象 ${type} ！`);
        this._registerPrimitives[type] = handler;
    }
    static _registerPrimitives: { [type: string]: (gameObject: GameObject) => void } = {};
}

/**
 * 原始游戏对象，可以通过GameObject.createPrimitive进行创建。
 */
export interface PrimitiveGameObject
{
}
