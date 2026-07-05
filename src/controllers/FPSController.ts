import { Behaviour, createBehaviour } from '../component/Behaviour';
import { RunEnvironment } from '../core/RunEnvironment';

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
    readonly acceleration: number;
    readonly runEnvironment: any;
}

/**
 * 创建 FPSController 实例。
 */
export function createFPSController(): FPSController
{
    return {
        ...createBehaviour(), __type__: 'FPSController',
        acceleration: 0.001,
        runEnvironment: RunEnvironment.feng3d,
    };
}
