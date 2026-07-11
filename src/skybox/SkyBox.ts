import type { Component } from '../component/Component';
import { ComponentLogic } from '../component/Component';
import { TextureCube } from '../textures/TextureCube';
import { registerLogic, logic as getLogic, reactive } from "@feng3d/reactivity";
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
        SkyBox: SkyBoxLogic;
    }
}

/**
 * SkyBox 逻辑处理类。
 *
 * beforeRender 将天空盒纹理写入 renderObject.bindingResources。
 */
export class SkyBoxLogic extends ComponentLogic
{
    constructor(skybox: SkyBox)
    {
        super(skybox);
    }

    beforeRender(renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null): void
    {
        const skybox = this.component as SkyBox;
        reactive(renderObject.bindingResources).s_skyboxTexture = { texture: skybox.s_skyboxTexture.texture } as TextureView;
    }
}

/**
 * 获取 SkyBox 的 logic（委托给统一 logic 入口，与 initComponent 共享同一实例）。
 *
 * 子类 logic 可调用本函数拿到基类 logic 后叠加自身行为。
 */
export function skyboxLogic(skybox: SkyBox): SkyBoxLogic
{
    return getLogic(skybox);
}

// 注册到 componentLogic 分发表
registerLogic('SkyBox', (component) =>
{
    return new SkyBoxLogic(component as SkyBox);
});
