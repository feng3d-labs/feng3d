import type { Component, ComponentLogic } from '../component/Component';
import { TextureCube } from '../textures/TextureCube';
import { registerLogic, reactive } from "@feng3d/reactivity";
import { RenderObject, TextureView } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';

import './SkyBox';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        SkyBox: SkyBox;
    }
}

/**
 * SkyBox（纯数据接口）。
 */
export interface SkyBox extends Component
{
    readonly __type__: 'SkyBox';
    readonly s_skyboxTexture: TextureCube;
}

/**
 * 创建 SkyBox 实例。
 */
export function createSkyBox(): SkyBox
{
    return {
        __type__: 'SkyBox',
        s_skyboxTexture: TextureCube.default,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkyBox: ComponentLogic;
    }
}

/**
 * SkyBox 逻辑处理输出。
 *
 * beforeRender 将天空盒纹理写入 renderObject.bindingResources。
 */
export function skyboxLogic(skybox: SkyBox): ComponentLogic
{
    return {
        object3D: null as any,
        init() { /* no-op */ },
        beforeRender(renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null)
        {
            reactive(renderObject.bindingResources).s_skyboxTexture = { texture: skybox.s_skyboxTexture.texture } as TextureView;
        },
        dispose() { /* no-op */ },
    } as any;
}

// 注册到 componentLogic 分发表
registerLogic('SkyBox', (component) =>
{
    return skyboxLogic(component as SkyBox);
});
