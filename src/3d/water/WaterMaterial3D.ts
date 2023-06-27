import { AssetData } from '../../core/AssetData';
import { Material } from '../../core/Material';
import { Color3 } from '../../math/Color3';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '../../renderer/shader/ShaderLib';
import { Serializable } from '@feng3d/serialization';
import { SerializeProperty } from '@feng3d/serialization';
import waterFragment from './water_fragment_glsl';
import waterVertex from './water_vertex_glsl';

declare module '../../core/Material'
{
    interface MaterialMap { Water3DMaterial: Water3DMaterial }
    interface UniformsMap { Water3DUniforms: Water3DUniforms }

    interface DefaultMaterialMap
    {
        'Water-Material': Water3DMaterial;
    }
}

@Serializable('Water3DMaterial')
export class Water3DMaterial extends Material
{
    constructor()
    {
        super();
        this.shader.shaderName = 'water';
    }
}

@Serializable('Water3DUniforms')
export class Water3DUniforms
{
    declare __class__: 'Water3DUniforms';

    @SerializeProperty()
    @oav({ tooltip: '透明度' })
    u_alpha = 1.0;

    /**
     * 水体运动时间，默认自动递增
     */
    // @SerializeProperty()
    // @oav({ tooltip: "水体运动时间，默认自动递增" })
    u_time = 0.0;

    @SerializeProperty()
    @oav({ tooltip: '水体展现的尺寸' })
    u_size = 10.0;

    @oav()
    @SerializeProperty()
    u_distortionScale = 20.0;

    @SerializeProperty()
    @oav({ tooltip: '水体颜色' })
    u_waterColor = new Color3().fromUnit(0x555555);

    @oav()
    @SerializeProperty()
    @oav({ tooltip: '水体法线图' })
    s_normalSampler = AssetData.getDefaultAssetData('Default-Texture');

    /**
     * 镜面反射贴图
     */
    @oav()
    // s_mirrorSampler = new RenderTargetTexture2D();
    s_mirrorSampler = AssetData.getDefaultAssetData('Default-Texture');

    u_textureMatrix = new Matrix4x4();
    u_sunColor = new Color3().fromUnit(0x7F7F7F);
    u_sunDirection = new Vector3(0.70707, 0.70707, 0);
}

shaderlib.shaderConfig.shaders.water = {
    vertex: waterVertex,
    fragment: waterFragment,
};

Material.setDefault('Water-Material', () => new Water3DMaterial());
