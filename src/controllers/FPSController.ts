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
 */
const fpsControllerDefaults = {
    __type__: 'FPSController' as const,
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
