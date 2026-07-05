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
    readonly lightType: LightType;
    readonly color: Color3;
    readonly intensity: number;
    readonly shadowType: any;
    readonly shadowBias: number;
    readonly shadowRadius: number;
    readonly shadowCamera: Camera;
    readonly frameBufferObject: FrameBufferObject;
    readonly debugShadowMap: boolean;
}

/**
 * 创建 Light 实例。
 */
export function createLight(): Light
{
    return {
        ...createBehaviour(), __type__: 'Light',
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
