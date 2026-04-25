import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { TextureCube } from '../textures/TextureCube';
import skyboxVertex from '../shaders/skybox.vertex.glsl';
import skyboxFragment from '../shaders/skybox.fragment.glsl';
import { decoratorRegisterClass } from '@feng3d/polyfill';

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
