import { HideFlags } from '../../core/core/HideFlags';
import { RunEnvironment } from '../../core/core/RunEnvironment';
import { Component, RegisterComponent } from '../../ecs/Component';
import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Component3D } from './Component3D';
import { Node3D } from './Node3D';

declare module './Node3D'
{
    /**
     * 组件事件
     */
    interface Node3DEventMap
    {
        addToScene: Node3D;
        removeFromScene: Node3D;
        addComponentToScene: Component;
    }
}

declare module '../../ecs/Component'
{
    interface ComponentMap { Scene3D: Scene3D; }
}

/**
 * 3D场景
 */
@RegisterComponent({ name: 'Scene3D' })
export class Scene3D extends Component3D
{
    declare __class__: 'Scene3D';

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
