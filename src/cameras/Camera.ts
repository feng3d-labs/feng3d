import type { Component } from '../component/Component';
import type { LensBase } from './lenses/LensBase';

import './cameraLogic';

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        cameraUniforms: any;
    }
}

/**
 * Camera（纯数据接口）。
 */
export interface Camera extends Component
{
    lens: LensBase;
}

/**
 * 创建 Camera 实例。
 */
export function createCamera(): Camera
{
    return {
        __type__: 'Camera',
        lens: null as any,
    };
}
