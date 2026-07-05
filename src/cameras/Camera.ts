import type { Component } from '../component/Component';
import type { LensBase } from './lenses/LensBase';
import { registerDefaults } from '../core/logic';

import './cameraLogic';

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        cameraUniforms: any;
    }
}

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Camera: Camera;
    }
}

/**
 * Camera（纯数据接口）。
 */
export interface Camera extends Component
{
    readonly __type__: 'Camera';
    lens?: LensBase;
}

/**
 * Camera 默认值模板。
 *
 * 注意：lens 默认值无法静态确定（需 new PerspectiveLens），故不放入 defaults，
 * 由 cameraLogic 在 init 时按需创建。
 */
const cameraDefaults = {
    __type__: 'Camera',
};

registerDefaults('Camera', cameraDefaults);

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
