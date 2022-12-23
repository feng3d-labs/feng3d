import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';
import { TextureCube } from '../../textures/TextureCube';
import { Material } from '../Material';
import skyboxFragment from './skybox_fragment_glsl';
import skyboxVertex from './skybox_vertex_glsl';

declare global
{
    export interface MixinsMaterialMap
    {
        skybox: SkyBoxMaterial
    }
}

@decoratorRegisterClass()
export class SkyBoxMaterial extends Material
{
    constructor()
    {
        super();
        this.shader.shaderName = 'skybox';
    }
}

@decoratorRegisterClass()
export class SkyBoxUniforms
{
    __class__: 'SkyBoxUniforms';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyBoxTexture = TextureCube.default;
}

shaderlib.shaderConfig.shaders.skybox = {
    fragment: skyboxFragment,
    vertex: skyboxVertex,
    cls: SkyBoxUniforms
};
