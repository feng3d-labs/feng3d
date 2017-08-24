declare namespace feng3d {
    /**
     * 组件事件
     */
    interface ComponentEventMap extends RenderDataHolderEventMap {
    }
    interface Component {
        once<K extends keyof ComponentEventMap>(type: K, listener: (event: ComponentEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof ComponentEventMap>(type: K, data?: ComponentEventMap[K], bubbles?: boolean): any;
        has<K extends keyof ComponentEventMap>(type: K): boolean;
        on<K extends keyof ComponentEventMap>(type: K, listener: (event: ComponentEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof ComponentEventMap>(type?: K, listener?: (event: ComponentEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * Base class for everything attached to GameObjects.
     *
     * Note that your code will never directly create a Component. Instead, you write script code, and attach the script to a GameObject. See Also: ScriptableObject as a way to create scripts that do not attach to any GameObject.
     */
    class Component extends Feng3dObject {
        /**
         * The game object this component is attached to. A component is always attached to a game object.
         */
        readonly gameObject: GameObject;
        /**
         * The tag of this game object.
         */
        tag: string;
        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        readonly transform: Transform;
        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        readonly single: boolean;
        /**
         * 创建一个组件容器
         */
        constructor(gameObject: GameObject);
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
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
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>): T[];
        private _gameObject;
        private _tag;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
