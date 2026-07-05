import { Color4 } from '@feng3d/math';
import type { Ray3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import type { Component } from '../component/Component';
import { RunEnvironment } from '../core/RunEnvironment';

import './sceneLogic';

declare global
{
    export interface MixinsObject3DEventMap
    {
        addToScene: any;
        removeFromScene: any;
        addComponentToScene: any;
    }
}

/**
 * Scene（纯数据接口）。
 */
export interface Scene extends Component
{
    background: Color4;
    ambientColor: Color4;
    runEnvironment: any;
    mouseRay3D: Ray3;
    camera: Camera;
}

/**
 * 创建 Scene 实例。
 */
export function createScene(): Scene
{
    return {
        __type__: 'Scene',
        background: new Color4(0, 0, 0, 1),
        ambientColor: new Color4(),
        runEnvironment: RunEnvironment.feng3d,
        mouseRay3D: null as any,
        camera: null as any,
    };
}
