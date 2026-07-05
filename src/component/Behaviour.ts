import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { RunEnvironment } from '../core/RunEnvironment';
import { Component } from './Component';

// 触发 behaviourLogic 注册到 componentLogic 分发表
import './behaviourLogic';

/**
 * 行为（纯数据）。
 *
 * 可以控制开关的组件。每帧由 sceneLogic 调用 componentLogic(behaviour).update。
 *
 * 行为逻辑（isVisibleAndEnabled、update、dispose）由 {@link behaviourLogic} 提供。
 */
export class Behaviour implements Component
{
    readonly __type__: string = 'Behaviour';

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
