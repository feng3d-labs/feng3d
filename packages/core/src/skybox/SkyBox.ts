import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { RenderObject } from '@feng3d/webgpu';
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

    // /**
    //  * The material used by the skybox.
    //  */
    // @serialize
    // material: Material;

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;

    beforeRender(renderObject: RenderObject, _scene: Scene, _camera: Camera)
    {
        renderObject.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
    }
}
