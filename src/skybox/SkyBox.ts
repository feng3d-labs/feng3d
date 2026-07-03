import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { RenderObject, TextureView } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Component, RegisterComponent } from '../component/Component';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { TextureCube } from '../textures/TextureCube';

declare global
{
    export interface MixinsComponentMap
    {
        SkyBox: SkyBox;
    }
}

/**
 * 天空盒组件
 */
@AddComponentMenu('SkyBox/SkyBox')
@RegisterComponent()
@decoratorRegisterClass()
export class SkyBox extends Component
{
    __class__: 'SkyBox';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;

    beforeRender(renderObject: RenderObject, _scene: Scene, _camera: Camera)
    {
        reactive(renderObject.bindingResources).s_skyboxTexture = { texture: this.s_skyboxTexture.texture } as TextureView;
    }
}
