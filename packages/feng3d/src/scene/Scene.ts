import type { Ray3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import { Component3D, ComponentMap, isRenderable, Component3DLogic, componentLogic } from '../component/Component';
import type { Color4 } from '../core/Color4';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerLogic, logic as getLogic, reactive, UnReadonly } from '@feng3d/reactivity';
import { Object3D } from '../core/Object3D';
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
 * Scene 逻辑处理接口。
 *
 * 提供：
 * - init: 初始化（scene 字段已迁移到 Object3DLogic.scene computed，无需手动设置）
 * - update: 每帧清理缓存并驱动所有 active Behaviour 的 update
 * - models/skyBoxs/directionalLights/.../behaviours: 组件集合查询（带帧内缓存）
 * - activeXxx: 过滤激活/启用的组件
 * - mouseCheckObjects / getPickCache / getPickByDirectionalLight / getModelsByCamera
 */
export interface SceneLogic extends Component3DLogic
{
    /** 每帧更新（清理帧内缓存并驱动 active Behaviour 的 update） */
    update(interval?: number): void;
    /** 渲染对象集合（带帧内缓存） */
    get models(): Renderable[];
    /** 可见且启用的渲染对象集合 */
    get visibleAndEnabledModels(): Renderable[];
    /** 天空盒集合（带帧内缓存） */
    get skyBoxs(): SkyBox[];
    /** 激活的天空盒集合 */
    get activeSkyBoxs(): SkyBox[];
    /** 方向光集合（带帧内缓存） */
    get directionalLights(): DirectionalLight[];
    /** 激活的方向光集合 */
    get activeDirectionalLights(): DirectionalLight[];
    /** 点光源集合（带帧内缓存） */
    get pointLights(): PointLight[];
    /** 激活的点光源集合 */
    get activePointLights(): PointLight[];
    /** 聚光灯集合（带帧内缓存） */
    get spotLights(): SpotLight[];
    /** 激活的聚光灯集合 */
    get activeSpotLights(): SpotLight[];
    /** 动画集合（带帧内缓存） */
    get animations(): Animation[];
    /** 激活的动画集合 */
    get activeAnimations(): Animation[];
    /** 行为集合（带帧内缓存） */
    get behaviours(): Behaviour[];
    /** 激活的行为集合 */
    get activeBehaviours(): Behaviour[];
    /** 需要拾取的对象集合（带帧内缓存） */
    get mouseCheckObjects(): Object3D[];
    /** 获取拾取缓存 */
    getPickCache(camera: Camera): ScenePickCache;
    /** 获取投射/接受阴影的渲染对象（按方向光） */
    getPickByDirectionalLight(light: DirectionalLight): Renderable[];
    /** 获取视锥内可见的渲染对象 */
    getModelsByCamera(camera: Camera): Renderable[];
}

/**
 * 创建 SceneLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 *
 * 通过组合 {@link componentLogic}（{@link Component3DLogic}）复用 component/entity/init/beforeRender/dispose 行为，
 * 在此基础上叠加 Scene 自有行为：
 * - update: 每帧清理帧内缓存并驱动所有 active Behaviour 的 update
 * - models/skyBoxs/directionalLights/.../behaviours: 组件集合查询（带帧内缓存）
 * - activeXxx: 过滤激活/启用的组件
 * - mouseCheckObjects / getPickCache / getPickByDirectionalLight / getModelsByCamera
 */
function sceneLogic(scene: Scene): SceneLogic
{
    // ---- 组合 Component3DLogic 全部行为 ----
    const base = componentLogic(scene);

    // 默认值（缺失字段单独赋值；Color4 字面量每次新建避免共享引用）
    const writable = scene as UnReadonly<Scene>;
    if (scene.background === undefined)
    {
        writable.background = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };
    }
    if (scene.ambientColor === undefined)
    {
        writable.ambientColor = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
    }

    // ---- 私有状态 ----
    /** init 去重标志 */
    let _inited = false;

    // 帧内缓存
    let _mouseCheckObjects: Object3D[] | null = null;
    let _models: Renderable[] | null = null;
    let _visibleAndEnabledModels: Renderable[] | null = null;
    let _skyBoxs: SkyBox[] | null = null;
    let _activeSkyBoxs: SkyBox[] | null = null;
    let _directionalLights: DirectionalLight[] | null = null;
    let _activeDirectionalLights: DirectionalLight[] | null = null;
    let _pointLights: PointLight[] | null = null;
    let _activePointLights: PointLight[] | null = null;
    let _spotLights: SpotLight[] | null = null;
    let _activeSpotLights: SpotLight[] | null = null;
    let _animations: Animation[] | null = null;
    let _activeAnimations: Animation[] | null = null;
    let _behaviours: Behaviour[] | null = null;
    let _activeBehaviours: Behaviour[] | null = null;
    const _pickMap = new Map<Camera, ScenePickCache>();

    const isVisibleAndEnabled = (behaviour: Behaviour): boolean =>
    {
        return getLogic(behaviour).isVisibleAndEnabled.value;
    };

    const renderableLogicOf = (renderable: Renderable): RenderableLogic =>
    {
        return getLogic(renderable) as unknown as RenderableLogic;
    };

    // 捕获 base.init 引用（Object.assign 后 base.init 被覆盖，直接调用会递归）
    const baseInit = base.init;

    function init(object3D?: Object3D): void
    {
        baseInit(object3D);
        if (_inited) return;
        _inited = true;
        // scene 字段已从 Object3D 数据迁移到 Object3DLogic.scene computed：
        // 自身持 Scene 组件时 computed 返回自身，无需再手动写入。
    }

    function beforeRender(): void { /* no-op */ }

    function update(interval?: number): void
    {
        interval = interval || (1000 / ticker.frameRate);

        _mouseCheckObjects = null;
        _models = null;
        _visibleAndEnabledModels = null;
        _skyBoxs = null;
        _activeSkyBoxs = null;
        _directionalLights = null;
        _activeDirectionalLights = null;
        _pointLights = null;
        _activePointLights = null;
        _spotLights = null;
        _activeSpotLights = null;
        _animations = null;
        _activeAnimations = null;
        _behaviours = null;
        _activeBehaviours = null;

        // 每帧清理拾取缓存
        _pickMap.forEach((item) => item.clear());

        const self = base as unknown as SceneLogic;
        self.activeBehaviours.forEach((element) =>
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

    function dispose(): void
    {
        _pickMap.clear();
    }

    // ---- 在 base 上叠加 Scene 自有字段（复用同一对象引用） ----
    Object.defineProperties(base, {
        init: { value: init, enumerable: true, configurable: true, writable: true },
        beforeRender: { value: beforeRender, enumerable: true, configurable: true, writable: true },
        update: { value: update, enumerable: true, configurable: true, writable: true },
        dispose: { value: dispose, enumerable: true, configurable: true, writable: true },
        models: {
            get()
            {
                if (!base.entity) return [];
                return _models = _models || getLogic(base.entity as Object3D).getComponentsInChildren('Renderable');
            },
            enumerable: true, configurable: true,
        },
        visibleAndEnabledModels: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _visibleAndEnabledModels = _visibleAndEnabledModels || self.models.filter((i) => isVisibleAndEnabled(i));
            },
            enumerable: true, configurable: true,
        },
        skyBoxs: {
            get()
            {
                if (!base.entity) return [];
                return _skyBoxs = _skyBoxs || getLogic(base.entity as Object3D).getComponentsInChildren('SkyBox');
            },
            enumerable: true, configurable: true,
        },
        activeSkyBoxs: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _activeSkyBoxs = _activeSkyBoxs || self.skyBoxs.filter((i) => { const e = getLogic(i).entity; return e && getLogic(e).activeInHierarchy; });
            },
            enumerable: true, configurable: true,
        },
        directionalLights: {
            get()
            {
                if (!base.entity) return [];
                return _directionalLights = _directionalLights || getLogic(base.entity as Object3D).getComponentsInChildren('DirectionalLight');
            },
            enumerable: true, configurable: true,
        },
        activeDirectionalLights: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _activeDirectionalLights = _activeDirectionalLights || self.directionalLights.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy);
            },
            enumerable: true, configurable: true,
        },
        pointLights: {
            get()
            {
                if (!base.entity) return [];
                return _pointLights = _pointLights || getLogic(base.entity as Object3D).getComponentsInChildren('PointLight');
            },
            enumerable: true, configurable: true,
        },
        activePointLights: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _activePointLights = _activePointLights || self.pointLights.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy);
            },
            enumerable: true, configurable: true,
        },
        spotLights: {
            get()
            {
                if (!base.entity) return [];
                return _spotLights = _spotLights || getLogic(base.entity as Object3D).getComponentsInChildren('SpotLight');
            },
            enumerable: true, configurable: true,
        },
        activeSpotLights: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _activeSpotLights = _activeSpotLights || self.spotLights.filter((i) => getLogic(getLogic(i).entity as Object3D).activeInHierarchy);
            },
            enumerable: true, configurable: true,
        },
        animations: {
            get()
            {
                if (!base.entity) return [];
                return _animations = _animations || getLogic(base.entity as Object3D).getComponentsInChildren('Animation');
            },
            enumerable: true, configurable: true,
        },
        activeAnimations: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _activeAnimations = _activeAnimations || self.animations.filter((i) => isVisibleAndEnabled(i));
            },
            enumerable: true, configurable: true,
        },
        behaviours: {
            get()
            {
                if (!base.entity) return [];
                return _behaviours = _behaviours || getLogic(base.entity as Object3D).getComponentsInChildren('Behaviour');
            },
            enumerable: true, configurable: true,
        },
        activeBehaviours: {
            get()
            {
                const self = base as unknown as SceneLogic;
                return _activeBehaviours = _activeBehaviours || self.behaviours.filter((i) => isVisibleAndEnabled(i));
            },
            enumerable: true, configurable: true,
        },
        mouseCheckObjects: {
            get()
            {
                if (_mouseCheckObjects)
                {
                    return _mouseCheckObjects;
                }

                let checkList = reactive(base.entity as Object3D).children.slice() as Object3D[];
                _mouseCheckObjects = [];
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
                            _mouseCheckObjects.push(checkObject);
                        }
                        checkList = checkList.concat(reactive(checkObject).children.slice() as Object3D[]);
                    }
                }

                return _mouseCheckObjects;
            },
            enumerable: true, configurable: true,
        },
        getPickCache: {
            value(camera: Camera): ScenePickCache
            {
                const existing = _pickMap.get(camera);
                if (existing)
                {
                    return existing;
                }
                const pick = new ScenePickCache(scene, camera);
                _pickMap.set(camera, pick);

                return pick;
            },
            enumerable: true, configurable: true, writable: true,
        },
        getPickByDirectionalLight: {
            value(_light: DirectionalLight): Renderable[]
            {
                const openlist: (Object3D | null)[] = [base.entity as Object3D];
                const targets: Renderable[] = [];
                while (openlist.length > 0)
                {
                    const item = openlist.shift() as Object3D;
                    // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
                    if (!getLogic(item).activeSelf) continue;
                    const model = item.components.find(c => isRenderable(c)) as Renderable;
                    if (model && (model.castShadows || model.receiveShadows)
                        && !getLogic(model.material).renderPipeline.fragment?.targets?.[0]?.blend
                        && getLogic(model.material).renderPipeline.primitive?.topology !== 'point-list'
                        && getLogic(model.material).renderPipeline.primitive?.topology !== 'line-list'
                        && getLogic(model.material).renderPipeline.primitive?.topology !== 'line-strip'
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
            },
            enumerable: true, configurable: true, writable: true,
        },
        getModelsByCamera: {
            value(camera: Camera): Renderable[]
            {
                const camLogic = getLogic(camera);
                const frustum = camLogic.frustum;
                const culling = camLogic.frustumCulling;
                const self = base as unknown as SceneLogic;

                const results = self.visibleAndEnabledModels.filter((i) =>
                {
                    if (!culling)
                    {
                        return true;
                    }
                    const worldBounds = renderableLogicOf(i).selfWorldBounds.value;
                    if (frustum.intersectsBox(worldBounds))
                    {
                        return true;
                    }

                    return false;
                });

                return results;
            },
            enumerable: true, configurable: true, writable: true,
        },
    });

    return base as unknown as SceneLogic;
}

// 注册到分发表
registerLogic('Scene', sceneLogic);

// 保留 Ray3 类型引用（mouseRay3D 数据字段类型）
export type { Ray3 };
