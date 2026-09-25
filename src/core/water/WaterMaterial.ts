import { Color3 } from '../../math/Color3';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { shaderlib } from '../../renderer/shader/ShaderLib';
import { serialize } from '../../serialization/Serialization';
import { Material } from '../materials/Material';
import waterFragment from '../shaders/water.fragment.glsl';
import waterVertex from '../shaders/water.vertex.glsl';
import { Texture2D } from '../textures/Texture2D';

declare global
{
    export interface MixinsUniformsTypes { water: WaterUniforms }

    export interface MixinsDefaultMaterial
    {
        'Water-Material': Material;
    }
}

@decoratorRegisterClass()
export class WaterUniforms
{
    __class__: 'WaterUniforms';

    @serialize
    @oav({ tooltip: '透明度' })
    u_alpha = 1.0;

    /**
     * 水体运动时间，默认自动递增
     */
    // @serialize
    // @oav({ tooltip: "水体运动时间，默认自动递增" })
    u_time = 0.0;

    @serialize
    @oav({ tooltip: '水体展现的尺寸' })
    u_size = 10.0;

    @oav()
    @serialize
    u_distortionScale = 20.0;

    @serialize
    @oav({ tooltip: '水体颜色' })
    u_waterColor = new Color3().fromUnit(0x555555);

    @oav()
    @serialize
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

shaderlib.shaderConfig.shaders.water = { fragment: waterFragment, vertex: waterVertex, cls: WaterUniforms };

Material.setDefault('Water-Material', { shaderName: 'water' });
