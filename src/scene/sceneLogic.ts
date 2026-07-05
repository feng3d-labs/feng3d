import { isRenderable } from "../component/Component";
import { Ray3 } from '@feng3d/math';
import { reactive } from '@feng3d/reactivity';
import { ComponentLogic, registerComponentLogic, componentLogic } from '../component/componentLogic';
import { behaviourLogic } from '../component/behaviourLogic';
import { getComponentsInChildren, getComponent } from '../component/componentQuery';
import { cameraLogic } from '../cameras/cameraLogic';
import type { Camera } from '../cameras/Camera';
import { Object3D } from '../core/Object3D';
import { logic as getLogic } from '../core/logic';
import type { Object3DLogic } from '../core/object3DLogic';
import { Renderable } from '../core/Renderable';
import { renderableLogic, RenderableLogic } from '../core/renderableLogic';
import { materialLogic } from '../materials/materialLogic';
import { Behaviour } from '../component/Behaviour';
import { ticker } from '../utils/Ticker';
import { Scene } from './Scene';
import { ScenePickCache } from './ScenePickCache';
import { SkyBox } from '../skybox/SkyBox';
import { DirectionalLight } from '../light/DirectionalLight';
import { PointLight } from '../light/PointLight';
import { SpotLight } from '../light/SpotLight';
import { Animation } from '../animation/Animation';

/**
 * Scene 逻辑处理输出。
 *
 * 提供：
 * - init: 设置 object3D.scene = self
 * - update: 每帧清理缓存并驱动所有 active Behaviour 的 update
 * - models/skyBoxs/directionalLights/.../behaviours: 组件集合查询（带帧内缓存）
 * - activeXxx: 过滤激活/启用的组件
 * - mouseCheckObjects / getPickCache / getPickByDirectionalLight / getModelsByCamera
 */
export interface SceneLogic extends ComponentLogic
{
    update(interval?: number): void;
    readonly models: Renderable[];
    readonly visibleAndEnabledModels: Renderable[];
    readonly skyBoxs: SkyBox[];
    readonly activeSkyBoxs: SkyBox[];
    readonly directionalLights: DirectionalLight[];
    readonly activeDirectionalLights: DirectionalLight[];
    readonly pointLights: PointLight[];
    readonly activePointLights: PointLight[];
    readonly spotLights: SpotLight[];
    readonly activeSpotLights: SpotLight[];
    readonly animations: Animation[];
    readonly activeAnimations: Animation[];
    readonly behaviours: Behaviour[];
    readonly activeBehaviours: Behaviour[];
    readonly mouseCheckObjects: Object3D[];
    getPickCache(camera: Camera): ScenePickCache;
    getPickByDirectionalLight(light: DirectionalLight): Renderable[];
    getModelsByCamera(camera: Camera): Renderable[];
}


/**
 * 获取 Scene 的 logic。
 */
export function sceneLogic(scene: Scene): SceneLogic

{
    return getLogic<SceneLogic>(scene);
}

function createSceneLogic(scene: Scene): SceneLogic
{
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

    function isVisibleAndEnabled(behaviour: Behaviour): boolean
    {
        return behaviourLogic(behaviour).isVisibleAndEnabled.value;
    }

    function renderableLogicOf(renderable: Renderable): RenderableLogic
    {
        return componentLogic(renderable) as unknown as RenderableLogic;
    }

    const logic: SceneLogic = {
        object3D: null as any,
        init()
        {
            if (_inited) return;
            _inited = true;
            // 设置自身 scene 为自身（Scene 组件所在的 Object3D 属于这个 Scene）
            reactive(logic.object3D).scene = scene as any;
        },
        beforeRender() { /* no-op */ },
        update(interval?: number)
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

            logic.activeBehaviours.forEach((element) =>
            {
                const bl = behaviourLogic(element);
                if (bl.isVisibleAndEnabled.value && Boolean(scene.runEnvironment & element.runEnvironment))
                {
                    bl.update(interval);
                }
            });
        },
        get models()
        {
            return _models = _models || getComponentsInChildren(logic.object3D, 'Renderable');
        },
        get visibleAndEnabledModels()
        {
            return _visibleAndEnabledModels = _visibleAndEnabledModels || logic.models.filter((i) => isVisibleAndEnabled(i));
        },
        get skyBoxs()
        {
            return _skyBoxs = _skyBoxs || getComponentsInChildren(logic.object3D, 'SkyBox');
        },
        get activeSkyBoxs()
        {
            return _activeSkyBoxs = _activeSkyBoxs || logic.skyBoxs.filter((i) => getLogic<Object3DLogic>((i as any).object3D).activeInHierarchy.value);
        },
        get directionalLights()
        {
            return _directionalLights = _directionalLights || getComponentsInChildren(logic.object3D, 'DirectionalLight');
        },
        get activeDirectionalLights()
        {
            return _activeDirectionalLights = _activeDirectionalLights || logic.directionalLights.filter((i) => isVisibleAndEnabled(i as any));
        },
        get pointLights()
        {
            return _pointLights = _pointLights || getComponentsInChildren(logic.object3D, 'PointLight');
        },
        get activePointLights()
        {
            return _activePointLights = _activePointLights || logic.pointLights.filter((i) => isVisibleAndEnabled(i as any));
        },
        get spotLights()
        {
            return _spotLights = _spotLights || getComponentsInChildren(logic.object3D, 'SpotLight');
        },
        get activeSpotLights()
        {
            return _activeSpotLights = _activeSpotLights || logic.spotLights.filter((i) => isVisibleAndEnabled(i as any));
        },
        get animations()
        {
            return _animations = _animations || getComponentsInChildren(logic.object3D, 'Animation');
        },
        get activeAnimations()
        {
            return _activeAnimations = _activeAnimations || logic.animations.filter((i) => isVisibleAndEnabled(i as any));
        },
        get behaviours()
        {
            return _behaviours = _behaviours || getComponentsInChildren(logic.object3D, 'Behaviour');
        },
        get activeBehaviours()
        {
            return _activeBehaviours = _activeBehaviours || logic.behaviours.filter((i) => isVisibleAndEnabled(i));
        },
        get mouseCheckObjects()
        {
            if (_mouseCheckObjects)
            {
                return _mouseCheckObjects;
            }

            let checkList = reactive(logic.object3D).children.slice() as Object3D[];
            _mouseCheckObjects = [];
            let i = 0;
            // 获取所有需要拾取的对象并分层存储
            while (i < checkList.length)
            {
                const checkObject = checkList[i++];
                if (checkObject.mouseEnabled)
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
        getPickCache(camera: Camera)
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
        getPickByDirectionalLight(_light: DirectionalLight)
        {
            const openlist = [logic.object3D];
            const targets: Renderable[] = [];
            while (openlist.length > 0)
            {
                const item = openlist.shift() as Object3D;
                if (!item.activeSelf) continue;
                const model = item.components.find(c => isRenderable(c)) as Renderable;
                if (model && (model.castShadows || model.receiveShadows)
                    && !materialLogic(model.material).renderPipeline.fragment?.targets?.[0]?.blend
                    && materialLogic(model.material).renderPipeline.primitive?.topology !== 'point-list'
                    && materialLogic(model.material).renderPipeline.primitive?.topology !== 'line-list'
                    && materialLogic(model.material).renderPipeline.primitive?.topology !== 'line-strip'
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
        getModelsByCamera(camera: Camera)
        {
            const frustum = cameraLogic(camera).frustum;

            const results = logic.visibleAndEnabledModels.filter((i) =>
            {
                const worldBounds = renderableLogicOf(i).selfWorldBounds.value;
                if (frustum.intersectsBox(worldBounds))
                {
                    return true;
                }

                return false;
            });

            return results;
        },
        dispose()
        {
            _pickMap.clear();
                    },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('Scene', (component) =>
{
    return createSceneLogic(component as Scene);
});

// 保留 Ray3 类型引用（mouseRay3D 数据字段类型）
export type { Ray3 };
