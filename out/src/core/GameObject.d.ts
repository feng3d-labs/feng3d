declare namespace feng3d {
    type ComponentConstructor<T> = (new (gameObject: GameObject) => T);
    interface ComponentMap {
        camera: new () => Camera;
    }
    interface Mouse3DEventMap {
        mouseout: any;
        mouseover: any;
        mousedown: any;
        mouseup: any;
        mousemove: any;
        click: any;
        dblclick: any;
    }
    interface GameObjectEventMap extends Mouse3DEventMap, RenderDataHolderEventMap {
        /**
         * 添加子组件事件
         */
        addedComponent: Component;
        /**
         * 移除子组件事件
         */
        removedComponent: Component;
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        added: any;
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removed: any;
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        addedToScene: GameObject;
        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        removedFromScene: GameObject;
        /**
         * 场景变化
         */
        sceneChanged: GameObject;
    }
    interface GameObject {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: EventVO<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: EventVO<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: EventVO<GameObjectEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * Base class for all entities in feng3d scenes.
     */
    class GameObject extends Feng3dObject {
        protected _children: GameObject[];
        protected _scene: Scene3D;
        protected _parent: GameObject;
        /**
         * 是否可序列化
         */
        serializable: boolean;
        /**
         * The name of the Feng3dObject.
         * Components share the same name with the game object and all attached components.
         */
        name: string;
        /**
         * 是否显示
         */
        visible: boolean;
        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        mouseEnabled: boolean;
        /**
         * The Transform attached to this GameObject. (null if there is none attached).
         */
        readonly transform: Transform;
        private _transform;
        /**
         * @private
         */
        readonly _renderData: Object3DRenderAtomic;
        readonly parent: GameObject;
        /**
         * 子对象
         */
        children: GameObject[];
        readonly numChildren: number;
        /**
         * 子组件个数
         */
        readonly numComponents: number;
        updateRender(renderContext: RenderContext): void;
        /**
         * 构建3D对象
         */
        private constructor(name?);
        contains(child: GameObject): boolean;
        addChild(child: GameObject): GameObject;
        addChildren(...childarray: any[]): void;
        setChildAt(child: GameObject, index: number): void;
        removeChild(child: GameObject): void;
        removeChildAt(index: number): void;
        private _setParent(value);
        getChildAt(index: number): GameObject;
        readonly scene: Scene3D;
        private updateScene();
        /**
         * 获取子对象列表（备份）
         */
        getChildren(): GameObject[];
        private removeChildInternal(childIndex, child);
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component;
        /**
         * 添加组件
         * Adds a component class named className to the game object.
         * @param param 被添加组件
         */
        addComponent<T extends Component>(param: ComponentConstructor<T>): T;
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent(com);
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: ComponentConstructor<T>): T;
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: ComponentConstructor<T>): T[];
        /**
         * Returns the component of Type type in the GameObject or any of its children using depth first search.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>, result?: T[]): T[];
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Component, index: number): void;
        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        setComponentAt(component: Component, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: Component): void;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Component): number;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component;
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void;
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: Component, b: Component): void;
        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        removeComponentsByType<T extends Component>(type: ComponentConstructor<T>): T[];
        private static _gameObjects;
        /**
         * Finds a game object by name and returns it.
         * @param name
         */
        static find(name: string): GameObject;
        static create(name?: string): GameObject;
        /**
         * 组件列表
         */
        protected _components: Component[];
        components: Component[];
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        private addComponentAt(component, index);
        /**
         * 销毁
         */
        dispose(): void;
        disposeWithChildren(): void;
        deserialize(object: any): void;
    }
}
