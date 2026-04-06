import { Material, StandardUniforms, Texture2D } from '@feng3d/core';
import { Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { shaderConfig } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';

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
