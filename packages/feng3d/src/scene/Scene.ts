import type { Ray3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import { Component3D, Components, isRenderable, ComponentLogicBase } from '../component/Component';
import type { Color4 } from '../core/Color4';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerLogic, logic as getLogic, reactive, computed, toRaw } from '@feng3d/reactivity';
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

    readonly background?: Color4;
    readonly ambientColor?: Color4;
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
            if (matchType(component, typeName)) results.push(component as T);
        }
        object3Ds = object3Ds.concat((r_object3D.children ?? []).map(c => toRaw(c) as Object3D));
    }

    return results;
}

/**
 * Scene 逻辑类。
 *
 * 继承 ComponentLogicBase（component/entity/init/beforeRender/dispose 行为），
 * 叠加 Scene 自有行为：
 * - update: 每帧清理帧内缓存并驱动所有 active Behaviour 的 update
 * - models/skyBoxs/directionalLights/.../behaviours: 组件集合查询（带帧内缓存）
 * - activeXxx: 过滤激活/启用的组件
 * - mouseCheckObjects / getPickCache / getPickByDirectionalLight / getModelsByCamera
 */
export class SceneLogic extends ComponentLogicBase
{
    /** 数据引用 */
    readonly #scene: Scene;

    /** init 去重标志 */
    #inited = false;

    // 帧内缓存
    #mouseCheckObjects: Object3D[] | null = null;
    #models: Renderable[] | null = null;
    #visibleAndEnabledModels: Renderable[] | null = null;
    #animations: Animation[] | null = null;
    #activeAnimations: Animation[] | null = null;
    #behaviours: Behaviour[] | null = null;
    #activeBehaviours: Behaviour[] | null = null;
    readonly #pickMap = new Map<Camera, ScenePickCache>();

    // ---- 渲染链集合（computed：变更驱动失效，取代每帧清缓存）----
    // 树结构（增删子对象/组件）经 reactive 遍历追踪，激活状态经 logic getter 追踪。
    readonly #_skyBoxsC = computed(() => collectComponentsInChildren<SkyBox>(this.entity as Object3D | null, 'SkyBox'));
    readonly #_activeSkyBoxsC = computed(() => this.#_skyBoxsC.value.filter((i) =>
    {
        const e = getLogic(i).entity;

        return e && getLogic(e as Object3D).activeInHierarchy;
    }));
    readonly #_directionalLightsC = computed(() => collectComponentsInChildren<DirectionalLight>(this.entity as Object3D | null, 'DirectionalLight'));
    readonly #_activeDirectionalLightsC = computed(() => this.#_directionalLightsC.value.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy));
    readonly #_pointLightsC = computed(() => collectComponentsInChildren<PointLight>(this.entity as Object3D | null, 'PointLight'));
    readonly #_activePointLightsC = computed(() => this.#_pointLightsC.value.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy));
    readonly #_spotLightsC = computed(() => collectComponentsInChildren<SpotLight>(this.entity as Object3D | null, 'SpotLight'));
    readonly #_activeSpotLightsC = computed(() => this.#_spotLightsC.value.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy));

    protected constructor(data: Scene)
    {
        super(data);
        this.#scene = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Scene): SceneLogic
    {
        return new SceneLogic(data);
    }

    #isVisibleAndEnabled(behaviour: Behaviour): boolean
    {
        return getLogic(behaviour).isVisibleAndEnabled.value;
    }

    #renderableLogicOf(renderable: Renderable): RenderableLogic
    {
        return getLogic(renderable) as unknown as RenderableLogic;
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);
        if (this.#inited) return;
        this.#inited = true;
        // scene 字段已从 Object3D 数据迁移到 Object3DLogic.scene computed：
        // 自身持 Scene 组件时 computed 返回自身，无需再手动写入。
    }

    /** 每帧更新（清理帧内缓存并驱动 active Behaviour 的 update） */
    update(interval?: number): void
    {
        interval = interval || (1000 / ticker.frameRate);

        this.#mouseCheckObjects = null;
        this.#models = null;
        this.#visibleAndEnabledModels = null;
        this.#animations = null;
        this.#activeAnimations = null;
        this.#behaviours = null;
        this.#activeBehaviours = null;

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
    }

    override dispose(): void
    {
        this.#pickMap.clear();
    }

    /** 渲染对象集合（带帧内缓存） */
    get models(): Renderable[]
    {
        if (!this.entity) return [];
        return this.#models = this.#models || getLogic(this.entity as Object3D).getComponentsInChildren('Renderable');
    }

    /** 可见且启用的渲染对象集合 */
    get visibleAndEnabledModels(): Renderable[]
    {
        return this.#visibleAndEnabledModels = this.#visibleAndEnabledModels || this.models.filter((i) => this.#isVisibleAndEnabled(i));
    }

    /** 天空盒集合 */
    get skyBoxs(): SkyBox[]
    {
        return this.#_skyBoxsC.value;
    }

    /** 激活的天空盒集合 */
    get activeSkyBoxs(): SkyBox[]
    {
        return this.#_activeSkyBoxsC.value;
    }

    /** 方向光集合 */
    get directionalLights(): DirectionalLight[]
    {
        return this.#_directionalLightsC.value;
    }

    /** 激活的方向光集合 */
    get activeDirectionalLights(): DirectionalLight[]
    {
        return this.#_activeDirectionalLightsC.value;
    }

    /** 点光源集合 */
    get pointLights(): PointLight[]
    {
        return this.#_pointLightsC.value;
    }

    /** 激活的点光源集合 */
    get activePointLights(): PointLight[]
    {
        return this.#_activePointLightsC.value;
    }

    /** 聚光灯集合 */
    get spotLights(): SpotLight[]
    {
        return this.#_spotLightsC.value;
    }

    /** 激活的聚光灯集合 */
    get activeSpotLights(): SpotLight[]
    {
        return this.#_activeSpotLightsC.value;
    }

    /** 动画集合（带帧内缓存） */
    get animations(): Animation[]
    {
        if (!this.entity) return [];
        return this.#animations = this.#animations || getLogic(this.entity as Object3D).getComponentsInChildren('Animation');
    }

    /** 激活的动画集合 */
    get activeAnimations(): Animation[]
    {
        return this.#activeAnimations = this.#activeAnimations || this.animations.filter((i) => this.#isVisibleAndEnabled(i));
    }

    /** 行为集合（带帧内缓存） */
    get behaviours(): Behaviour[]
    {
        if (!this.entity) return [];
        return this.#behaviours = this.#behaviours || getLogic(this.entity as Object3D).getComponentsInChildren('Behaviour');
    }

    /** 激活的行为集合 */
    get activeBehaviours(): Behaviour[]
    {
        return this.#activeBehaviours = this.#activeBehaviours || this.behaviours.filter((i) => this.#isVisibleAndEnabled(i));
    }

    /** 需要拾取的对象集合（带帧内缓存） */
    get mouseCheckObjects(): Object3D[]
    {
        if (this.#mouseCheckObjects)
        {
            return this.#mouseCheckObjects;
        }

        let checkList = reactive(this.entity as Object3D).children.slice() as Object3D[];
        this.#mouseCheckObjects = [];
        let i = 0;
        // 获取所有需要拾取的对象并分层存储
        while (i < checkList.length)
        {
            const checkObject = checkList[i++];
            // 通过 logic().mouseEnabled 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
            if (getLogic(checkObject).mouseEnabled)
            {
                if (checkObject.components.some(c => isRenderable(c)))
                {
                    this.#mouseCheckObjects.push(checkObject);
                }
                checkList = checkList.concat(reactive(checkObject).children.slice() as Object3D[]);
            }
        }

        return this.#mouseCheckObjects;
    }

    /** 获取拾取缓存 */
    getPickCache(camera: Camera): ScenePickCache
    {
        const existing = this.#pickMap.get(camera);
        if (existing)
        {
            return existing;
        }
        const pick = new ScenePickCache(this.#scene, camera);
        this.#pickMap.set(camera, pick);

        return pick;
    }

    /** 获取投射/接受阴影的渲染对象（按方向光） */
    getPickByDirectionalLight(_light: DirectionalLight): Renderable[]
    {
        const openlist: (Object3D | null)[] = [this.entity as Object3D];
        const targets: Renderable[] = [];
        while (openlist.length > 0)
        {
            const item = openlist.shift() as Object3D;
            // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
            if (!getLogic(item).activeSelf) continue;
            const model = item.components.find(c => isRenderable(c)) as Renderable;
            // 材质缺失或材质 logic 未注册时跳过（不算投射阴影对象），避免崩溃
            const matLogic = (model && getLogic(model.material)) as unknown as { isTransparent: boolean; isPrimitivesTopology: boolean } | null | undefined;
            if (model && matLogic
                && ((model.castShadows ?? true) || (model.receiveShadows ?? true))
                && !matLogic.isTransparent
                && matLogic.isPrimitivesTopology
            )
            {
                targets.push(model);
            }
            item.children.forEach((element) =>
            {
                openlist.push(element as Object3D);
            });
        }

        return targets;
    }

    /** 获取视锥内可见的渲染对象 */
    getModelsByCamera(camera: Camera): Renderable[]
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
            const worldBounds = this.#renderableLogicOf(i).selfWorldBounds.value;
            if (frustum.intersectsBox(worldBounds))
            {
                return true;
            }

            return false;
        });

        return results;
    }
}

// 注册到分发表
registerLogic('Scene', SceneLogic as unknown as new (data: Scene) => SceneLogic);

// 保留 Ray3 类型引用（mouseRay3D 数据字段类型）
export type { Ray3 };
