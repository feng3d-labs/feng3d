import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerDefaults } from '@feng3d/reactivity';

import './fpsControllerLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        FPSController: FPSController;
    }
}

/**
 * FPSController（纯数据接口）。
 */
export interface FPSController extends Behaviour
{
    readonly __type__: 'FPSController';
    /** 加速度（缺失时由 registerDefaults 自动填充） */
    readonly acceleration?: number;
}

/**
 * FPSController 默认值模板。
 *
 * 注意：必须包含 enabled/runEnvironment（Behaviour 基类的字段）。
 * registerDefaults 仅按当前 __type__ 填充缺失字段，不会自动继承父类的 defaults，
 * 因此声明式字面量 `{ __type__: 'FPSController' }` 需要这里补齐，否则
 * behaviourLogic.isVisibleAndEnabled 为 false，update 不会被 sceneLogic 调用。
 */
const fpsControllerDefaults = {
    __type__: 'FPSController' as const,
    enabled: true,
    runEnvironment: RunEnvironment.all,
    acceleration: 0.001,
};

registerDefaults('FPSController', fpsControllerDefaults);

/**
 * 创建 FPSController 实例。
 */
export function createFPSController(): FPSController
{
    return {
        ...createBehaviour(), ...fpsControllerDefaults,
    };
}
