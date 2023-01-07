import { Color3 } from '../../math/Color3';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { shaderlib } from '../../renderer/shader/ShaderLib';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Material } from '../materials/Material';
import { Texture2D } from '../textures/Texture2D';
import waterFragment from './water_fragment_glsl';
import waterVertex from './water_vertex_glsl';

declare module '../materials/Material'
{
    interface MaterialMap
    {
        water: WaterMaterial
    }

    interface DefaultMaterialMap
    {
        'Water-Material': WaterMaterial;
    }
}

@Serializable('WaterMaterial')
export class WaterMaterial extends Material
{
    constructor()
    {
        super();
        this.shader.shaderName = 'water';
    }
}

@Serializable('WaterUniforms')
export class WaterUniforms
{
    declare __class__: 'WaterUniforms';

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
    s_normalSampler = Texture2D.default;

    /**
     * 镜面反射贴图
     */
    @oav()
    // s_mirrorSampler = new RenderTargetTexture2D();
    s_mirrorSampler = Texture2D.default;

    u_textureMatrix = new Matrix4x4();
    u_sunColor = new Color3().fromUnit(0x7F7F7F);
    u_sunDirection = new Vector3(0.70707, 0.70707, 0);
}

shaderlib.shaderConfig.shaders.water = {
    vertex: waterVertex,
    fragment: waterFragment,
};

Material.setDefault('Water-Material', new WaterMaterial());
