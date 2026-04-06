import { Material } from "../core/materials/Material";
import { Texture2D } from "../core/textures/Texture2D";
import { Color4 } from "../math/Color4";
import { Vector4 } from "../math/geom/Vector4";
import { oav } from "../objectview/ObjectView";
import { decoratorRegisterClass } from "../polyfill/ClassUtils";
import { BlendFactor } from "../renderer/gl/enums/BlendFactor";
import { ColorMask } from "../renderer/gl/enums/ColorMask";
import { CullFace } from "../renderer/gl/enums/CullFace";
import { shaderConfig } from "../renderer/shader/ShaderLib";
import { serialize } from "../serialization/Serialization";

declare global
{
    export interface MixinsUniformsTypes
    {
        Particles_Additive: ParticlesAdditiveUniforms
    }

    export interface MixinsDefaultMaterial
    {
        'Particle-Material': Material;
    }
}

/**
 * UnityShader "Particles/Additive"
 */
@decoratorRegisterClass()
export class ParticlesAdditiveUniforms
{
    __class__: 'ParticlesAdditiveUniforms';

    @serialize
    @oav()
    _TintColor = new Color4(0.5, 0.5, 0.5, 0.5);

    /**
     * 粒子贴图
     */
    @serialize
    @oav({ tooltip: '粒子贴图' })
    _MainTex = Texture2D.defaultParticle;

    /**
     * 粒子贴图使用的UV变换
     */
    @serialize
    @oav({ tooltip: '粒子贴图使用的UV变换' })
    _MainTex_ST = new Vector4(1, 1, 0, 0);

    /**
     * @todo
     */
    @serialize
    @oav()
    _InvFade = 1.0;
}

shaderConfig.shaders['Particles_Additive'].cls = ParticlesAdditiveUniforms;
shaderConfig.shaders['Particles_Additive'].renderParams = {
    enableBlend: true,
    sfactor: BlendFactor.SRC_ALPHA,
    dfactor: BlendFactor.ONE,
    colorMask: ColorMask.RGB,
    cullFace: CullFace.NONE,
    depthMask: false,
};

Material.setDefault('Particle-Material', { shaderName: 'Particles_Additive' });
