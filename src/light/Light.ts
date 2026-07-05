import { Color3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import { Behaviour, createBehaviour } from '../component/Behaviour';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';

import './lightLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Light: Light;
    }
}

/**
 * Light（纯数据接口）。
 */
export interface Light extends Behaviour
{
    lightType: LightType;
    color: Color3;
    intensity: number;
    shadowType: any;
    shadowBias: number;
    shadowRadius: number;
    shadowCamera: Camera;
    frameBufferObject: FrameBufferObject;
    debugShadowMap: boolean;
}

/**
 * 创建 Light 实例。
 */
export function createLight(): Light
{
    return {
        __type__: 'Light', ...createBehaviour(),
        lightType: null as any,
        color: new Color3(),
        intensity: 1,
        shadowType: ShadowType.No_Shadows,
        shadowBias: -0.005,
        shadowRadius: 1,
        shadowCamera: null as any,
        frameBufferObject: new FrameBufferObject(),
        debugShadowMap: false,
    };
}
