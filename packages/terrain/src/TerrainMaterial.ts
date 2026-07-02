import { Material, StandardMaterial, Texture2D } from '@feng3d/core';
import { Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';

declare global
{
    export interface MixinsDefaultMaterial
    {
        'Terrain-Material': Material;
    }
}

/**
 * 地形 uniform 数据（含 splat 混合纹理）。
 *
 * TODO: TerrainMaterial 尚未重构为 Material 子类，暂保留 uniform 数据声明。
 */
@decoratorRegisterClass()
export class TerrainUniforms
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

// TODO: TerrainMaterial 尚未重构为 Material 子类，暂用 StandardMaterial 占位注册
Material.setDefault('Terrain-Material', new StandardMaterial());
