import skyboxFragment from '../shaders/skybox.fragment.glsl';
import skyboxVertex from '../shaders/skybox.vertex.glsl';
import { TextureCube } from '../textures/TextureCube';

declare global
{
    export interface MixinsUniformsTypes { skybox: SkyBoxUniforms }
}

@decoratorRegisterClass()
export class SkyBoxUniforms
{
    __class__: 'SkyBoxUniforms';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;
}

shaderlib.shaderConfig.shaders.skybox = { fragment: skyboxFragment, vertex: skyboxVertex, cls: SkyBoxUniforms };
