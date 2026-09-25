import { Material } from '../core/materials/Material';
import { StandardUniforms } from '../core/materials/StandardMaterial';
import { Texture2D } from '../core/textures/Texture2D';
import { Vector4 } from '../math/geom/Vector4';
import { oav } from '../objectview/ObjectView';
import { decoratorRegisterClass } from '../polyfill/ClassUtils';
import { shaderConfig } from '../renderer/shader/ShaderLib';
import { serialize } from '../serialization/Serialization';

declare global
{
    export interface MixinsUniformsTypes
    {
        terrain: TerrainUniforms
    }

    export interface MixinsDefaultMaterial
    {
        'Terrain-Material': Material;
    }
}

@decoratorRegisterClass()
export class TerrainUniforms extends StandardUniforms
{
    declare __class__: 'TerrainUniforms';

    @serialize
    @oav({ block: 'terrain' })
    s_splatTexture1 = Texture2D.default;

    @serialize
    @oav({ block: 'terrain' })
    s_splatTexture2 = Texture2D.default;

    @serialize
    @oav({ block: 'terrain' })
    s_splatTexture3 = Texture2D.default;

    @serialize
    @oav({ block: 'terrain' })
    s_blendTexture = Texture2D.default;

    @serialize
    @oav({ block: 'terrain' })
    u_splatRepeats = new Vector4(1, 1, 1, 1);
}

shaderConfig.shaders['terrain'].cls = TerrainUniforms;

Material.setDefault('Terrain-Material', { shaderName: 'terrain' });
