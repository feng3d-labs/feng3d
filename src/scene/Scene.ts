import { Color4 } from '@feng3d/math';
import type { Ray3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import type { Component } from '../component/Component';
import { RunEnvironment } from '../core/RunEnvironment';
import { registerDefaults } from '../core/logic';

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
    __type__: 'Scene';

    background?: Color4;
    ambientColor?: Color4;
    runEnvironment?: any;
    mouseRay3D?: Ray3;
    camera?: Camera;
}

/**
 * Scene 默认值模板。
 */
const sceneDefaults = {
    __type__: 'Scene',
    background: new Color4(0, 0, 0, 1),
    ambientColor: new Color4(),
    runEnvironment: RunEnvironment.feng3d,
    mouseRay3D: null,
    camera: null,
};

// 注册默认值（缺失字段自动填充）
registerDefaults('Scene', sceneDefaults);

/**
 * 创建 Scene 实例。
 */
export function createScene(): Scene
{
    return {
        ...sceneDefaults,
        background: new Color4(0, 0, 0, 1),
        ambientColor: new Color4(),
    } as Scene;
}
