import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { RunEnvironment } from '../core/RunEnvironment';
import { RegisterComponent, Component } from './Component';

declare global
{
    export interface MixinsComponentMap
    {
        Behaviour: Behaviour;
    }
}

/**
 * 行为
 *
 * 可以控制开关的组件
 */
@RegisterComponent()
export class Behaviour extends Component
{
    /**
     * 是否启用update方法
     */
    @oav()
    @SerializeProperty
    enabled = true;

    /**
     * 可运行环境
     */
    runEnvironment = RunEnvironment.all;

    /**
     * Has the Behaviour had enabled called.
     * 是否所在Object3D显示且该行为已启动。
     */
    get isVisibleAndEnabled()
    {
        const v = this.enabled && this.object3D && this.object3D.visible;

        return v;
    }

    /**
     * 每帧执行
     */
    update(_interval?: number)
    {
    }

    dispose()
    {
        this.enabled = false;
        super.dispose();
    }
}
