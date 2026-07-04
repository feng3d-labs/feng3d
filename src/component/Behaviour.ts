import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { RunEnvironment } from '../core/RunEnvironment';
import { RegisterComponent, Component } from './Component';

// 触发 behaviourLogic 注册到 componentLogic 分发表
import './behaviourLogic';

declare global
{
    export interface MixinsComponentMap
    {
        Behaviour: Behaviour;
    }
}

/**
 * 行为（纯数据）。
 *
 * 可以控制开关的组件。每帧由 sceneLogic 调用 componentLogic(behaviour).update。
 *
 * 行为逻辑（isVisibleAndEnabled、update、dispose）由 {@link behaviourLogic} 提供。
 */
@RegisterComponent()
export class Behaviour extends Component
{
    /**
     * 是否启用update方法
     */
    @oav()
    @serialize
    enabled = true;

    /**
     * 可运行环境
     */
    runEnvironment = RunEnvironment.all;
}
