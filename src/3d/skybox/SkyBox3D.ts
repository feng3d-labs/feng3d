import { RegisterComponent } from '@feng3d/ecs';
import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';

import { AssetData } from '../../core/AssetData';
import { TextureCube } from '../../textures/TextureCube';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Scene3D } from '../core/Scene3D';

declare module '@feng3d/ecs' { interface ComponentMap { SkyBox: SkyBox3D; } }

declare module '@feng3d/renderer'
{
    interface Uniforms
    {
        /**
         * 天空盒纹理
         */
        s_skyBoxTexture: TextureCube;
    }
}

/**
 * 天空盒组件
 */
@RegisterComponent({ name: 'SkyBox', menu: 'SkyBox/SkyBox' })
export class SkyBox3D extends Component3D
{
    declare __class__: 'SkyBox';

    // /**
    //  * The material used by the skybox.
    //  */
    // @SerializeProperty()
    // material: Material;

    @SerializeProperty()
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyBoxTexture = AssetData.getDefaultAssetData('Default-TextureCube');

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera3D)
    {
        renderAtomic.uniforms.s_skyBoxTexture = () => this.s_skyBoxTexture;
    }
}
