import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { serialize } from '../../serialization/Serialization';
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

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
    }
}
