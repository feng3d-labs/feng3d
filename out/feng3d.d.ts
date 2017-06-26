declare namespace feng3d {
    /**
     * 数据序列化
     * @author feng 2017-03-11
     */
    class Serialization {
        /**
         * 由纯数据对象（无循环引用）转换为复杂类型（例如feng3d对象）
         */
        readObject(data: {
            __className__?: string;
        }): any;
        private handle(object, key, data);
        /**
         * 由复杂类型（例如feng3d对象）转换为纯数据对象（无循环引用）
         */
        writeObject(object: Object): any;
        private getAttributes(object);
        /**
         * 获取新对象来判断存储的属性
         */
        private getNewObject(className);
    }
    var serializationConfig: {
        excludeObject: any[];
        excludeClass: any[];
        classConfig: {
            [className: string]: {
                toJson?: Function;
            };
        };
    };
}
declare namespace feng3d {
    class RenderData extends EventDispatcher {
        private _elementMap;
        readonly elements: RenderElement[];
        private _elements;
        createIndexBuffer(indices: Uint16Array): IndexRenderData;
        createUniformData<K extends keyof UniformRenderData>(name: K, data: UniformRenderData[K]): UniformData;
        createAttributeRenderData<K extends keyof AttributeRenderDataStuct>(name: K, data?: Float32Array, size?: number, divisor?: number): AttributeRenderData;
        createShaderCode(code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        })): ShaderCode;
        createValueMacro<K extends keyof ValueMacros>(name: K, value: number | (() => number)): ValueMacro;
        createBoolMacro<K extends keyof BoolMacros>(name: K, value: boolean | (() => boolean)): BoolMacro;
        createAddMacro<K extends keyof IAddMacros>(name: K, value: number): AddMacro;
        createInstanceCount(value: number | (() => number)): RenderInstanceCount;
        createShaderParam<K extends keyof ShaderParams>(name: K, value: ShaderParams[K]): ShaderParam;
        addRenderElement(element: RenderElement | RenderElement[]): void;
        removeRenderElement(element: RenderElement | RenderElement[]): void;
    }
}
declare namespace feng3d {
    interface UniformRenderData {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Matrix3D | (() => Matrix3D);
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix3D | (() => Matrix3D);
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix3D | (() => Matrix3D);
        u_diffuseInput: Vector3D | (() => Vector3D);
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number | (() => number);
        /**
         * 漫反射贴图
         */
        s_texture: Texture2D | (() => Texture2D);
        /**
         * 漫反射贴图
         */
        s_diffuse: Texture2D | (() => Texture2D);
        /**
         * 环境贴图
         */
        s_ambient: Texture2D | (() => Texture2D);
        /**
         * 法线贴图
         */
        s_normal: Texture2D | (() => Texture2D);
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture2D | (() => Texture2D);
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: TextureCube | (() => TextureCube);
        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: number | (() => number);
        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图1
         */
        s_splatTexture1: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Texture2D | (() => Texture2D);
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture2D | (() => Texture2D);
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector3D | (() => Vector3D);
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Point | (() => Point);
        /**
         * 图片尺寸
         */
        u_imageSize: Point | (() => Point);
        /**
         * 地形块尺寸
         */
        u_tileSize: Point | (() => Point);
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector3D[] | (() => Vector3D[]);
        /**
         * 最大lod
         */
        u_maxLod: number | (() => number);
        /**
         * uv与坐标比
         */
        u_uvPositionScale: number | (() => number);
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Vector3D | (() => Vector3D);
        /******************************************************/
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Vector3D[] | (() => Vector3D[]);
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Vector3D[] | (() => Vector3D[]);
        /**
         * 点光源光照强度数组
         */
        u_pointLightIntensitys: number[] | (() => number[]);
        /**
         * 点光源光照范围数组
         */
        u_pointLightRanges: number[] | (() => number[]);
        /******************************************************/
        /******************************************************/
        /**
         * 方向光源方向数组
         */
        u_directionalLightDirections: Vector3D[] | (() => Vector3D[]);
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Vector3D[] | (() => Vector3D[]);
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: number[] | (() => number[]);
        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color | (() => Color);
        /**
         * 基本颜色
         */
        u_diffuse: Color | (() => Color);
        /**
         * 镜面反射颜色
         */
        u_specular: Color | (() => Color);
        /**
         * 环境颜色
         */
        u_ambient: Color | (() => Color);
        /**
         * 高光系数
         */
        u_glossiness: number | (() => number);
        /**
         * 反射率
         */
        u_reflectance: number | (() => number);
        /**
         * 粗糙度
         */
        u_roughness: number | (() => number);
        /**
         * 金属度
         */
        u_metalic: number | (() => number);
        /**
         * 粒子时间
         */
        u_particleTime: number | (() => number);
        /**
         * 点大小
         */
        u_PointSize: number | (() => number);
        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices: Matrix3D[] | (() => Matrix3D[]);
        /**
         * 3D对象编号
         */
        u_objectID: number | (() => number);
        /**
         * 雾颜色
         */
        u_fogColor: Color | (() => Color);
        /**
         * 雾最近距离
         */
        u_fogMinDistance: number | (() => number);
        /**
         * 雾最远距离
         */
        u_fogMaxDistance: number | (() => number);
        /**
         * 雾浓度
         */
        u_fogDensity: number | (() => number);
        /**
         * 雾模式
         */
        u_fogMode: number | (() => number);
        /**
         * 环境反射纹理
         */
        s_envMap: TextureCube | (() => TextureCube);
        /**
         * 反射率
         */
        u_reflectivity: number | (() => number);
        /**
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number | (() => number);
    }
}
declare namespace feng3d {
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends RenderData {
        /**
         * 是否每次必须更新
         */
        readonly updateEverytime: boolean;
        protected _updateEverytime: boolean;
        childrenRenderDataHolder: RenderDataHolder[];
        /**
         * 创建GL数据缓冲
         */
        constructor();
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        collectRenderDataHolder(renderAtomic?: Object3DRenderAtomic): void;
        addRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
    }
}
declare namespace feng3d {
    class Object3DRenderAtomic extends RenderAtomic {
        /**
         * 添加渲染元素
         */
        static ADD_RENDERELEMENT: string;
        /**
         * 移除渲染元素
         */
        static REMOVE_RENDERELEMENT: string;
        /**
         * 添加渲染数据拥有者
         */
        static ADD_RENDERHOLDER: string;
        /**
         * 移除渲染数据拥有者
         */
        static REMOVE_RENDERHOLDER: string;
        private _invalidateRenderDataHolderList;
        renderHolderInvalid: boolean;
        private onInvalidate(event);
        private onAddElement(event);
        private onRemoveElement(event);
        private onInvalidateShader(event);
        private onAddRenderHolder(event);
        private onRemoveRenderHolder(event);
        private addInvalidateHolders(renderDataHolder);
        private addInvalidateShader(renderDataHolder);
        private renderDataHolders;
        private updateEverytimeList;
        addRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[]): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[]): void;
        update(renderContext: RenderContext): void;
        clear(): void;
    }
}
declare namespace feng3d {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    class RenderContext extends RenderDataHolder {
        /**
         * 摄像机
         */
        camera: Camera;
        private _camera;
        /**
         * 场景
         */
        scene3d: Scene3D;
        /**
         * 3D视窗
         */
        view3D: View3D;
        /**
         * WebGL实例
         */
        gl: GL;
        /**
         * 更新渲染数据
         */
        updateRenderData1(): void;
    }
}
declare namespace feng3d {
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    class ShaderLib {
        static getShaderContentByName(shaderName: string): string;
        /**
         * 获取shaderCode
         */
        static getShaderCode(shaderName: string): string;
    }
}
declare namespace feng3d {
    /**
     * Bit mask that controls object destruction, saving and visibility in inspectors.
     */
    enum HideFlags {
        /**
         * A normal, visible object. This is the default.
         */
        None = 0,
        /**
         * The object will not appear in the hierarchy.
         */
        HideInHierarchy = 1,
        /**
         * It is not possible to view it in the inspector.
         */
        HideInInspector = 2,
        /**
         * The object will not be saved to the scene in the editor.
         */
        DontSaveInEditor = 4,
        /**
         * The object is not be editable in the inspector.
         */
        NotEditable = 8,
        /**
         * The object will not be saved when building a player.
         */
        DontSaveInBuild = 16,
        /**
         * The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        DontUnloadUnusedAsset = 32,
        /**
         * The object will not be saved to the scene. It will not be destroyed when a new scene is loaded. It is a shortcut for HideFlags.DontSaveInBuild | HideFlags.DontSaveInEditor | HideFlags.DontUnloadUnusedAsset.
         */
        DontSave = 52,
        /**
         * A combination of not shown in the hierarchy, not saved to to scenes and not unloaded by The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideAndDontSave = 61,
    }
}
declare namespace feng3d {
    type Type<T extends Feng3dObject> = new () => T;
    /**
     * Base class for all objects feng3d can reference.
     *
     * Any public variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    class Feng3dObject extends RenderDataHolder {
        /**
         * Should the Feng3dObject be hidden, saved with the scene or modifiable by the user?
         */
        hideFlags: HideFlags;
        /**
         * The name of the Feng3dObject.
         */
        name: string;
        constructor();
        /**
         * Returns the instance id of the Feng3dObject.
         */
        readonly uuid: string;
        /**
         * Returns the name of the game Feng3dObject.
         */
        toString(): string;
        /**
         * Removes a gameobject, component or asset.
         * @param obj	The Feng3dObject to destroy.
         * @param t	    The optional amount of time to delay before destroying the Feng3dObject.
         */
        static destroy(obj: Feng3dObject, t?: number): void;
        /**
         * Destroys the Feng3dObject obj immediately.
         * @param obj	                    Feng3dObject to be destroyed.
         * @param allowDestroyingAssets	    Set to true to allow assets to be destoyed.
         */
        static destroyImmediate(obj: Feng3dObject, allowDestroyingAssets?: boolean): void;
        /**
         * Makes the Feng3dObject target not be destroyed automatically when loading a new scene.
         */
        static dontDestroyOnLoad(target: Feng3dObject): void;
        /**
         * Returns the first active loaded Feng3dObject of Type type.
         */
        static findObjectOfType<T extends Feng3dObject>(type: Type<T>): T;
        /**
         * Returns a list of all active loaded objects of Type type.
         */
        static findObjectsOfType<T extends Feng3dObject>(type: Type<T>): T[];
        /**
         * Returns a copy of the Feng3dObject original.
         * @param original	An existing Feng3dObject that you want to make a copy of.
         * @param position	Position for the new Feng3dObject(default Vector3.zero).
         * @param rotation	Orientation of the new Feng3dObject(default Quaternion.identity).
         * @param parent	The transform the Feng3dObject will be parented to.
         * @param worldPositionStays	If when assigning the parent the original world position should be maintained.
         */
        static instantiate<T extends Feng3dObject>(original: T, position?: Vector3D, rotation?: Quaternion, parent?: Transform, worldPositionStays?: boolean): T;
        private _uuid;
    }
}
declare namespace feng3d {
    /**
     * 组件事件
     * @author feng 2015-12-2
     */
    class ComponentEvent extends Event {
        /**
         * 添加子组件事件
         */
        static ADDED_COMPONENT: string;
        /**
         * 移除子组件事件
         */
        static REMOVED_COMPONENT: string;
        /**
         * 组件事件数据
         */
        data: {
            container: GameObject;
            child: Component;
        };
        /**
         * 事件目标。
         */
        target: Component;
    }
}
declare namespace feng3d {
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
        constructor();
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: new () => T): T;
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: new () => T): T[];
        /**
         * 派发事件，该事件将会强制冒泡到3D对象中
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event: Event): boolean;
        /**
         * 组件列表
         */
        protected _single: boolean;
        /**
         * 初始化组件
         */
        protected initComponent(): void;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 获取冒泡对象
         */
        protected getBubbleTargets(event?: Event): IEventDispatcher[];
        private _gameObject;
        private _tag;
        private _transform;
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        private _onAddedComponent(event);
        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        private _onRemovedComponent(event);
        private internalGetTransform();
        private internalGetGameObject();
    }
}
declare namespace feng3d {
    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     */
    class FrameBufferObject {
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        framebuffer: WebGLFramebuffer;
        texture: WebGLTexture;
        depthBuffer: WebGLRenderbuffer;
        t: Texture2D;
        init(gl: GL): any;
        active(gl: GL): void;
        deactive(gl: GL): void;
        clear(gl: GL): any;
    }
}
declare namespace feng3d {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    class Renderer extends Component {
        private static renderers;
        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        material: Material;
        private _material;
        /**
         * Makes the rendered 3D object visible if enabled.
         */
        readonly enabled: boolean;
        enable: any;
        private _enabled;
        /**
         * Is this renderer visible in any camera? (Read Only)
         */
        readonly isVisible: boolean;
        constructor();
        drawRenderables(renderContext: RenderContext): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: ShaderRenderData): void;
    }
}
declare namespace feng3d {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    class ForwardRenderer {
        viewRect: Rectangle;
        constructor();
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
    }
}
declare namespace feng3d {
    /**
     * 深度渲染器
     * @author  feng    2017-03-25
     */
    class DepthRenderer {
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    class MouseRenderer extends RenderDataHolder {
        private _shaderName;
        selectedObject3D: GameObject;
        private objects;
        constructor();
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
        protected drawRenderables(renderContext: RenderContext, meshRenderer: MeshRenderer): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: ShaderRenderData): void;
    }
}
declare namespace feng3d {
    /**
     * 后处理渲染器
     * @author feng 2017-02-20
     */
    class PostProcessRenderer {
    }
}
declare namespace feng3d {
    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    class ShadowRenderer {
        private frameBufferObject;
        constructor();
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
    }
}
declare namespace feng3d {
    /**
     * 后处理效果
     * @author feng 2017-02-20
     */
    class PostEffect {
    }
}
declare namespace feng3d {
    /**
     * 快速近似抗锯齿（Fast Approximate Anti-Aliasing）后处理效果
     * @author feng 2017-02-20
     *
     * @see
     * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/fxaa.fragment.fx
     * https://github.com/playcanvas/engine/blob/master/extras/posteffects/posteffect-fxaa.js
     */
    class FXAAEffect {
    }
}
declare namespace feng3d {
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    class MeshFilter extends Component {
        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        mesh: Geometry;
        private _mesh;
        constructor();
    }
}
declare namespace feng3d {
    /**
     * Position, rotation and scale of an object.
     */
    class Object3D extends Component {
        x: number;
        y: number;
        z: number;
        rotationX: number;
        rotationY: number;
        rotationZ: number;
        scaleX: number;
        scaleY: number;
        scaleZ: number;
        eulers: Vector3D;
        /**
         * @private
         */
        matrix3d: Matrix3D;
        pivotPoint: Vector3D;
        position: Vector3D;
        readonly forwardVector: Vector3D;
        readonly rightVector: Vector3D;
        readonly upVector: Vector3D;
        readonly backVector: Vector3D;
        readonly leftVector: Vector3D;
        readonly downVector: Vector3D;
        zOffset: number;
        constructor();
        getPosition(position?: Vector3D): Vector3D;
        setPosition(x?: number, y?: number, z?: number): void;
        getRotation(rotation?: Vector3D): Vector3D;
        setRotation(x?: number, y?: number, z?: number): void;
        getScale(scale?: Vector3D): Vector3D;
        setScale(x?: number, y?: number, z?: number): void;
        scale(value: number): void;
        moveForward(distance: number): void;
        moveBackward(distance: number): void;
        moveLeft(distance: number): void;
        moveRight(distance: number): void;
        moveUp(distance: number): void;
        moveDown(distance: number): void;
        moveTo(dx: number, dy: number, dz: number): void;
        movePivot(dx: number, dy: number, dz: number): void;
        translate(axis: Vector3D, distance: number): void;
        translateLocal(axis: Vector3D, distance: number): void;
        pitch(angle: number): void;
        yaw(angle: number): void;
        roll(angle: number): void;
        clone(): Object3D;
        rotateTo(ax: number, ay: number, az: number): void;
        rotate(axis: Vector3D, angle: number): void;
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        dispose(): void;
        disposeAsset(): void;
        invalidateTransform(): void;
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
        protected _matrix3d: Matrix3D;
        protected _scaleX: number;
        protected _scaleY: number;
        protected _scaleZ: number;
        protected _x: number;
        protected _y: number;
        protected _z: number;
        protected _pivotPoint: Vector3D;
        protected _pivotZero: boolean;
        protected _pos: Vector3D;
        protected _rot: Vector3D;
        protected _sca: Vector3D;
        protected _transformComponents: Array<Vector3D>;
        protected _zOffset: number;
        protected updateMatrix3D(): void;
        private _smallestNumber;
        private _transformDirty;
        private _positionDirty;
        private _rotationDirty;
        private _scaleDirty;
        private _positionChanged;
        private _rotationChanged;
        private _scaleChanged;
        private _rotationX;
        private _rotationY;
        private _rotationZ;
        private _eulers;
        private _flipY;
        private _listenToPositionChanged;
        private _listenToRotationChanged;
        private _listenToScaleChanged;
        private _position;
        private invalidateRotation();
        private notifyRotationChanged();
        private invalidateScale();
        private notifyScaleChanged();
        private invalidatePivot();
        private invalidatePosition();
        private notifyPositionChanged();
    }
}
declare namespace feng3d {
    class ObjectContainer3D extends Object3D {
        _ancestorsAllowMouseEnabled: boolean;
        _isRoot: boolean;
        readonly childCount: number;
        ignoreTransform: boolean;
        readonly isVisible: boolean;
        mouseEnabled: boolean;
        mouseChildren: boolean;
        visible: boolean;
        readonly scenePosition: Vector3D;
        readonly minX: number;
        readonly minY: number;
        readonly minZ: number;
        readonly maxX: number;
        readonly maxY: number;
        readonly maxZ: number;
        /**
         * Matrix that transforms a point from local space into world space.
         */
        localToWorldMatrix: Matrix3D;
        scene: Scene3D;
        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        readonly worldToLocalMatrix: Matrix3D;
        readonly parent: ObjectContainer3D;
        constructor();
        contains(child: ObjectContainer3D): boolean;
        addChild(child: ObjectContainer3D): ObjectContainer3D;
        addChildren(...childarray: any[]): void;
        setChildAt(child: ObjectContainer3D, index: number): void;
        removeChild(child: ObjectContainer3D): void;
        removeChildAt(index: number): void;
        setParent(value: ObjectContainer3D): void;
        getChildAt(index: number): ObjectContainer3D;
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        translateLocal(axis: Vector3D, distance: number): void;
        dispose(): void;
        disposeWithChildren(): void;
        clone(): ObjectContainer3D;
        rotate(axis: Vector3D, angle: number): void;
        updateImplicitVisibility(): void;
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
        /**
         * 获取子对象列表（备份）
         */
        getChildren(): ObjectContainer3D[];
        invalidateTransform(): void;
        protected _scene: Scene3D;
        protected _parent: ObjectContainer3D;
        protected _sceneTransform: Matrix3D;
        protected _sceneTransformDirty: boolean;
        protected _mouseEnabled: boolean;
        protected _ignoreTransform: boolean;
        protected updateMouseChildren(): void;
        protected invalidateSceneTransform(): void;
        protected updateLocalToWorldMatrix(): void;
        private _sceneTransformChanged;
        private _scenechanged;
        private _children;
        private _mouseChildren;
        private _oldScene;
        private _worldToLocalMatrix;
        private _worldToLocalMatrixDirty;
        private _scenePosition;
        private _scenePositionDirty;
        private _explicitVisibility;
        private _implicitVisibility;
        private _listenToSceneTransformChanged;
        private _listenToSceneChanged;
        private notifySceneTransformChange();
        private notifySceneChange();
        private removeChildInternal(childIndex, child);
    }
}
declare namespace feng3d {
    /**
     * Position, rotation and scale of an object.
     *
     * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
     */
    class Transform extends ObjectContainer3D {
        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid: boolean;
        _pickingCollisionVO: PickingCollisionVO;
        private _worldBounds;
        private _worldBoundsInvalid;
        /**
         * 是否为公告牌（默认永远朝向摄像机），默认false。
         */
        isBillboard: boolean;
        /**
         * 保持缩放尺寸
         */
        holdSize: number;
        /**
         * 创建一个实体，该类为虚类
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
        private getDepthScale(renderContext);
        /**
         * @inheritDoc
         */
        readonly minX: number;
        /**
         * @inheritDoc
         */
        readonly minY: number;
        /**
         * @inheritDoc
         */
        readonly minZ: number;
        /**
         * @inheritDoc
         */
        readonly maxX: number;
        /**
         * @inheritDoc
         */
        readonly maxY: number;
        /**
         * @inheritDoc
         */
        readonly maxZ: number;
        /**
         * 边界
         */
        readonly bounds: BoundingVolumeBase;
        /**
         * @inheritDoc
         */
        protected invalidateSceneTransform(): void;
        /**
         * 边界失效
         */
        protected invalidateBounds(): void;
        /**
         * 获取默认边界（默认盒子边界）
         * @return
         */
        protected getDefaultBoundingVolume(): BoundingVolumeBase;
        /**
         * 获取碰撞数据
         */
        readonly pickingCollisionVO: PickingCollisionVO;
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D): boolean;
        /**
         * 世界边界
         */
        readonly worldBounds: BoundingVolumeBase;
        /**
         * 更新世界边界
         */
        private updateWorldBounds();
        /**
         * 处理包围盒变换事件
         */
        protected onBoundsChange(): void;
        /**
         * @inheritDoc
         */
        protected updateBounds(): void;
        /**
         * 碰撞前设置碰撞状态
         * @param shortestCollisionDistance 最短碰撞距离
         * @param findClosest 是否寻找最优碰撞
         * @return
         */
        collidesBefore(pickingCollider: AS3PickingCollider, shortestCollisionDistance: number, findClosest: boolean): boolean;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        camera: new () => Camera;
    }
    /**
     * Base class for all entities in feng3d scenes.
     */
    class GameObject extends Feng3dObject {
        /**
         * The Transform attached to this GameObject. (null if there is none attached).
         */
        readonly transform: Transform;
        private _transform;
        /**
         * @private
         */
        readonly renderData: Object3DRenderAtomic;
        /**
         * 子组件个数
         */
        readonly numComponents: number;
        updateRender(renderContext: RenderContext): void;
        /**
         * 构建3D对象
         */
        constructor(name?: string);
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
        addComponent<T extends Component>(param: (new () => T)): T;
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
        getComponent<T extends Component>(type: new () => T): T;
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: new () => T): T[];
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
        removeComponentsByType<T extends Component>(type: new () => T): T[];
        private static _gameObjects;
        /**
         * Finds a game object by name and returns it.
         * @param name
         */
        static find(name: string): GameObject;
        /**
         * 组件列表
         */
        protected components: Component[];
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        private addComponentAt(component, index);
    }
}
declare namespace feng3d {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class View3D {
        /**
         * 射线坐标临时变量
         */
        private static tempRayPosition;
        /**
         * 射线方向临时变量
         */
        private static tempRayDirection;
        private _gl;
        private _camera;
        private _scene;
        private _canvas;
        private _viewRect;
        /**
         * 默认渲染器
         */
        private defaultRenderer;
        /**
         * 鼠标事件管理器
         */
        private mouse3DManager;
        /**
         * 阴影图渲染器
         */
        private shadowRenderer;
        /**
         * 渲染环境
         */
        private _renderContext;
        /**
         * 鼠标在3D视图中的位置
         */
        mousePos: Point;
        /**
         * 是否自动渲染
         */
        autoRender: boolean;
        private _autoRender;
        readonly viewRect: Rectangle;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene3D, camera?: CameraObject3D, autoRender?: boolean);
        /**
         * 初始化GL
         */
        private initGL();
        /** 3d场景 */
        scene: Scene3D;
        /**
         * 视窗宽度
         */
        readonly width: number;
        /**
         * 绘制场景
         */
        render(): void;
        /**
         * 摄像机
         */
        camera: CameraObject3D;
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event);
        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        getMouseRay3D(): Ray3D;
        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        getRay3D(x: number, y: number, ray3D?: Ray3D): Ray3D;
        /**
         * 投影坐标（世界坐标转换为3D视图坐标）
         * @param point3d 世界坐标
         * @return 屏幕的绝对坐标
         */
        project(point3d: Vector3D): Vector3D;
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(sX: number, sY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
         * @return GPU坐标 (x:[-1,1],y:[-1-1])
         */
        screenToGpuPosition(screenPos: Point): Point;
        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number): number;
    }
}
declare namespace feng3d {
    /**
     * 3D对象事件
     */
    class Object3DEvent extends Event {
        static VISIBLITY_UPDATED: string;
        static SCENETRANSFORM_CHANGED: string;
        static SCENE_CHANGED: string;
        static POSITION_CHANGED: string;
        static ROTATION_CHANGED: string;
        static SCALE_CHANGED: string;
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        static ADDED: string;
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        static REMOVED: string;
        /**
         * 事件数据
         */
        data: IObject3DEventData;
        object: Object3D;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: IObject3DEventData | Object3D, bubbles?: boolean);
    }
    /**
     * 3D对象事件数据
     */
    interface IObject3DEventData {
        /**
         * 父容器
         */
        parent?: GameObject;
        /**
         * 子对象
         */
        child?: GameObject;
    }
}
declare namespace feng3d {
    /**
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    class MeshRenderer extends Renderer {
        static readonly meshRenderers: MeshRenderer[];
        private static _meshRenderers;
        /**
         * 构建
         */
        constructor();
        drawRenderables(renderContext: RenderContext): void;
    }
}
declare namespace feng3d {
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    class Object3dScript extends Component {
        /**
         * 脚本路径
         */
        script: string;
    }
}
declare namespace feng3d {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends Transform {
        /**
         * 背景颜色
         */
        background: Color;
        /**
         * 环境光强度
         */
        ambientColor: Color;
        /**
         * 构造3D场景
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    class Scene3DEvent extends Event {
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        static ADDED_TO_SCENE: string;
        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        static REMOVED_FROM_SCENE: string;
        /**
         * 事件数据
         */
        data: ObjectContainer3D;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: ObjectContainer3D, bubbles?: boolean);
    }
}
declare namespace feng3d {
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    class Geometry extends Feng3dObject {
        /**
         * 顶点索引缓冲
         */
        private _indexBuffer;
        /**
         * 属性数据列表
         */
        private _attributes;
        private _geometryInvalid;
        private _useFaceWeights;
        private _scaleU;
        private _scaleV;
        /**
         * 坐标数据
         */
        positions: Float32Array;
        /**
         * uv数据
         */
        uvs: Float32Array;
        /**
         * 法线数据
         */
        normals: Float32Array;
        /**
         * 切线数据
         */
        tangents: Float32Array;
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
        /**
         * 几何体变脏
         */
        protected invalidateGeometry(): void;
        /**
         * 更新几何体
         */
        protected updateGrometry(): void;
        /**
         * 构建几何体
         */
        protected buildGeometry(): void;
        /**
         * 索引数据
         */
        readonly indices: Uint16Array;
        /**
         * 更新顶点索引数据
         */
        setIndices(indices: Uint16Array): void;
        /**
         * 获取顶点数据
         */
        getIndexData(): IndexRenderData;
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param size          顶点数据尺寸
         */
        setVAData<K extends keyof AttributeRenderDataStuct>(vaId: K, data: Float32Array, size: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId: string): AttributeRenderData;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData1(vaId: string): Float32Array;
        /**
         * 顶点数量
         */
        readonly numVertex: number;
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        addGeometry(geometry: Geometry, transform?: Matrix3D): void;
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        applyTransformation(transform: Matrix3D): void;
        /**
         * 纹理U缩放，默认为1。
         */
        readonly scaleU: number;
        /**
         * 纹理V缩放，默认为1。
         */
        readonly scaleV: number;
        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        scaleUV(scaleU?: number, scaleV?: number): void;
        /**
         * 包围盒失效
         */
        invalidateBounds(): void;
        /**
         * 创建顶点法线
         */
        createVertexNormals(): void;
        /**
         * 创建顶点切线
         */
        createVertexTangents(): void;
        /**
         * 克隆一个几何体
         */
        clone(): Geometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
    }
}
declare namespace feng3d {
    /**
     * 几何体事件
     * @author feng 2015-12-8
     */
    class GeometryEvent extends Event {
        /**
         * 获取几何体顶点数据
         */
        static GET_VA_DATA: string;
        /**
         * 改变几何体顶点数据事件
         */
        static CHANGED_VA_DATA: string;
        /**
         * 改变顶点索引数据事件
         */
        static CHANGED_INDEX_DATA: string;
        /**
         * 包围盒失效
         */
        static BOUNDS_INVALID: string;
        /**
         * 事件目标
         */
        target: Geometry;
        /**
         * 构建几何体事件
         */
        constructor(type: string, data?: any, bubbles?: boolean);
    }
}
declare namespace feng3d {
    class GeometryUtils {
        static createFaceNormals(indices: number[] | Uint16Array, positions: number[] | Float32Array, useFaceWeights?: boolean): {
            faceNormals: number[];
            faceWeights: number[];
        };
        static createVertexNormals(_indices: number[] | Uint16Array, positions: number[] | Float32Array, useFaceWeights?: boolean): number[];
        static createVertexTangents(indices: number[] | Uint16Array, positions: number[] | Float32Array, uvs: number[] | Float32Array, _useFaceWeights?: boolean): Array<number>;
        protected static createFaceTangents(indices: number[] | Uint16Array, positions: number[] | Float32Array, uvs: number[] | Float32Array, useFaceWeights?: boolean): {
            faceTangents: number[];
            faceWeights: number[];
        };
    }
}
declare namespace feng3d {
    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    class PointGeometry extends Geometry {
        /**
         * 几何体是否变脏
         */
        private geometryDirty;
        private _points;
        constructor();
        /**
         * 添加点
         * @param point		点数据
         */
        addPoint(point: PointInfo, needUpdateGeometry?: boolean): void;
        /**
         * 更新几何体
         */
        updateGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getPoint(index: number): PointInfo;
        /**
         * 移除所有线段
         */
        removeAllPoints(): void;
        /**
         * 线段列表
         */
        readonly points: PointInfo[];
    }
    /**
     * 点信息
     * @author feng 2016-10-16
     */
    class PointInfo {
        position: Vector3D;
        normal: Vector3D;
        uv: Point;
        /**
         * 创建点
         * @param position 坐标
         */
        constructor(position?: Vector3D, uv?: Point, normal?: Vector3D);
    }
}
declare namespace feng3d {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends Geometry {
        private segments_;
        constructor();
        /**
         * 添加线段
         * @param segment		            线段数据
         */
        addSegment(segment: Segment): void;
        /**
         * 设置线段
         * @param segment		            线段数据
         * @param index		                线段索引
         */
        setSegmentAt(segment: Segment, index: number): void;
        /**
         * 更新几何体
         */
        protected buildGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getSegment(index: number): Segment;
        /**
         * 移除所有线段
         */
        removeAllSegments(): void;
        /**
         * 线段列表
         */
        readonly segments: Segment[];
    }
    /**
     * 线段
     * @author feng 2016-10-16
     */
    class Segment {
        thickness: number;
        start: Vector3D;
        end: Vector3D;
        startColor: Color;
        endColor: Color;
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        constructor(start: Vector3D, end: Vector3D, colorStart?: number, colorEnd?: number, thickness?: number);
        /**
         * 坐标数据
         */
        readonly positionData: number[];
        /**
         * 颜色数据
         */
        readonly colorData: number[];
    }
}
declare namespace feng3d {
    /**
     * 几何体组件
     * @author feng 2016-10-16
     */
    class GeometryComponent extends Component {
        /**
         * 父组件
         */
        protected _parentComponent: Geometry;
        /**
         * 所属对象
         */
        readonly geometry: Geometry;
        /**
         * 构建几何体组件
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 坐标系统类型
     * @author feng 2014-10-14
     */
    class CoordinateSystem {
        /**
         * 默认坐标系统，左手坐标系统
         */
        static LEFT_HANDED: number;
        /**
         * 右手坐标系统
         */
        static RIGHT_HANDED: number;
    }
}
declare namespace feng3d {
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    abstract class LensBase extends EventDispatcher {
        protected _matrix: Matrix3D;
        protected _scissorRect: Rectangle;
        protected _viewPort: Rectangle;
        protected _near: number;
        protected _far: number;
        protected _aspectRatio: number;
        protected _matrixInvalid: boolean;
        protected _frustumCorners: number[];
        private _unprojection;
        private _unprojectionInvalid;
        /**
         * 创建一个摄像机镜头
         */
        constructor();
        /**
         * Retrieves the corner points of the lens frustum.
         */
        frustumCorners: number[];
        /**
         * 投影矩阵
         */
        matrix: Matrix3D;
        /**
         * 最近距离
         */
        near: number;
        /**
         * 最远距离
         */
        far: number;
        /**
         * 视窗缩放比例(width/height)，在渲染器中设置
         */
        aspectRatio: number;
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d: Vector3D, v?: Vector3D): Vector3D;
        /**
         * 投影逆矩阵
         */
        readonly unprojectionMatrix: Matrix3D;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        abstract unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
        /**
         * 投影矩阵失效
         */
        protected invalidateMatrix(): void;
        /**
         * 更新投影矩阵
         */
        protected abstract updateMatrix(): any;
    }
}
declare namespace feng3d {
    /**
     *
     * @author feng 2015-5-28
     */
    class FreeMatrixLens extends LensBase {
        constructor();
        protected updateMatrix(): void;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
    }
}
declare namespace feng3d {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    class PerspectiveLens extends LensBase {
        private _fieldOfView;
        private _focalLength;
        private _focalLengthInv;
        private _yMax;
        private _xMax;
        private _coordinateSystem;
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        constructor(fieldOfView?: number, coordinateSystem?: number);
        /**
         * 视野
         */
        fieldOfView: number;
        /**
         * 焦距
         */
        focalLength: number;
        unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 坐标系类型
         */
        coordinateSystem: number;
        protected updateMatrix(): void;
    }
}
declare namespace feng3d {
    /**
     * 镜头事件
     * @author feng 2014-10-14
     */
    class LensEvent extends Event {
        static MATRIX_CHANGED: string;
        constructor(type: string, lens?: LensBase, bubbles?: boolean);
        readonly lens: LensBase;
    }
}
declare namespace feng3d {
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    class Camera extends Component {
        private _viewProjection;
        private _viewProjectionDirty;
        private _lens;
        private _frustumPlanes;
        private _frustumPlanesDirty;
        /**
         * 创建一个摄像机
         * @param lens 摄像机镜头
         */
        constructor(lens?: LensBase);
        /**
         * 处理镜头变化事件
         */
        private onLensMatrixChanged(event);
        /**
         * 镜头
         */
        lens: LensBase;
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        readonly viewProjection: Matrix3D;
        readonly inverseSceneTransform: Matrix3D;
        readonly sceneTransform: Matrix3D;
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d: Vector3D, v?: Vector3D): Vector3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理场景变换改变事件
         */
        protected onScenetransformChanged(): void;
        /**
         * 视锥体面
         */
        readonly frustumPlanes: Plane3D[];
        /**
         * 更新视锥体6个面，平面均朝向视锥体内部
         * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
         */
        private updateFrustum();
    }
}
declare namespace feng3d {
    /**
     * 摄像机事件
     * @author feng 2014-10-14
     */
    class CameraEvent extends Event {
        static LENS_CHANGED: string;
        constructor(type: string, camera?: Camera, bubbles?: boolean);
        readonly camera: Camera;
    }
}
declare namespace feng3d {
    /**
     * 包围盒基类
     * @author feng 2014-4-27
     */
    abstract class BoundingVolumeBase extends EventDispatcher {
        /** 最小坐标 */
        protected _min: Vector3D;
        /** 最大坐标 */
        protected _max: Vector3D;
        protected _aabbPointsDirty: boolean;
        private _geometry;
        /**
         * 用于生产包围盒的几何体
         */
        geometry: Geometry;
        /**
         * The maximum extreme of the bounds
         */
        readonly max: Vector3D;
        /**
         * The minimum extreme of the bounds
         */
        readonly min: Vector3D;
        /**
         * 创建包围盒
         */
        constructor();
        /**
         * 处理几何体包围盒失效
         */
        protected onGeometryBoundsInvalid(): void;
        /**
         * 根据几何结构更新边界
         */
        fromGeometry(geometry: Geometry): void;
        /**
         * 根据所给极值设置边界
         * @param minX 边界最小X坐标
         * @param minY 边界最小Y坐标
         * @param minZ 边界最小Z坐标
         * @param maxX 边界最大X坐标
         * @param maxY 边界最大Y坐标
         * @param maxZ 边界最大Z坐标
         */
        fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void;
        /**
         * 检测射线是否与边界交叉
         * @param ray3D						射线
         * @param targetNormal				交叉点法线值
         * @return							射线起点到交点距离
         */
        rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number;
        /**
         * 检测是否包含指定点
         * @param position 		被检测点
         * @return				true：包含指定点
         */
        containsPoint(position: Vector3D): boolean;
        /**
         * 测试是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @param numPlanes		面数
         * @return 				true：出现在视锥体内
         */
        abstract isInFrustum(planes: Plane3D[], numPlanes: number): boolean;
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         */
        abstract transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D): any;
        /**
         * 从给出的球体设置边界
         * @param center 		球心坐标
         * @param radius 		球体半径
         */
        fromSphere(center: Vector3D, radius: number): void;
    }
}
declare namespace feng3d {
    /**
     * 轴对其包围盒
     * @author feng 2014-4-27
     */
    class AxisAlignedBoundingBox extends BoundingVolumeBase {
        private _centerX;
        private _centerY;
        private _centerZ;
        private _halfExtentsX;
        private _halfExtentsY;
        private _halfExtentsZ;
        /**
         * 创建轴对其包围盒
         */
        constructor();
        /**
         * 测试轴对其包围盒是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @return 				true：出现在视锥体内
         * @see me.feng3d.cameras.Camera3D.updateFrustum()
         */
        isInFrustum(planes: Plane3D[], numPlanes: number): boolean;
        /**
         * @inheritDoc
         */
        fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void;
        /**
         * @inheritDoc
         */
        rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number;
        /**
         * @inheritDoc
         */
        containsPoint(position: Vector3D): boolean;
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         * @see http://www.cppblog.com/lovedday/archive/2008/02/23/43122.html
         */
        transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D): void;
    }
}
declare namespace feng3d {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class PlaneGeometry extends Geometry {
        width: number;
        private _width;
        height: number;
        private _height;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        yUp: boolean;
        private _yUp;
        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(width?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
        /**
         * 构建几何体数据
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点坐标
         * @param this.width 宽度
         * @param this.height 高度
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildPosition();
        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal();
        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent();
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class CubeGeometry extends Geometry {
        width: number;
        private _width;
        height: number;
        private _height;
        depth: number;
        private _depth;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        segmentsD: number;
        private _segmentsD;
        tile6: boolean;
        private _tile6;
        /**
         * 创建立方几何体
         * @param   width           宽度，默认为100。
         * @param   height          高度，默认为100。
         * @param   depth           深度，默认为100。
         * @param   segmentsW       宽度方向分割，默认为1。
         * @param   segmentsH       高度方向分割，默认为1。
         * @param   segmentsD       深度方向分割，默认为1。
         * @param   tile6           是否为6块贴图，默认true。
         */
        constructor(width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, segmentsD?: number, tile6?: boolean);
        protected buildGeometry(): void;
        /**
         * 构建坐标
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildPosition();
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildNormal();
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildTangent();
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildIndices();
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    class SphereGeometry extends Geometry {
        radius: number;
        private _radius;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        yUp: boolean;
        private _yUp;
        /**
         * 创建球形几何体
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
        /**
         * 构建几何体数据
         * @param this.radius 球体半径
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    class CapsuleGeometry extends Geometry {
        radius: number;
        private _radius;
        height: number;
        private _height;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        yUp: boolean;
        private _yUp;
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    class CylinderGeometry extends Geometry {
        topRadius: number;
        private _topRadius;
        bottomRadius: number;
        private _bottomRadius;
        height: number;
        private _height;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        topClosed: boolean;
        private _topClosed;
        bottomClosed: boolean;
        private _bottomClosed;
        surfaceClosed: boolean;
        private _surfaceClosed;
        yUp: boolean;
        private _yUp;
        /**
         * 创建圆柱体
         */
        constructor(topRadius?: number, bottomRadius?: number, height?: number, segmentsW?: number, segmentsH?: number, topClosed?: boolean, bottomClosed?: boolean, surfaceClosed?: boolean, yUp?: boolean);
        /**
         * 计算几何体顶点数
         */
        private getNumVertices();
        /**
         * 计算几何体三角形数量
         */
        private getNumTriangles();
        /**
         * 构建几何体数据
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 圆锥体
     * @author feng 2017-02-07
     */
    class ConeGeometry extends CylinderGeometry {
        /**
         * 创建圆锥体
         * @param radius 底部半径
         * @param height 高度
         * @param segmentsW
         * @param segmentsH
         * @param yUp
         */
        constructor(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, closed?: boolean, yUp?: boolean);
    }
}
declare namespace feng3d {
    /**
     * 圆环几何体
     */
    class TorusGeometry extends Geometry {
        radius: number;
        private _radius;
        tubeRadius: number;
        private _tubeRadius;
        readonly segmentsR: number;
        segmentR: any;
        private _segmentsR;
        segmentsT: number;
        private _segmentsT;
        yUp: boolean;
        private _yUp;
        /**
         * 创建<code>Torus</code>实例
         * @param radius						圆环半径
         * @param tubeRadius					管道半径
         * @param segmentsR						横向段数
         * @param segmentsT						纵向段数
         * @param yUp							Y轴是否朝上
         */
        constructor(radius?: number, tubeRadius?: number, segmentsR?: number, segmentsT?: number, yUp?: boolean);
        protected _vertexPositionData: Float32Array;
        protected _vertexNormalData: Float32Array;
        protected _vertexTangentData: Float32Array;
        private _rawIndices;
        private _vertexIndex;
        private _currentTriangleIndex;
        private _numVertices;
        private _vertexPositionStride;
        private _vertexNormalStride;
        private _vertexTangentStride;
        /**
         * 添加顶点数据
         */
        private addVertex(vertexIndex, px, py, pz, nx, ny, nz, tx, ty, tz);
        /**
         * 添加三角形索引数据
         * @param currentTriangleIndex		当前三角形索引
         * @param cwVertexIndex0			索引0
         * @param cwVertexIndex1			索引1
         * @param cwVertexIndex2			索引2
         */
        private addTriangleClockWise(currentTriangleIndex, cwVertexIndex0, cwVertexIndex1, cwVertexIndex2);
        /**
         * @inheritDoc
         */
        protected buildGeometry(): void;
        /**
         * @inheritDoc
         */
        protected buildUVs(): void;
    }
}
declare namespace feng3d {
    /**
     * 天空盒几何体
     * @author feng 2016-09-12
     */
    class SkyBoxGeometry extends Geometry {
        /**
         * 创建天空盒
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends TextureInfo {
        protected _pixels: HTMLImageElement;
        url: string;
        constructor(url?: string);
        /**
         * 处理加载完成
         */
        protected onLoad(): void;
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
    }
}
declare namespace feng3d {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    class TextureCube extends TextureInfo {
        protected _pixels: HTMLImageElement[];
        constructor(images: string[]);
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
    }
}
declare namespace feng3d {
    /**
     * 渲染目标纹理
     */
    class RenderTargetTexture extends TextureInfo {
    }
}
declare namespace feng3d {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends RenderDataHolder {
        protected _pointSize: number;
        protected _enableBlend: boolean;
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        renderMode: number;
        private _renderMode;
        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;
        private _vertexCode;
        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;
        private _fragmentCode;
        /**
         * 是否渲染双面
         */
        bothSides: boolean;
        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        enableBlend: boolean;
        /**
         * 点绘制时点的尺寸
         */
        pointSize: number;
        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        blendEquation: number;
        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        sfactor: number;
        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        dfactor: number;
        private _methods;
        /**
         * 构建材质
         */
        constructor();
        /**
         * 设置渲染程序
         * @param shaderName 渲染程序名称
         */
        setShader(shaderName: string): void;
        /**
         * 添加方法
         */
        addMethod(method: RenderDataHolder): void;
        /**
         * 删除方法
         */
        removeMethod(method: RenderDataHolder): void;
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    class PointMaterial extends Material {
        /**
         * 构建颜色材质
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    class ColorMaterial extends Material {
        /**
         * 颜色
         */
        color: Color;
        private _color;
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color?: Color);
    }
}
declare namespace feng3d {
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     * @author feng 2016-10-15
     */
    class SegmentMaterial extends Material {
        /**
         * 构建线段材质
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 材质组件
     * @author feng 2016-11-01
     */
    class MaterialComponent extends Component {
        /**
         * 父组件
         */
        protected _parentComponent: Material;
        /**
         * 所属对象
         */
        readonly material: Material;
        /**
         * 构建材质组件
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    class TextureMaterial extends Material {
        /**
         * 纹理数据
         */
        texture: Texture2D;
        private _texture;
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    class SkyBoxMaterial extends Material {
        texture: TextureCube;
        private _texture;
        constructor(images?: string[]);
    }
}
declare namespace feng3d {
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    class StandardMaterial extends Material {
        /**
         * 漫反射函数
         */
        diffuseMethod: DiffuseMethod;
        private _diffuseMethod;
        /**
         * 法线函数
         */
        normalMethod: NormalMethod;
        private _normalMethod;
        /**
         * 镜面反射函数
         */
        specularMethod: SpecularMethod;
        private _specularMethod;
        /**
         * 环境反射函数
         */
        ambientMethod: AmbientMethod;
        private _ambientMethod;
        /**
         * 是否开启混合
         */
        enableBlend: boolean;
        /**
         * 构建
         */
        constructor(diffuseUrl?: string, normalUrl?: string, specularUrl?: string, ambientUrl?: string);
    }
}
declare namespace feng3d {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    class DiffuseMethod extends RenderDataHolder {
        /**
         * 漫反射纹理
         */
        difuseTexture: Texture2D;
        private _difuseTexture;
        /**
         * 基本颜色
         */
        color: Color;
        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        alphaThreshold: number;
        /**
         * 构建
         */
        constructor(diffuseUrl?: string);
    }
}
declare namespace feng3d {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    class NormalMethod extends RenderDataHolder {
        /**
         * 漫反射纹理
         */
        normalTexture: Texture2D;
        private _normalTexture;
        /**
         * 构建
         */
        constructor(normalUrl?: string);
    }
}
declare namespace feng3d {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    class SpecularMethod extends RenderDataHolder {
        /**
         * 镜面反射光泽图
         */
        specularTexture: Texture2D;
        private _specularTexture;
        /**
         * 镜面反射颜色
         */
        specularColor: Color;
        /**
         * 镜面反射光反射强度
         */
        specular: number;
        /**
         * 高光系数
         */
        glossiness: number;
        /**
         * 构建
         */
        constructor(specularUrl?: string);
    }
}
declare namespace feng3d {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    class AmbientMethod extends RenderDataHolder {
        /**
         * 环境纹理
         */
        ambientTexture: Texture2D;
        private _ambientTexture;
        /**
         * 颜色
         */
        color: Color;
        private _color;
        /**
         * 构建
         */
        constructor(ambientUrl?: string, color?: Color);
    }
}
declare namespace feng3d {
    class FogMethod extends RenderDataHolder {
        /**
         * 出现雾效果的最近距离
         */
        minDistance: number;
        private _minDistance;
        /**
         * 最远距离
         */
        maxDistance: number;
        private _maxDistance;
        /**
         * 雾的颜色
         */
        fogColor: Color;
        private _fogColor;
        density: number;
        private _density;
        /**
         * 雾模式
         */
        mode: FogMode;
        private _mode;
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        constructor(fogColor?: Color, minDistance?: number, maxDistance?: number, density?: number, mode?: FogMode);
    }
    /**
     * 雾模式
     */
    enum FogMode {
        NONE = 0,
        EXP = 1,
        EXP2 = 2,
        LINEAR = 3,
    }
}
declare namespace feng3d {
    /**
     * 环境映射函数
     */
    class EnvMapMethod extends RenderDataHolder {
        private _cubeTexture;
        private _reflectivity;
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        constructor(envMap: TextureCube, reflectivity?: number);
        /**
         * 环境映射贴图
         */
        envMap: TextureCube;
        /**
         * 反射率
         */
        reflectivity: number;
    }
}
declare namespace feng3d {
    /**
     * 灯光类型
     * @author feng 2016-12-12
     */
    enum LightType {
        /**
         * 点光
         */
        Point = 0,
        /**
         * 方向光
         */
        Directional = 1,
        /**
         * 聚光灯
         */
        Spot = 2,
    }
}
declare namespace feng3d {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends Component {
        static readonly lights: Light[];
        private static _lights;
        /**
         * 灯光类型
         */
        lightType: LightType;
        /**
         * 颜色
         */
        color: Color;
        /**
         * 光照强度
         */
        intensity: number;
        /**
         * 是否生成阴影（未实现）
         */
        castsShadows: boolean;
        private _shadowMap;
        readonly shadowMap: Texture2D;
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends Light {
        static readonly directionalLights: DirectionalLight[];
        private static _directionalLights;
        private _direction;
        private _sceneDirection;
        /**
         * 构建
         */
        constructor();
        readonly sceneDirection: Vector3D;
        /**
         * 光照方向
         */
        direction: Vector3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        protected onScenetransformChanged(): void;
    }
}
declare namespace feng3d {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends Light {
        static readonly pointLights: PointLight[];
        private static _pointLights;
        /**
         * 光照范围
         */
        range: number;
        /**
         * 灯光位置
         */
        readonly position: Vector3D;
        /**
         * 构建
         */
        constructor();
    }
}
declare namespace feng3d {
    class ControllerBase {
        /**
         * 控制对象
         */
        protected _targetObject: GameObject;
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(targetObject: GameObject);
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        targetObject: GameObject;
    }
}
declare namespace feng3d {
    class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: GameObject;
        protected _origin: Vector3D;
        protected _upAxis: Vector3D;
        protected _pos: Vector3D;
        constructor(target?: GameObject, lookAtObject?: GameObject);
        upAxis: Vector3D;
        lookAtPosition: Vector3D;
        lookAtObject: GameObject;
        update(interpolate?: boolean): void;
    }
}
declare namespace feng3d {
    class HoverController extends LookAtController {
        _currentPanAngle: number;
        _currentTiltAngle: number;
        private _panAngle;
        private _tiltAngle;
        private _distance;
        private _minPanAngle;
        private _maxPanAngle;
        private _minTiltAngle;
        private _maxTiltAngle;
        private _steps;
        private _yFactor;
        private _wrapPanAngle;
        steps: number;
        panAngle: number;
        tiltAngle: number;
        distance: number;
        minPanAngle: number;
        maxPanAngle: number;
        minTiltAngle: number;
        maxTiltAngle: number;
        yFactor: number;
        wrapPanAngle: boolean;
        constructor(targetObject?: GameObject, lookAtObject?: GameObject, panAngle?: number, tiltAngle?: number, distance?: number, minTiltAngle?: number, maxTiltAngle?: number, minPanAngle?: number, maxPanAngle?: number, steps?: number, yFactor?: number, wrapPanAngle?: boolean);
        update(interpolate?: boolean): void;
    }
}
declare namespace feng3d {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    class FPSController extends ControllerBase {
        /**
         * 按键记录
         */
        private keyDownDic;
        /**
         * 按键方向字典
         */
        private keyDirectionDic;
        /**
         * 加速度
         */
        private acceleration;
        /**
         * 速度
         */
        private velocity;
        /**
         * 上次鼠标位置
         */
        private preMousePoint;
        constructor(transform?: GameObject);
        targetObject: GameObject;
        private onMousedown();
        private onMouseup();
        private onEnterFrame();
        /**
         * 初始化
         */
        private init();
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event);
        /**
         * 键盘按下事件
         */
        private onKeydown(event);
        /**
         * 键盘弹起事件
         */
        private onKeyup(event);
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity(direction);
    }
}
declare namespace feng3d {
    /**
     * 拾取的碰撞数据
     */
    class PickingCollisionVO {
        /**
         * 第一个穿过的物体
         */
        firstEntity: GameObject;
        /**
         * 碰撞的uv坐标
         */
        uv: Point;
        /**
         * 实体上碰撞本地坐标
         */
        localPosition: Vector3D;
        /**
         * 射线顶点到实体的距离
         */
        rayEntryDistance: number;
        /**
         * 本地坐标系射线
         */
        localRay: Ray3D;
        /**
         * 本地坐标碰撞法线
         */
        localNormal: Vector3D;
        /**
         * 场景中碰撞射线
         */
        ray3D: Ray3D;
        /**
         * 射线坐标是否在边界内
         */
        rayOriginIsInsideBounds: boolean;
        /**
         * 碰撞三角形索引
         */
        index: number;
        /**
         * 碰撞关联的渲染对象
         */
        renderable: Geometry;
        /**
         * 创建射线拾取碰撞数据
         * @param entity
         */
        constructor(entity: GameObject);
        /**
         * 实体上碰撞世界坐标
         */
        readonly scenePosition: Vector3D;
    }
}
declare namespace feng3d {
    /**
     * 使用纯计算与实体相交
     */
    class AS3PickingCollider {
        protected ray3D: Ray3D;
        /** 是否查找最短距离碰撞 */
        private _findClosestCollision;
        /**
         * 创建一个AS碰撞检测器
         * @param findClosestCollision 是否查找最短距离碰撞
         */
        constructor(findClosestCollision?: boolean);
        testSubMeshCollision(geometry: Geometry, pickingCollisionVO: PickingCollisionVO, shortestCollisionDistance?: number, bothSides?: boolean): boolean;
        /**
         * 获取碰撞法线
         * @param indexData 顶点索引数据
         * @param vertexData 顶点数据
         * @param triangleIndex 三角形索引
         * @param normal 碰撞法线
         * @return 碰撞法线
         *
         */
        protected getCollisionNormal(indexData: number[], vertexData: number[], triangleIndex?: number, normal?: Vector3D): Vector3D;
        /**
         * 获取碰撞uv
         * @param indexData 顶点数据
         * @param uvData uv数据
         * @param triangleIndex 三角形所有
         * @param v
         * @param w
         * @param u
         * @param uvOffset
         * @param uvStride
         * @param uv uv坐标
         * @return 碰撞uv
         */
        protected getCollisionUV(indexData: Uint16Array, uvData: Float32Array, triangleIndex: number, v: number, w: number, u: number, uvOffset: number, uvStride: number, uv?: Point): Point;
        /**
         * 设置碰撞射线
         */
        setLocalRay(ray3D: Ray3D): void;
    }
}
declare namespace feng3d {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    class RaycastPicker {
        /** 是否需要寻找最接近的 */
        private _findClosestCollision;
        protected _entities: GameObject[];
        private static pickingCollider;
        /**
         *
         * @param findClosestCollision 是否需要寻找最接近的
         */
        constructor(findClosestCollision: boolean);
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param entitys 实体列表
         * @return
         */
        getViewCollision(ray3D: Ray3D, entitys: GameObject[]): PickingCollisionVO;
        /**
         *获取射线穿过的实体
         */
        private getPickingCollisionVO();
        /**
         * 按与射线原点距离排序
         */
        private sortOnNearT(entity1, entity2);
        /**
         * 更新碰撞本地坐标
         * @param pickingCollisionVO
         */
        private updateLocalPosition(pickingCollisionVO);
    }
}
declare namespace feng3d {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    class TerrainGeometry extends Geometry {
        heightMapUrl: string;
        width: number;
        private _width;
        height: number;
        private _height;
        depth: number;
        private _depth;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        maxElevation: number;
        private _maxElevation;
        minElevation: number;
        private _minElevation;
        private _heightMap;
        private _heightImage;
        /**
         * 创建高度地形 拥有segmentsW*segmentsH个顶点
         * @param    heightMap	高度图
         * @param    width	地形宽度
         * @param    height	地形高度
         * @param    depth	地形深度
         * @param    segmentsW	x轴上网格段数
         * @param    segmentsH	y轴上网格段数
         * @param    maxElevation	最大地形高度
         * @param    minElevation	最小地形高度
         */
        constructor(heightMapUrl: string, width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, maxElevation?: number, minElevation?: number);
        /**
         * 高度图加载完成
         */
        private onHeightMapLoad();
        /**
         * 创建顶点坐标
         */
        protected buildGeometry(): void;
        /**
         * 创建uv坐标
         */
        private buildUVs();
        /**
         * 获取位置在（x，z）处的高度y值
         * @param x x坐标
         * @param z z坐标
         * @return 高度
         */
        getHeightAt(x: number, z: number): number;
        /**
         * 获取像素值
         */
        private getPixel(imageData, u, v);
    }
}
declare namespace feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMethod extends RenderDataHolder {
        splatTexture1: Texture2D;
        private _splatTexture1;
        splatTexture2: Texture2D;
        private _splatTexture2;
        splatTexture3: Texture2D;
        private _splatTexture3;
        blendTexture: Texture2D;
        private _blendTexture;
        splatRepeats: Vector3D;
        private _splatRepeats;
        /**
         * 构建材质
         */
        constructor(blendUrl?: string, splatUrls?: string[], splatRepeats?: Vector3D);
    }
}
declare namespace feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMergeMethod extends RenderDataHolder {
        splatMergeTexture: Texture2D;
        private _splatMergeTexture;
        blendTexture: Texture2D;
        private _blendTexture;
        splatRepeats: Vector3D;
        private _splatRepeats;
        /**
         * 构建材质
         */
        constructor(blendUrl?: string, splatMergeUrl?: string, splatRepeats?: Vector3D);
    }
}
declare namespace feng3d {
    /**
     * 动画状态基类
     * @author feng 2015-9-18
     */
    class AnimationStateBase {
        protected _animationNode: AnimationNodeBase;
        protected _rootDelta: Vector3D;
        protected _positionDeltaDirty: boolean;
        protected _time: number;
        protected _startTime: number;
        protected _animator: AnimatorBase;
        /**
         * @inheritDoc
         */
        readonly positionDelta: Vector3D;
        /**
         * 创建动画状态基类
         * @param animator				动画
         * @param animationNode			动画节点
         */
        constructor(animator: AnimatorBase, animationNode: AnimationNodeBase);
        /**
         * @inheritDoc
         */
        offset(startTime: number): void;
        /**
         * @inheritDoc
         */
        update(time: number): void;
        /**
         * @inheritDoc
         */
        phase(value: number): void;
        /**
         * 更新时间
         * @param time		当前时间
         */
        protected updateTime(time: number): void;
        /**
         * 位置偏移
         */
        protected updatePositionDelta(): void;
    }
}
declare namespace feng3d {
    /**
     * 动画剪辑状态
     * @author feng 2015-9-18
     */
    class AnimationClipState extends AnimationStateBase {
        private _animationClipNode;
        protected _blendWeight: number;
        protected _currentFrame: number;
        protected _nextFrame: number;
        protected _oldFrame: number;
        protected _timeDir: number;
        protected _framesDirty: boolean;
        /**
         * 混合权重	(0[当前帧],1[下一帧])
         * @see #currentFrame
         * @see #nextFrame
         */
        readonly blendWeight: number;
        /**
         * 当前帧
         */
        readonly currentFrame: number;
        /**
         * 下一帧
         */
        readonly nextFrame: number;
        /**
         * 创建一个帧动画状态
         * @param animator				动画
         * @param animationClipNode		帧动画节点
         */
        constructor(animator: AnimatorBase, animationClipNode: AnimationClipNodeBase);
        /**
         * @inheritDoc
         */
        update(time: number): void;
        /**
         * @inheritDoc
         */
        phase(value: number): void;
        /**
         * @inheritDoc
         */
        protected updateTime(time: number): void;
        /**
         * 更新帧，计算当前帧、下一帧与混合权重
         *
         * @see #currentFrame
         * @see #nextFrame
         * @see #blendWeight
         */
        protected updateFrames(): void;
        /**
         * 通知播放完成
         */
        private notifyPlaybackComplete();
    }
}
declare namespace feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    interface Particle {
        /**
         * 索引
         */
        index: number;
        /**
         * 粒子总数量
         */
        total: number;
        /**
         * 出生时间
         */
        birthTime: number;
        /**
         * 寿命
         */
        lifetime: number;
        /**
         * 位移
         */
        position: Vector3D;
        /**
         * 旋转
         */
        rotation: Vector3D;
        /**
         * 缩放
         */
        scale: Vector3D;
        /**
         * 速度
         */
        velocity: Vector3D;
        /**
         * 加速度
         */
        acceleration: Vector3D;
        /**
         * 颜色
         */
        color: Color;
    }
}
declare namespace feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    interface ParticleGlobal {
        /**
         * 加速度
         */
        acceleration: Vector3D | (() => Vector3D);
        /**
         * 公告牌矩阵
         */
        billboardMatrix: Matrix3D | (() => Matrix3D);
    }
}
declare namespace feng3d {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    class ParticleComponent extends RenderDataHolder {
        /**
         * 优先级
         */
        priority: number;
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
        setRenderState(particleAnimator: ParticleAnimator): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    class ParticleEmission extends ParticleComponent {
        /**
         * 发射率，每秒发射粒子数量
         */
        rate: number;
        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        bursts: {
            time: number;
            particles: number;
        }[];
        isDirty: boolean;
        private _numParticles;
        private _birthTimes;
        constructor();
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles);
    }
}
declare namespace feng3d {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    class ParticlePosition extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    class ParticleVelocity extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子颜色组件
     * @author feng 2017-03-14
     */
    class ParticleColor extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare namespace feng3d {
    class ParticleBillboard extends ParticleComponent {
        private _camera;
        private _matrix;
        /** 广告牌轴线 */
        private _billboardAxis;
        /**
         * 创建一个广告牌节点
         * @param billboardAxis
         */
        constructor(camera: Camera, billboardAxis?: Vector3D);
        setRenderState(particleAnimator: ParticleAnimator): void;
        /**
         * 广告牌轴线
         */
        billboardAxis: Vector3D;
    }
}
declare namespace feng3d {
    class ParticleAnimationSet extends RenderDataHolder {
        /**
         * 属性数据列表
         */
        private _attributes;
        private _animations;
        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        generateFunctions: ({
            generate: (particle: Particle) => void;
            priority: number;
        })[];
        private particleGlobal;
        /**
         * 粒子数量
         */
        numParticles: number;
        private _isDirty;
        constructor();
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        setGlobal<K extends keyof ParticleGlobal>(property: K, value: ParticleGlobal[K]): void;
        addAnimation(animation: ParticleComponent): void;
        update(particleAnimator: ParticleAnimator): void;
        /**
         * 生成粒子
         */
        private generateParticles();
        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle);
        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据
         */
        private collectionParticleAttribute(attribute, particle);
    }
}
declare namespace feng3d {
    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    class ParticleAnimator extends Component {
        /**
         * 是否正在播放
         */
        isPlaying: boolean;
        /**
         * 粒子时间
         */
        time: number;
        /**
         * 起始时间
         */
        startTime: number;
        /**
         * 播放速度
         */
        playbackSpeed: number;
        /**
         * 周期
         */
        cycle: number;
        animatorSet: ParticleAnimationSet;
        private _animatorSet;
        constructor();
        play(): void;
        private update();
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        collectRenderDataHolder(renderAtomic?: Object3DRenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * Dispatched to notify changes in an animation state's state.
     */
    class AnimationStateEvent extends Event {
        /**
         * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
         */
        static PLAYBACK_COMPLETE: string;
        static TRANSITION_COMPLETE: string;
        private _animator;
        private _animationState;
        private _animationNode;
        /**
         * Create a new <code>AnimatonStateEvent</code>
         *
         * @param type The event type.
         * @param animator The animation state object that is the subject of this event.
         * @param animationNode The animation node inside the animation state from which the event originated.
         */
        constructor(type: string, animator: AnimatorBase, animationState: AnimationStateBase, animationNode: AnimationNodeBase);
        /**
         * The animator object that is the subject of this event.
         */
        readonly animator: AnimatorBase;
        /**
         * The animation state object that is the subject of this event.
         */
        readonly animationState: AnimationStateBase;
        /**
         * The animation node inside the animation state from which the event originated.
         */
        readonly animationNode: AnimationNodeBase;
        /**
         * Clones the event.
         *
         * @return An exact duplicate of the current object.
         */
        clone(): Event;
    }
}
declare namespace feng3d {
    /**
     * 动画事件
     * @author feng 2014-5-27
     */
    class AnimatorEvent extends Event {
        /** 开始播放动画 */
        static START: string;
        /** 继续播放动画 */
        static PLAY: string;
        /** 停止播放动画 */
        static STOP: string;
        /**
         * 创建一个动画时间
         * @param type			事件类型
         * @param data			事件数据
         * @param bubbles		是否冒泡
         */
        constructor(type: string, data?: any, bubbles?: boolean);
    }
}
declare namespace feng3d {
    /**
     * 动画节点基类
     * @author feng 2014-5-20
     */
    class AnimationNodeBase extends Component {
        protected _stateClass: any;
        /**
         * 状态类
         */
        readonly stateClass: any;
        /**
         * 创建一个动画节点基类
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 动画基类
     * @author feng 2014-5-27
     */
    abstract class AnimatorBase extends Component {
        /** 是否正在播放动画 */
        private _isPlaying;
        private _autoUpdate;
        private _time;
        /** 播放速度 */
        private _playbackSpeed;
        protected _activeNode: AnimationNodeBase;
        protected _activeState: AnimationStateBase;
        /** 当前动画时间 */
        protected _absoluteTime: number;
        private _animationStates;
        /**
         * 是否更新位置
         */
        updatePosition: boolean;
        /**
         * 创建一个动画基类
         */
        constructor();
        /**
         * 获取动画状态
         * @param node		动画节点
         * @return			动画状态
         */
        getAnimationState(node: AnimationNodeBase): AnimationStateBase;
        /**
         * 动画时间
         */
        time: number;
        /**
         * 播放速度
         * <p>默认为1，表示正常速度</p>
         */
        playbackSpeed: number;
        /**
         * 开始动画，当自动更新为true时有效
         */
        start(): void;
        /**
         * 暂停播放动画
         * @see #time
         * @see #update()
         */
        stop(): void;
        /**
         * 更新动画
         * @param time			动画时间
         */
        update(time: number): void;
        /**
         * 更新偏移时间
         * @private
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event?);
        /**
         * 应用位置偏移量
         */
        private applyPositionDelta();
    }
}
declare namespace feng3d {
    /**
     * 动画播放器
     * @author feng 2017-01-04
     */
    class AnimationPlayer {
        private _time;
        private preTime;
        private _isPlaying;
        /**
         * 播放速度
         */
        playbackSpeed: number;
        /**
         * 动画时间
         */
        time: number;
        /**
         * 开始
         */
        start(): void;
        /**
         * 停止
         */
        stop(): void;
        /**
         * 继续
         */
        continue(): void;
        /**
         * 暂停
         */
        pause(): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event);
    }
}
declare namespace feng3d {
    /**
     * 帧动画播放器
     * @author feng 2017-01-04
     */
    class AnimationClipPlayer extends AnimationPlayer {
    }
}
declare namespace feng3d {
    /**
     * 骨骼关节数据
     * @author feng 2014-5-20
     */
    class SkeletonJoint {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        parentIndex: number;
        /** 关节名字 */
        name: string;
        /** 位移 */
        translation: Vector3D;
        /** 旋转 */
        orientation: Quaternion;
        private _matrix3D;
        private _invertMatrix3D;
        readonly matrix3D: Matrix3D;
        readonly invertMatrix3D: Matrix3D;
        readonly inverseBindPose: Float32Array;
        invalid(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    class Skeleton extends Component {
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];
        constructor();
        readonly numJoints: number;
    }
}
declare namespace feng3d {
    /**
     * 关节pose
     * @author feng 2014-5-20
     */
    class JointPose {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** 旋转信息 */
        orientation: Quaternion;
        /** 位移信息 */
        translation: Vector3D;
        private _matrix3D;
        private _invertMatrix3D;
        matrix3D: Matrix3D;
        readonly invertMatrix3D: Matrix3D;
        invalid(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼pose
     * @author feng 2014-5-20
     */
    class SkeletonPose {
        /** 关节pose列表 */
        jointPoses: JointPose[];
        private _globalMatrix3Ds;
        readonly numJointPoses: number;
        constructor();
        readonly globalMatrix3Ds: Matrix3D[];
        invalid(): void;
    }
}
declare namespace feng3d {
    /**
     * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
     * @author feng 2014-5-20
     */
    class AnimationClipNodeBase extends AnimationNodeBase {
        protected _looping: boolean;
        protected _totalDuration: number;
        protected _lastFrame: number;
        protected _stitchDirty: boolean;
        protected _stitchFinalFrame: boolean;
        protected _numFrames: number;
        protected _durations: number[];
        protected _totalDelta: Vector3D;
        /** 是否稳定帧率 */
        fixedFrameRate: boolean;
        /**
         * 持续时间列表（ms）
         */
        readonly durations: number[];
        /**
         * 总坐标偏移量
         */
        readonly totalDelta: Vector3D;
        /**
         * 是否循环播放
         */
        looping: boolean;
        /**
         * 是否过渡结束帧
         */
        stitchFinalFrame: boolean;
        /**
         * 总持续时间
         */
        readonly totalDuration: number;
        /**
         * 最后帧数
         */
        readonly lastFrame: number;
        /**
         * 更新动画播放控制状态
         */
        protected updateStitch(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼动画节点（一般用于一个动画的帧列表）
     * 包含基于时间的动画数据作为单独的骨架构成。
     * @author feng 2014-5-20
     */
    class SkeletonClipNode extends AnimationClipNodeBase {
        private _frames;
        /**
         * 创建骨骼动画节点
         */
        constructor();
        /**
         * 骨骼姿势动画帧列表
         */
        readonly frames: SkeletonPose[];
        /**
         * 添加帧到动画
         * @param skeletonPose 骨骼姿势
         * @param duration 持续时间
         */
        addFrame(skeletonPose: SkeletonPose, duration: number): void;
        /**
         * @inheritDoc
         */
        protected updateStitch(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼剪辑状态
     * @author feng 2015-9-18
     */
    class SkeletonClipState extends AnimationClipState {
        private _rootPos;
        private _frames;
        private _skeletonClipNode;
        private _skeletonPose;
        private _skeletonPoseDirty;
        private _currentPose;
        private _nextPose;
        /**
         * 当前骨骼姿势
         */
        readonly currentPose: SkeletonPose;
        /**
         * 下个姿势
         */
        readonly nextPose: SkeletonPose;
        /**
         * 创建骨骼剪辑状态实例
         * @param animator				动画
         * @param skeletonClipNode		骨骼剪辑节点
         */
        constructor(animator: AnimatorBase, skeletonClipNode: SkeletonClipNode);
        /**
         * @inheritDoc
         */
        getSkeletonPose(): SkeletonPose;
        /**
         * @inheritDoc
         */
        protected updateTime(time: number): void;
        /**
         * @inheritDoc
         */
        protected updateFrames(): void;
        /**
         * 更新骨骼姿势
         * @param skeleton 骨骼
         */
        private updateSkeletonPose();
        /**
         * @inheritDoc
         */
        protected updatePositionDelta(): void;
    }
}
declare namespace feng3d {
    class SkeletonAnimationSet {
    }
}
declare namespace feng3d {
    /**
     * 骨骼动画
     * @author feng 2014-5-27
     */
    class SkeletonAnimator extends AnimatorBase {
        /** 动画节点列表 */
        animations: AnimationNodeBase[];
        /**
         * 骨骼
         */
        skeleton: Skeleton;
        private _skeleton;
        private _globalMatrices;
        private _globalPropertiesDirty;
        private _activeSkeletonState;
        /**
         * 当前骨骼姿势的全局矩阵
         * @see #globalPose
         */
        readonly globalMatrices: Matrix3D[];
        /**
         * 创建一个骨骼动画类
         */
        constructor(skeleton: Skeleton);
        /**
         * 播放动画
         * @param name 动作名称
         */
        play(): void;
        /**
         * @inheritDoc
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 更新骨骼全局变换矩阵
         */
        private updateGlobalProperties();
    }
}
declare namespace feng3d {
    /**
     * 变换动作
     */
    class TransformAnimator extends Component {
        /**
         * 动作名称
         */
        animationName: string;
    }
}
declare namespace feng3d {
    /**
     * 面数据
     */
    type OBJ_Face = {
        /** 顶点索引 */
        vertexIndices: number[];
        /** uv索引 */
        uvIndices?: number[];
        /** 法线索引 */
        normalIndices?: number[];
        /** 索引数据 */
        indexIds: string[];
    };
    /**
     * 子对象
     */
    type OBJ_SubOBJ = {
        /** 材质名称 */
        material?: string;
        /**  */
        g?: string;
        /** 面列表 */
        faces: OBJ_Face[];
    };
    /**
     * 对象
     */
    type OBJ_OBJ = {
        name: string;
        /** 顶点坐标 */
        vertex: {
            x: number;
            y: number;
            z: number;
        }[];
        /** 顶点法线 */
        vn: {
            x: number;
            y: number;
            z: number;
        }[];
        /** 顶点uv */
        vt: {
            u: number;
            v: number;
            s: number;
        }[];
        /** 子对象 */
        subObjs: OBJ_SubOBJ[];
    };
    /**
     * Obj模型数据
     */
    type OBJ_OBJData = {
        /** mtl文件路径 */
        mtl: string;
        /** 模型列表 */
        objs: OBJ_OBJ[];
    };
    /**
     * Obj模型解析器
     * @author feng 2017-01-13
     */
    class OBJParser {
        static parser(context: string): OBJ_OBJData;
    }
}
declare namespace feng3d {
    type Mtl_Material = {
        name: string;
        ka: number[];
        kd: number[];
        ks: number[];
        ns: number;
        ni: number;
        d: number;
        illum: number;
    };
    type Mtl_Mtl = {
        [name: string]: Mtl_Material;
    };
    /**
     * Obj模型Mtl解析器
     * @author feng 2017-01-13
     */
    class MtlParser {
        static parser(context: string): Mtl_Mtl;
    }
}
declare namespace feng3d {
    /**
     * 关节权重数据
     */
    type MD5_Weight = {
        /** weight 序号 */
        index: number;
        /** 对应的Joint的序号 */
        joint: number;
        /** 作用比例 */
        bias: number;
        /** 位置值 */
        pos: number[];
    };
    type MD5_Vertex = {
        /** 顶点索引 */
        index: number;
        /** 纹理坐标u */
        u: number;
        /** 纹理坐标v */
        v: number;
        /** weight的起始序号 */
        startWeight: number;
        /** weight总数 */
        countWeight: number;
    };
    type MD5_Mesh = {
        shader: string;
        numverts: number;
        verts: MD5_Vertex[];
        numtris: number;
        tris: number[];
        numweights: number;
        weights: MD5_Weight[];
    };
    type MD5_Joint = {
        name: string;
        parentIndex: number;
        position: number[];
        /** 旋转数据 */
        rotation: number[];
    };
    type MD5MeshData = {
        MD5Version: number;
        commandline: string;
        numJoints: number;
        numMeshes: number;
        joints: MD5_Joint[];
        meshs: MD5_Mesh[];
    };
    class MD5MeshParser {
        static parse(context: string): MD5MeshData;
    }
}
declare namespace feng3d {
    /**
     * 帧数据
     */
    type MD5_Frame = {
        index: number;
        components: number[];
    };
    /**
     * 基础帧数据
     */
    type MD5_BaseFrame = {
        /** 位置 */
        position: number[];
        /** 方向 */
        orientation: number[];
    };
    /**
     * 包围盒信息
     */
    type MD5_Bounds = {
        /** 最小坐标 */
        min: number[];
        /** 最大坐标 */
        max: number[];
    };
    /**
     * 层级数据
     */
    type MD5_HierarchyData = {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** flag */
        flags: number;
        /** 影响的帧数据起始索引 */
        startIndex: number;
    };
    type MD5AnimData = {
        MD5Version: number;
        commandline: string;
        numFrames: number;
        numJoints: number;
        frameRate: number;
        numAnimatedComponents: number;
        hierarchy: MD5_HierarchyData[];
        bounds: MD5_Bounds[];
        baseframe: MD5_BaseFrame[];
        frame: MD5_Frame[];
    };
    class MD5AnimParser {
        static parse(context: string): MD5AnimData;
    }
}
declare namespace feng3d {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    class ObjLoader {
        private _objData;
        private _mtlData;
        private _completed;
        private _url;
        private _material;
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, material: Material, completed?: (object3D: GameObject) => void): void;
        private onComplete(e);
        private createObj(material);
        private createSubObj(obj, material);
        private _vertices;
        private _vertexNormals;
        private _uvs;
        private _realIndices;
        private _vertexIndex;
        private createMaterialObj(obj, subObj, material);
        private translateVertexData(face, vertexIndex, vertices, uvs, indices, normals);
    }
}
declare namespace feng3d {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    class MD5Loader extends Loader {
        private _completed;
        private _animCompleted;
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, completed?: (object3D: GameObject, skeletonAnimator: SkeletonAnimator) => void): void;
        loadAnim(url: string, completed?: (object3D: SkeletonClipNode) => void): void;
        private _skeleton;
        private createMD5Mesh(md5MeshData);
        /**
         * 计算最大关节数量
         */
        private calculateMaxJointCount(md5MeshData);
        /**
         * 计算0权重关节数量
         * @param vertex 顶点数据
         * @param weights 关节权重数组
         * @return
         */
        private countZeroWeightJoints(vertex, weights);
        private createSkeleton(joints);
        private createSkeletonJoint(joint);
        private createGeometry(md5Mesh);
        private createAnimator(md5AnimData);
        /**
         * 将一个关键帧数据转换为SkeletonPose
         * @param frameData 帧数据
         * @return 包含帧数据的SkeletonPose对象
         */
        private translatePose(md5AnimData, frameData);
    }
}
declare namespace feng3d {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    class Trident extends GameObject {
        private _xLine;
        private _yLine;
        private _zLine;
        private _xArrow;
        private _yArrow;
        private _zArrow;
        constructor(length?: number);
        private buildTrident(length);
    }
}
declare namespace feng3d {
    /**
     * 摄像机3D对象
     * @author feng 2017-02-06
     */
    class CameraObject3D extends GameObject {
        camera: Camera;
        constructor(name?: string);
    }
}
declare namespace feng3d {
    class GameObjectFactory {
        static create(name?: string): GameObject;
        static createCube(name?: string): GameObject;
        static createPlane(name?: string): GameObject;
        static createCylinder(name?: string): GameObject;
        static createSphere(name?: string): GameObject;
        static createCapsule(name?: string): GameObject;
    }
}
declare namespace feng3d {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    class Mouse3DManager {
        viewRect: Rectangle;
        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer;
        mouseX: number;
        mouseY: number;
        private selectedObject3D;
        private mouseEventTypes;
        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownObject3D;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private Object3DClickNum;
        /** 射线采集器(采集射线穿过场景中物体的列表) */
        private _mousePicker;
        private _catchMouseMove;
        /**
         * 是否捕捉鼠标移动，默认false。
         */
        catchMouseMove: boolean;
        constructor();
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event);
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
        private pick(renderContext);
        private glPick(renderContext);
        private getMouseCheckObjects(renderContext);
        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value);
    }
    /**
     * 3D鼠标事件
     */
    class Mouse3DEvent extends Event {
        /** 鼠标单击 */
        static CLICK: string;
        /** 鼠标双击 */
        static DOUBLE_CLICK: "doubleClick3D";
        /** 鼠标按下 */
        static MOUSE_DOWN: string;
        /** 鼠标移动 */
        static MOUSE_MOVE: string;
        /** 鼠标移出 */
        static MOUSE_OUT: string;
        /** 鼠标移入 */
        static MOUSE_OVER: string;
        /** 鼠标弹起 */
        static MOUSE_UP: string;
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    var revision: string;
    /**
     * 是否开启调试(主要用于断言)
     */
    var debuger: boolean;
    /**
     * 数据持久化
     */
    var serialization: Serialization;
    /**
     * 默认材质
     */
    var defaultMaterial: StandardMaterial;
    /**
     * 默认几何体
     */
    var defaultGeometry: Geometry;
    /**
     * 着色器库，由shader.ts初始化
     */
    var shaderFileMap: {
        [filePath: string]: string;
    };
    /**
     * 初始化引擎
     */
    function initEngine(): void;
    /**
     * 初始化函数列表
     */
    var initFunctions: Function[];
}
