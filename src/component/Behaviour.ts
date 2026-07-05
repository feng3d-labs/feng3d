import { RunEnvironment } from '../core/RunEnvironment';
import { Component } from './Component';
import { registerDefaults } from '../core/logic';

// 触发 behaviourLogic 注册到 logic 分发表
import './behaviourLogic';

/**
 * 行为（纯数据接口）。
 *
 * 可以控制开关的组件。每帧由 sceneLogic 调用 logic(behaviour).update。
 */
export interface Behaviour extends Component
{
    /** 是否启用 update 方法（缺失时由 registerDefaults 自动填充） */
    enabled?: boolean;
    /** 可运行环境（缺失时由 registerDefaults 自动填充） */
    runEnvironment?: RunEnvironment;
}

/**
 * Behaviour 默认值模板。
 */
const behaviourDefaults = {
    __type__: 'Behaviour',
    enabled: true,
    runEnvironment: RunEnvironment.all,
};

registerDefaults('Behaviour', behaviourDefaults);

/**
 * 创建 Behaviour 实例。
 */
export function createBehaviour(): Behaviour
{
    return { ...behaviourDefaults };
}
