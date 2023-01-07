import { oav } from '../../../objectview/ObjectView';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { TextureCube } from '../../textures/TextureCube';
import { Material } from '../Material';
import skyboxFragment from './skybox_fragment_glsl';
import skyboxVertex from './skybox_vertex_glsl';

declare module '../Material' { interface MaterialMap { skybox: SkyBoxMaterial } }

@Serializable('SkyBoxMaterial')
export class SkyBoxMaterial extends Material
{
    constructor()
    {
        super();
        this.shader.shaderName = 'skybox';
    }
}

@Serializable('SkyBoxUniforms')
export class SkyBoxUniforms
{
    declare __class__: 'SkyBoxUniforms';

    @SerializeProperty()
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyBoxTexture = TextureCube.default;
}

shaderlib.shaderConfig.shaders.skybox = {
    fragment: skyboxFragment,
    vertex: skyboxVertex,
};
