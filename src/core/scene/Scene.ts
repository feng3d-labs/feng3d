import { Component, RegisterComponent } from '../../ecs/Component';
import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Component3D } from '../core/Component3D';
import { HideFlags } from '../core/HideFlags';
import { Node3D } from '../core/Node3D';
import { RunEnvironment } from '../core/RunEnvironment';

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

    init()
    {
        super.init();
        this.node3d.hideFlags = this.node3d.hideFlags | HideFlags.DontTransform;

        //
        this._entity['_scene'] = this;
        this._entity['updateChildrenScene']();
    }
}
