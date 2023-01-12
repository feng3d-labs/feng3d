import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';
import { Component3D } from '../../3d/Component3D';
import { Scene3D } from '../../3d/Scene3D';
import { TextureCube } from '../textures/TextureCube';

declare module '../../ecs/Component' { interface ComponentMap { SkyBox: SkyBox; } }

/**
 * 天空盒组件
 */
@RegisterComponent({ name: 'SkyBox', menu: 'SkyBox/SkyBox' })
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

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera)
    {
        renderAtomic.uniforms.s_skyBoxTexture = () => this.s_skyBoxTexture;
    }
}
