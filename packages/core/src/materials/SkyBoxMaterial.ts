import { oav } from '@feng3d/objectview';
import { shaderlib } from '../render/data/ShaderLib';
import { serialize } from '@feng3d/serialization';
import { TextureCube } from '../textures/TextureCube';
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

shaderlib.shaderConfig.shaders.skybox = { cls: SkyBoxUniforms };
