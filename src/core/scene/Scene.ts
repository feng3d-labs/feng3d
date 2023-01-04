import { Component, RegisterComponent } from '../../ecs/Component';
import { Color4 } from '../../math/Color4';
import { Ray3 } from '../../math/geom/Ray3';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';
import { Component3D } from '../core/Component3D';
import { HideFlags } from '../core/HideFlags';
import { MeshRenderer } from '../core/MeshRenderer';
import { Node3D } from '../core/Node3D';
import { RunEnvironment } from '../core/RunEnvironment';
import { DirectionalLight } from '../light/DirectionalLight';
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
@RegisterComponent({ name: 'Scene' })
@Serializable('Scene')
export class Scene extends Component3D
{
    declare __class__: 'Scene';

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

    init()
    {
        super.init();
        this.node3d.hideFlags = this.node3d.hideFlags | HideFlags.DontTransform;

        //
        this._entity['_scene'] = this;
        this._entity['updateChildrenScene']();
    }

    update(interval?: number)
    {
        interval = interval || (1000 / ticker.frameRate);

        // 每帧清理拾取缓存
        this._pickMap.forEach((item) => item.clear());
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

    //
    private _pickMap = new Map<Camera, ScenePickCache>();
}
