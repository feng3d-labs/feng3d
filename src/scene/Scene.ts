import type { Ray3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import { Component3D, Component, ComponentMap, isRenderable, Component3DLogic, ComponentLogic } from '../component/Component';
import type { Color4 } from '../core/Color4';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerLogic, logic as getLogic, reactive } from '@feng3d/reactivity';
import { getComponentsInChildren, getComponent } from '../component/componentQuery';
import { Object3D } from '../core/Object3D';
import type { Object3DLogic } from '../core/Object3D';
import { Renderable } from '../core/Renderable';
import { RenderableLogic } from '../core/Renderable';
import { Behaviour } from '../component/Behaviour';

import './Scene';

declare global
{
    export interface MixinsObject3DEventMap
    {
        addToScene: any;
        removeFromScene: any;
        addComponentToScene: any;
    }
}

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

/**
 * Scene 默认值模板。
 */
const sceneDefaults: Scene = {
    __type__: 'Scene',
    background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
};

// 注册默认值（缺失字段自动填充）
/**
 * 创建 Scene 实例。
 */
export function createScene(): Scene
{
    return {
        ...sceneDefaults,
        background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    } as Scene;
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
 * Scene 逻辑处理类。
 *
 * 提供：
 * - init: 初始化（scene 字段已迁移到 Object3DLogic.scene computed，无需手动设置）
 * - update: 每帧清理缓存并驱动所有 active Behaviour 的 update
 * - models/skyBoxs/directionalLights/.../behaviours: 组件集合查询（带帧内缓存）
 * - activeXxx: 过滤激活/启用的组件
 * - mouseCheckObjects / getPickCache / getPickByDirectionalLight / getModelsByCamera
 */
export class SceneLogic extends Component3DLogic
{
    /** init 去重标志 */
    private _inited = false;

    // 帧内缓存
    private _mouseCheckObjects: Object3D[] | null = null;
    private _models: Renderable[] | null = null;
    private _visibleAndEnabledModels: Renderable[] | null = null;
    private _skyBoxs: SkyBox[] | null = null;
    private _activeSkyBoxs: SkyBox[] | null = null;
    private _directionalLights: DirectionalLight[] | null = null;
    private _activeDirectionalLights: DirectionalLight[] | null = null;
    private _pointLights: PointLight[] | null = null;
    private _activePointLights: PointLight[] | null = null;
    private _spotLights: SpotLight[] | null = null;
    private _activeSpotLights: SpotLight[] | null = null;
    private _animations: Animation[] | null = null;
    private _activeAnimations: Animation[] | null = null;
    private _behaviours: Behaviour[] | null = null;
    private _activeBehaviours: Behaviour[] | null = null;
    private readonly _pickMap = new Map<Camera, ScenePickCache>();

    constructor(scene: Scene)
    {
        super(scene);
    }

    private isVisibleAndEnabled(behaviour: Behaviour): boolean
    {
        return getLogic(behaviour).isVisibleAndEnabled.value;
    }

    private renderableLogicOf(renderable: Renderable): RenderableLogic
    {
        return getLogic(renderable) as unknown as RenderableLogic;
    }

    init(object3D?)
    {
        super.init(object3D);
        if (this._inited) return;
        this._inited = true;
        // scene 字段已从 Object3D 数据迁移到 Object3DLogic.scene computed：
        // 自身持 Scene 组件时 computed 返回自身，无需再手动写入。
    }

    beforeRender() { /* no-op */ }

    update(interval?: number)
    {
        const scene = this.component as Scene;
        interval = interval || (1000 / ticker.frameRate);

        this._mouseCheckObjects = null;
        this._models = null;
        this._visibleAndEnabledModels = null;
        this._skyBoxs = null;
        this._activeSkyBoxs = null;
        this._directionalLights = null;
        this._activeDirectionalLights = null;
        this._pointLights = null;
        this._activePointLights = null;
        this._spotLights = null;
        this._activeSpotLights = null;
        this._animations = null;
        this._activeAnimations = null;
        this._behaviours = null;
        this._activeBehaviours = null;

        // 每帧清理拾取缓存
        this._pickMap.forEach((item) => item.clear());

        this.activeBehaviours.forEach((element) =>
        {
            // isVisibleAndEnabled 由  提供（基类 computed）；
            // update 用取实际注册的子类 logic（FPSController 等），
            // 否则 behaviourLogic.update 是基类空实现，子类行为不会执行。
            if (getLogic(element).isVisibleAndEnabled.value && Boolean((element.runEnvironment ?? RunEnvironment.all)))
            {
                (getLogic(element) as any).update(interval);
            }
        });
    }

    get models()
    {
        if (!this.entity) return [];
        return this._models = this._models || getComponentsInChildren(this.entity, 'Renderable');
    }

    get visibleAndEnabledModels()
    {
        return this._visibleAndEnabledModels = this._visibleAndEnabledModels || this.models.filter((i) => this.isVisibleAndEnabled(i));
    }

    get skyBoxs()
    {
        if (!this.entity) return [];
        return this._skyBoxs = this._skyBoxs || getComponentsInChildren(this.entity, 'SkyBox');
    }

    get activeSkyBoxs()
    {
        return this._activeSkyBoxs = this._activeSkyBoxs || this.skyBoxs.filter((i) => { const e = getLogic(i).entity; return e && getLogic(e).activeInHierarchy.value; });
    }

    get directionalLights()
    {
        if (!this.entity) return [];
        return this._directionalLights = this._directionalLights || getComponentsInChildren(this.entity, 'DirectionalLight');
    }

    get activeDirectionalLights()
    {
        return this._activeDirectionalLights = this._activeDirectionalLights || this.directionalLights.filter((i) => getLogic(getLogic(i).entity!).activeInHierarchy.value);
    }

    get pointLights()
    {
        if (!this.entity) return [];
        return this._pointLights = this._pointLights || getComponentsInChildren(this.entity, 'PointLight');
    }

    get activePointLights()
    {
        return this._activePointLights = this._activePointLights || this.pointLights.filter((i) => getLogic(getLogic(i).entity!).activeInHierarchy.value);
    }

    get spotLights()
    {
        if (!this.entity) return [];
        return this._spotLights = this._spotLights || getComponentsInChildren(this.entity, 'SpotLight');
    }

    get activeSpotLights()
    {
        return this._activeSpotLights = this._activeSpotLights || this.spotLights.filter((i) => getLogic(getLogic(i).entity!).activeInHierarchy.value);
    }

    get animations()
    {
        if (!this.entity) return [];
        return this._animations = this._animations || getComponentsInChildren(this.entity, 'Animation');
    }

    get activeAnimations()
    {
        return this._activeAnimations = this._activeAnimations || this.animations.filter((i) => this.isVisibleAndEnabled(i));
    }

    get behaviours()
    {
        if (!this.entity) return [];
        return this._behaviours = this._behaviours || getComponentsInChildren(this.entity, 'Behaviour');
    }

    get activeBehaviours()
    {
        return this._activeBehaviours = this._activeBehaviours || this.behaviours.filter((i) => this.isVisibleAndEnabled(i));
    }

    get mouseCheckObjects()
    {
        if (this._mouseCheckObjects)
        {
            return this._mouseCheckObjects;
        }

        let checkList = reactive(this.entity).children.slice() as Object3D[];
        this._mouseCheckObjects = [];
        let i = 0;
        // 获取所有需要拾取的对象并分层存储
        while (i < checkList.length)
        {
            const checkObject = checkList[i++];
            if (checkObject.mouseEnabled)
            {
                if (checkObject.components.some(c => isRenderable(c)))
                {
                    this._mouseCheckObjects.push(checkObject);
                }
                checkList = checkList.concat(reactive(checkObject).children.slice() as Object3D[]);
            }
        }

        return this._mouseCheckObjects;
    }

    getPickCache(camera: Camera)
    {
        const existing = this._pickMap.get(camera);
        if (existing)
        {
            return existing;
        }
        const pick = new ScenePickCache(this.component as Scene, camera);
        this._pickMap.set(camera, pick);

        return pick;
    }

    getPickByDirectionalLight(_light: DirectionalLight)
    {
        const openlist = [this.entity];
        const targets: Renderable[] = [];
        while (openlist.length > 0)
        {
            const item = openlist.shift() as Object3D;
            if (!item.activeSelf) continue;
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
    }

    getModelsByCamera(camera: Camera)
    {
        const frustum = getLogic(camera).frustum;

        const results = this.visibleAndEnabledModels.filter((i) =>
        {
            const worldBounds = this.renderableLogicOf(i).selfWorldBounds.value;
            if (frustum.intersectsBox(worldBounds))
            {
                return true;
            }

            return false;
        });

        return results;
    }

    dispose()
    {
        this._pickMap.clear();
    }
}
// 注册到分发表
registerLogic('Scene', SceneLogic, sceneDefaults);

// 保留 Ray3 类型引用（mouseRay3D 数据字段类型）
export type { Ray3 };
