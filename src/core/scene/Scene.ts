import { Color4 } from '../../math/Color4';
import { Ray3 } from '../../math/geom/Ray3';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Animation } from '../animation/Animation';
import { Camera } from '../cameras/Camera';
import { Behaviour } from '../component/Behaviour';
import { Component, RegisterComponent } from '../../ecs/Component';
import { HideFlags } from '../core/HideFlags';
import { Node3D } from '../core/Node3D';
import { Renderer } from '../core/Renderer';
import { RunEnvironment } from '../core/RunEnvironment';
import { DirectionalLight } from '../light/DirectionalLight';
import { PointLight } from '../light/PointLight';
import { SpotLight } from '../light/SpotLight';
import { SkyBox } from '../skybox/SkyBox';
import { ticker } from '../utils/Ticker';
import { ScenePickCache } from './ScenePickCache';

declare global
{
    /**
     * 组件事件
     */
    export interface MixinsNode3DEventMap
    {
        addToScene: Node3D;
        removeFromScene: Node3D;
        addComponentToScene: Component;
    }

    export interface MixinsComponentMap { Scene: Scene; }
}

/**
 * 3D场景
 */
@RegisterComponent()
@Serializable()
export class Scene extends Component
{
    __class__: 'Scene';

    /**
     * 背景颜色
     */
    @SerializeProperty()
    @oav()
    background = new Color4(0, 0, 0, 1);

    /**
     * 环境光强度
     */
    @SerializeProperty()
    @oav()
    ambientColor = new Color4();

    /**
     * 指定所运行环境
     *
     * 控制运行符合指定环境场景中所有 Behaviour.update 方法
     *
     * 用于处理某些脚本只在在feng3d引擎或者编辑器中运行的问题。例如 FPSController 默认只在feng3d中运行，在编辑器模式下不会运行。
     */
    runEnvironment = RunEnvironment.feng3d;

    /**
     * 鼠标射线，在渲染时被设置
     */
    mouseRay3D: Ray3;

    /**
     * 上次渲染时用的摄像机
     */
    camera: Camera;

    init()
    {
        super.init();
        this.entity.hideFlags = this.entity.hideFlags | HideFlags.DontTransform;

        //
        this._entity['_scene'] = this;
        this._entity['updateChildrenScene']();
    }

    update(interval?: number)
    {
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

        this.behaviours.forEach((element) =>
        {
            if (element.isVisibleAndEnabled && Boolean(this.runEnvironment & element.runEnvironment))
            { element.update(interval); }
        });
    }

    /**
     * 所有 Model
     */
    get models()
    {
        this._models = this._models || this.getComponentsInChildren(Renderer);

        return this._models;
    }

    /**
     * 所有 可见且开启的 Model
     */
    get visibleAndEnabledModels()
    {
        this._visibleAndEnabledModels = this._visibleAndEnabledModels || this.models.filter((i) => i.isVisibleAndEnabled);

        return this._visibleAndEnabledModels;
    }

    /**
     * 所有 SkyBox
     */
    get skyBoxs()
    {
        this._skyBoxs = this._skyBoxs || this.getComponentsInChildren(SkyBox);

        return this._skyBoxs;
    }

    get activeSkyBoxs()
    {
        this._activeSkyBoxs = this._activeSkyBoxs || this.skyBoxs.filter((i) => i.entity.globalVisible);

        return this._activeSkyBoxs;
    }

    get directionalLights()
    {
        this._directionalLights = this._directionalLights || this.getComponentsInChildren(DirectionalLight);

        return this._directionalLights;
    }

    get activeDirectionalLights()
    {
        this._activeDirectionalLights = this._activeDirectionalLights || this.directionalLights.filter((i) => i.isVisibleAndEnabled);

        return this._activeDirectionalLights;
    }

    get pointLights()
    {
        this._pointLights = this._pointLights || this.getComponentsInChildren(PointLight);

        return this._pointLights;
    }

    get activePointLights()
    {
        this._activePointLights = this._activePointLights || this.pointLights.filter((i) => i.isVisibleAndEnabled);

        return this._activePointLights;
    }

    get spotLights()
    {
        this._spotLights = this._spotLights || this.getComponentsInChildren(SpotLight);

        return this._spotLights;
    }

    get activeSpotLights()
    {
        this._activeSpotLights = this._activeSpotLights || this.spotLights.filter((i) => i.isVisibleAndEnabled);

        return this._activeSpotLights;
    }

    get animations()
    {
        this._animations = this._animations || this.getComponentsInChildren(Animation);

        return this._animations;
    }

    get activeAnimations()
    {
        this._activeAnimations = this._activeAnimations || this.animations.filter((i) => i.isVisibleAndEnabled);

        return this._activeAnimations;
    }

    get behaviours()
    {
        this._behaviours = this._behaviours || this.getComponentsInChildren(Behaviour);

        return this._behaviours;
    }

    get activeBehaviours()
    {
        this._activeBehaviours = this._activeBehaviours || this.behaviours.filter((i) => i.isVisibleAndEnabled);

        return this._activeBehaviours;
    }

    get mouseCheckObjects()
    {
        if (this._mouseCheckObjects)
        { return this._mouseCheckObjects; }

        let checkList = this.entity.children;
        this._mouseCheckObjects = [];
        let i = 0;
        // 获取所有需要拾取的对象并分层存储
        while (i < checkList.length)
        {
            const checkObject = checkList[i++];
            if (checkObject.mouseEnabled)
            {
                if (checkObject.getComponents(Renderer))
                {
                    this._mouseCheckObjects.push(checkObject);
                }
                checkList = checkList.concat(checkObject.children);
            }
        }

        return this._mouseCheckObjects;
    }

    /**
     * 获取拾取缓存
     * @param camera
     */
    getPickCache(camera: Camera)
    {
        if (this._pickMap.get(camera))
        { return this._pickMap.get(camera); }
        const pick = new ScenePickCache(this, camera);
        this._pickMap.set(camera, pick);

        return pick;
    }

    /**
     * 获取接收光照渲染对象列表
     * @param _light
     */
    getPickByDirectionalLight(_light: DirectionalLight)
    {
        const openList = [this.entity];
        const targets: Renderer[] = [];
        while (openList.length > 0)
        {
            const item = openList.shift();
            if (!item.visible) continue;
            const model = item.getComponent(Renderer);
            if (model && (model.castShadows || model.receiveShadows)
                && !model.material.renderParams.enableBlend
                && model.material.renderParams.renderMode === 'TRIANGLES'
            )
            {
                targets.push(model);
            }
            item.children.forEach((element: Node3D) =>
            {
                openList.push(element);
            });
        }

        return targets;
    }

    /**
     * 获取 可被摄像机看见的 Model 列表
     * @param camera
     */
    getModelsByCamera(camera: Camera)
    {
        const frustum = camera.frustum;

        const results = this.visibleAndEnabledModels.filter((i) =>
        {
            const model = i.getComponent(Renderer);
            if (model.selfWorldBounds)
            {
                if (frustum.intersectsBox(model.selfWorldBounds))
                {
                    return true;
                }
            }

            return false;
        });

        return results;
    }

    //
    private _mouseCheckObjects: Node3D[];
    private _models: Renderer[];
    private _visibleAndEnabledModels: Renderer[];
    private _skyBoxs: SkyBox[];
    private _activeSkyBoxs: SkyBox[];
    private _directionalLights: DirectionalLight[];
    private _activeDirectionalLights: DirectionalLight[];
    private _pointLights: PointLight[];
    private _activePointLights: PointLight[];
    private _spotLights: SpotLight[];
    private _activeSpotLights: SpotLight[];
    private _animations: Animation[];
    private _activeAnimations: Animation[];
    private _behaviours: Behaviour[];
    private _activeBehaviours: Behaviour[];
    private _pickMap = new Map<Camera, ScenePickCache>();
}
