import type { Color4Like, Ray3 } from '@feng3d/math';
import { frustumIntersectsBox } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import { Component3D, Component3DLogic, Components, isRenderable, componentLogicProto, setupComponentLogicState, type ComponentLogicState } from '../component/Component';
import type { Color4 } from '../core/Color4';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerLogic, logic as getLogic, reactive, computed, toRaw, createLogicProto, type Computed } from '@feng3d/reactivity';
import { Object3D } from '../core/Object3D';
import { matchType } from '../core/Entity';
import { Renderable } from '../core/Renderable';
import type { RenderableLogic } from '../core/Renderable';
import { Behaviour } from '../component/Behaviour';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        Scene: Scene;
    }
}

/**
 * Scene（纯数据接口）。
 */
export interface Scene extends Component3D
{
    readonly __type__: 'Scene';

    /**
     * 背景色。
     *
     * 声明为 `Color4Like | Color4`（issue #134）：既接受本包的纯数据字面量
     * `{ __type__: 'Color4', r, g, b, a }`（{@link Color4}），也接受任何只提供 `r/g/b/a`
     * 的对象——`@feng3d/math` 的 `Color4` class 实例、不带 `__type__` 的 `{ r, g, b, a }` 字面量。
     */
    readonly background?: Color4Like | Color4;

    /** 环境光颜色（同上：`Color4Like | Color4`） */
    readonly ambientColor?: Color4Like | Color4;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Scene: SceneLogic;
    }
}
import { ticker } from '../utils/Ticker';
import { ScenePickCache } from './ScenePickCache';
import { SkyBox } from '../skybox/SkyBox';
import { DirectionalLight } from '../light/DirectionalLight';
import { PointLight } from '../light/PointLight';
import { SpotLight } from '../light/SpotLight';
import { Animation } from '../animation/Animation';

/**
 * 响应式遍历实体树收集指定类型组件（框架设计文档 G2：变更驱动失效）。
 *
 * children / components 经 reactive 代理迭代（增删子对象/组件可追踪），
 * 与 getComponentsInChildren 的区别在于后者迭代原始数组、无法建立依赖。
 */
function collectComponentsInChildren<T extends Components>(entity: Object3D | null, typeName: string): T[]
{
    if (!entity) return [];

    const results: T[] = [];
    let object3Ds: Object3D[] = [entity];
    while (object3Ds.length > 0)
    {
        const object3D = object3Ds.pop()!;
        const r_object3D = reactive(object3D);
        for (const component of r_object3D.components ?? [])
        {
            // reactive 代理的类型与 Components 联合不完全一致，这里断言（只用于按 __type__ 匹配）
            if (matchType(component as Components, typeName)) results.push(component as T);
        }
        object3Ds = object3Ds.concat((r_object3D.children ?? []).map(c => toRaw(c) as Object3D));
    }

    return results;
}

/** 行为的可见且启用状态（从 behaviourLogic 的 computed 读取） */
function isVisibleAndEnabled(behaviour: Behaviour): boolean
{
    return getLogic(behaviour).isVisibleAndEnabled.value;
}

/** 渲染对象对应的 RenderableLogic */
function renderableLogicOf(renderable: Renderable): RenderableLogic
{
    return getLogic(renderable) as unknown as RenderableLogic;
}

/**
 * Scene 逻辑处理接口。
 *
 * 继承 Component3DLogic（component/entity/init/beforeRender/dispose 行为），
 * 叠加 Scene 自有行为：
 * - update: 每帧清理帧内缓存并驱动所有 active Behaviour 的 update
 * - models/skyBoxs/directionalLights/.../behaviours: 组件集合查询（带帧内缓存）
 * - activeXxx: 过滤激活/启用的组件
 * - mouseCheckObjects / getPickCache / getPickByDirectionalLight / getModelsByCamera
 */
export interface SceneLogic extends Component3DLogic
{
    /** 每帧更新（清理帧内缓存并驱动 active Behaviour 的 update） */
    update(interval?: number): void;
    /** 渲染对象集合（带帧内缓存） */
    readonly models: Renderable[];
    /** 可见且启用的渲染对象集合 */
    readonly visibleAndEnabledModels: Renderable[];
    /** 天空盒集合 */
    readonly skyBoxs: SkyBox[];
    /** 激活的天空盒集合 */
    readonly activeSkyBoxs: SkyBox[];
    /** 方向光集合 */
    readonly directionalLights: DirectionalLight[];
    /** 激活的方向光集合 */
    readonly activeDirectionalLights: DirectionalLight[];
    /** 点光源集合 */
    readonly pointLights: PointLight[];
    /** 激活的点光源集合 */
    readonly activePointLights: PointLight[];
    /** 聚光灯集合 */
    readonly spotLights: SpotLight[];
    /** 激活的聚光灯集合 */
    readonly activeSpotLights: SpotLight[];
    /** 动画集合（带帧内缓存） */
    readonly animations: Animation[];
    /** 激活的动画集合 */
    readonly activeAnimations: Animation[];
    /** 行为集合（带帧内缓存） */
    readonly behaviours: Behaviour[];
    /** 激活的行为集合 */
    readonly activeBehaviours: Behaviour[];
    /** 需要拾取的对象集合（带帧内缓存） */
    readonly mouseCheckObjects: Object3D[];
    /** 获取拾取缓存 */
    getPickCache(camera: Camera): ScenePickCache;
    /** 获取投射/接受阴影的渲染对象（按方向光） */
    getPickByDirectionalLight(_light: DirectionalLight): Renderable[];
    /** 获取视锥内可见的渲染对象 */
    getModelsByCamera(camera: Camera): Renderable[];
}

/** SceneLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface SceneLogicState extends ComponentLogicState
{
    /** 数据引用 */
    _scene: Scene;

    /** init 去重标志 */
    _inited: boolean;

    // 帧内缓存
    _mouseCheckObjects: Object3D[] | null;
    _models: Renderable[] | null;
    _visibleAndEnabledModels: Renderable[] | null;
    _animations: Animation[] | null;
    _activeAnimations: Animation[] | null;
    _behaviours: Behaviour[] | null;
    _activeBehaviours: Behaviour[] | null;
    _pickMap: Map<Camera, ScenePickCache>;

    // ---- 渲染链集合（computed：变更驱动失效，取代每帧清缓存）----
    _skyBoxsC: Computed<SkyBox[]>;
    _activeSkyBoxsC: Computed<SkyBox[]>;
    _directionalLightsC: Computed<DirectionalLight[]>;
    _activeDirectionalLightsC: Computed<DirectionalLight[]>;
    _pointLightsC: Computed<PointLight[]>;
    _activePointLightsC: Computed<PointLight[]>;
    _spotLightsC: Computed<SpotLight[]>;
    _activeSpotLightsC: Computed<SpotLight[]>;
}

/** SceneLogic 的共享原型：继承 Component 基类实现，覆写 init / dispose 并新增查询成员 */
const sceneLogicProto = createLogicProto<SceneLogic>(componentLogicProto, {
    init: {
        value: function (this: SceneLogic & SceneLogicState, object3D?: Object3D): void
        {
            componentLogicProto.init.call(this, object3D);
            if (this._inited) return;
            this._inited = true;
            // scene 字段已从 Object3D 数据迁移到 Object3DLogic.scene computed：
            // 自身持 Scene 组件时 computed 返回自身，无需再手动写入。
        },
    },
    dispose: {
        value: function (this: SceneLogic & SceneLogicState): void
        {
            this._pickMap.clear();
        },
    },
    /** 每帧更新（清理帧内缓存并驱动 active Behaviour 的 update） */
    update: {
        value: function (this: SceneLogic & SceneLogicState, interval?: number): void
        {
            interval = interval || (1000 / ticker.frameRate);

            this._mouseCheckObjects = null;
            this._models = null;
            this._visibleAndEnabledModels = null;
            this._animations = null;
            this._activeAnimations = null;
            this._behaviours = null;
            this._activeBehaviours = null;

            // skyBoxs/lights/pickCache 已 computed 化（变更驱动失效），不再每帧清理。

            this.activeBehaviours.forEach((element) =>
            {
                // isVisibleAndEnabled 由 behaviourLogic 提供（基类 computed）；
                // update 用取实际注册的子类 logic（FPSController 等），
                // 否则 behaviourLogic.update 是基类空实现，子类行为不会执行。
                if (getLogic(element).isVisibleAndEnabled.value && Boolean((element.runEnvironment ?? RunEnvironment.all)))
                {
                    getLogic(element).update(interval);
                }
            });
        },
    },
    /** 渲染对象集合（带帧内缓存） */
    models: {
        get: function (this: SceneLogic & SceneLogicState): Renderable[]
        {
            if (!this.entity) return [];
            return this._models = this._models || getLogic(this.entity as Object3D).getComponentsInChildren('Renderable');
        },
    },
    /** 可见且启用的渲染对象集合 */
    visibleAndEnabledModels: {
        get: function (this: SceneLogic & SceneLogicState): Renderable[]
        {
            return this._visibleAndEnabledModels = this._visibleAndEnabledModels || this.models.filter((i) => isVisibleAndEnabled(i));
        },
    },
    /** 天空盒集合 */
    skyBoxs: {
        get: function (this: SceneLogic & SceneLogicState): SkyBox[]
        {
            return this._skyBoxsC.value;
        },
    },
    /** 激活的天空盒集合 */
    activeSkyBoxs: {
        get: function (this: SceneLogic & SceneLogicState): SkyBox[]
        {
            return this._activeSkyBoxsC.value;
        },
    },
    /** 方向光集合 */
    directionalLights: {
        get: function (this: SceneLogic & SceneLogicState): DirectionalLight[]
        {
            return this._directionalLightsC.value;
        },
    },
    /** 激活的方向光集合 */
    activeDirectionalLights: {
        get: function (this: SceneLogic & SceneLogicState): DirectionalLight[]
        {
            return this._activeDirectionalLightsC.value;
        },
    },
    /** 点光源集合 */
    pointLights: {
        get: function (this: SceneLogic & SceneLogicState): PointLight[]
        {
            return this._pointLightsC.value;
        },
    },
    /** 激活的点光源集合 */
    activePointLights: {
        get: function (this: SceneLogic & SceneLogicState): PointLight[]
        {
            return this._activePointLightsC.value;
        },
    },
    /** 聚光灯集合 */
    spotLights: {
        get: function (this: SceneLogic & SceneLogicState): SpotLight[]
        {
            return this._spotLightsC.value;
        },
    },
    /** 激活的聚光灯集合 */
    activeSpotLights: {
        get: function (this: SceneLogic & SceneLogicState): SpotLight[]
        {
            return this._activeSpotLightsC.value;
        },
    },
    /** 动画集合（带帧内缓存） */
    animations: {
        get: function (this: SceneLogic & SceneLogicState): Animation[]
        {
            if (!this.entity) return [];
            return this._animations = this._animations || getLogic(this.entity as Object3D).getComponentsInChildren('Animation');
        },
    },
    /** 激活的动画集合 */
    activeAnimations: {
        get: function (this: SceneLogic & SceneLogicState): Animation[]
        {
            return this._activeAnimations = this._activeAnimations || this.animations.filter((i) => isVisibleAndEnabled(i));
        },
    },
    /** 行为集合（带帧内缓存） */
    behaviours: {
        get: function (this: SceneLogic & SceneLogicState): Behaviour[]
        {
            if (!this.entity) return [];
            return this._behaviours = this._behaviours || getLogic(this.entity as Object3D).getComponentsInChildren('Behaviour');
        },
    },
    /** 激活的行为集合 */
    activeBehaviours: {
        get: function (this: SceneLogic & SceneLogicState): Behaviour[]
        {
            return this._activeBehaviours = this._activeBehaviours || this.behaviours.filter((i) => isVisibleAndEnabled(i));
        },
    },
    /** 需要拾取的对象集合（带帧内缓存） */
    mouseCheckObjects: {
        get: function (this: SceneLogic & SceneLogicState): Object3D[]
        {
            if (this._mouseCheckObjects)
            {
                return this._mouseCheckObjects;
            }

            let checkList = (reactive(this.entity as Object3D).children ?? []).slice() as Object3D[];
            this._mouseCheckObjects = [];
            let i = 0;
            // 获取所有需要拾取的对象并分层存储
            while (i < checkList.length)
            {
                const checkObject = checkList[i++];
                // 通过 logic().mouseEnabled 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
                if (getLogic(checkObject).mouseEnabled)
                {
                    if ((checkObject.components ?? []).some(c => isRenderable(c)))
                    {
                        this._mouseCheckObjects.push(checkObject);
                    }
                    checkList = checkList.concat((reactive(checkObject).children ?? []).slice() as Object3D[]);
                }
            }

            return this._mouseCheckObjects;
        },
    },
    /** 获取拾取缓存 */
    getPickCache: {
        value: function (this: SceneLogic & SceneLogicState, camera: Camera): ScenePickCache
        {
            const existing = this._pickMap.get(camera);
            if (existing)
            {
                return existing;
            }
            const pick = new ScenePickCache(this._scene, camera);
            this._pickMap.set(camera, pick);

            return pick;
        },
    },
    /** 获取投射/接受阴影的渲染对象（按方向光） */
    getPickByDirectionalLight: {
        value: function (this: SceneLogic & SceneLogicState, _light: DirectionalLight): Renderable[]
        {
            const openlist: (Object3D | null)[] = [this.entity as Object3D];
            const targets: Renderable[] = [];
            while (openlist.length > 0)
            {
                const item = openlist.shift() as Object3D;
                // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
                if (!getLogic(item).activeSelf) continue;
                const model = item.components?.find(c => isRenderable(c)) as Renderable;
                // 材质缺失或材质 logic 未注册时跳过（不算投射阴影对象），避免崩溃
                const matLogic = (model && getLogic(model.material!)) as unknown as { isTransparent: boolean; isPrimitivesTopology: boolean } | null | undefined;
                if (model && matLogic
                    && ((model.castShadows ?? true) || (model.receiveShadows ?? true))
                    && !matLogic.isTransparent
                    && matLogic.isPrimitivesTopology
                )
                {
                    targets.push(model);
                }
                (item.children ?? []).forEach((element) =>
                {
                    openlist.push(element as Object3D);
                });
            }

            return targets;
        },
    },
    /** 获取视锥内可见的渲染对象 */
    getModelsByCamera: {
        value: function (this: SceneLogic & SceneLogicState, camera: Camera): Renderable[]
        {
            const camLogic = getLogic(camera);
            const frustum = camLogic.frustum;
            const culling = camLogic.frustumCulling;

            const results = this.visibleAndEnabledModels.filter((i) =>
            {
                if (!culling)
                {
                    return true;
                }
                const worldBounds = renderableLogicOf(i).selfWorldBounds.value;
                if (frustumIntersectsBox(frustum, worldBounds))
                {
                    return true;
                }

                return false;
            });

            return results;
        },
    },
});

/**
 * 工厂函数：SceneLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function sceneLogic(data: Scene): SceneLogic
{
    const logic = setupComponentLogicState(Object.create(sceneLogicProto) as SceneLogic & SceneLogicState, data);
    logic._scene = data;
    logic._inited = false;

    // 帧内缓存
    logic._mouseCheckObjects = null;
    logic._models = null;
    logic._visibleAndEnabledModels = null;
    logic._animations = null;
    logic._activeAnimations = null;
    logic._behaviours = null;
    logic._activeBehaviours = null;
    logic._pickMap = new Map<Camera, ScenePickCache>();

    // ---- 渲染链集合（computed：变更驱动失效，取代每帧清缓存）----
    // 树结构（增删子对象/组件）经 reactive 遍历追踪，激活状态经 logic getter 追踪。
    logic._skyBoxsC = computed(() => collectComponentsInChildren<SkyBox>(logic.entity as Object3D | null, 'SkyBox'));
    logic._activeSkyBoxsC = computed(() => logic._skyBoxsC.value.filter((i) =>
    {
        const e = getLogic(i).entity;

        return e && getLogic(e as Object3D).activeInHierarchy;
    }));
    logic._directionalLightsC = computed(() => collectComponentsInChildren<DirectionalLight>(logic.entity as Object3D | null, 'DirectionalLight'));
    logic._activeDirectionalLightsC = computed(() => logic._directionalLightsC.value.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy));
    logic._pointLightsC = computed(() => collectComponentsInChildren<PointLight>(logic.entity as Object3D | null, 'PointLight'));
    logic._activePointLightsC = computed(() => logic._pointLightsC.value.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy));
    logic._spotLightsC = computed(() => collectComponentsInChildren<SpotLight>(logic.entity as Object3D | null, 'SpotLight'));
    logic._activeSpotLightsC = computed(() => logic._spotLightsC.value.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy));

    return logic;
}

// 注册到分发表
registerLogic('Scene', sceneLogic);

// 保留 Ray3 类型引用（mouseRay3D 数据字段类型）
export type { Ray3 };
