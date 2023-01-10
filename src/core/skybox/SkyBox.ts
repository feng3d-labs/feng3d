import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';
import { Component3D } from '../core/Component3D';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { TextureCube } from '../textures/TextureCube';

declare module '../../ecs/Component'
{
    interface ComponentMap
    {
        SkyBox: SkyBox;
    }
}

/**
 * 天空盒组件
 */
@AddComponentMenu('SkyBox/SkyBox')
@RegisterComponent({ name: 'SkyBox' })
export class SkyBox extends Component3D
{
    declare __class__: 'SkyBox';

    // /**
    //  * The material used by the skybox.
    //  */
    // @SerializeProperty()
    // material: Material;

    @SerializeProperty()
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyBoxTexture = TextureCube.default;

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.s_skyBoxTexture = () => this.s_skyBoxTexture;
    }
}
