import type { Ray3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import type { Component, ComponentMap } from '../component/Component';
import type { Color4 } from '../core/Color4';
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

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Scene: Scene;
    }
}

/**
 * Scene（纯数据接口）。
 */
export interface Scene extends Component
{
    readonly __type__: 'Scene';

    readonly background?: Color4;
    readonly ambientColor?: Color4;
    readonly runEnvironment?: any;
    readonly mouseRay3D?: Ray3;
    readonly camera?: Camera;
}

/**
 * Scene 默认值模板。
 */
const sceneDefaults = {
    __type__: 'Scene',
    background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
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
        background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    } as Scene;
}
