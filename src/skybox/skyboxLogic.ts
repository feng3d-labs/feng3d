import { registerLogic } from "@feng3d/reactivity";
import { reactive } from '@feng3d/reactivity';
import { RenderObject, TextureView } from '@feng3d/webgpu';
import { ComponentLogic, } from '../component/componentLogic';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { SkyBox } from './SkyBox';

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
