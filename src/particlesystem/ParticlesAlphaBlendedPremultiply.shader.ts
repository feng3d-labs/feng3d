import { Texture2D } from '../core/textures/Texture2D';
import { Vector4 } from '../math/geom/Vector4';
import { oav } from '../objectview/ObjectView';
import { shaderConfig } from '../renderer/shader/ShaderLib';
import { Serializable } from '../serialization/Serializable';
import { SerializeProperty } from '../serialization/SerializeProperty';

/**
 * UnityShader "Particles/Alpha Blended Premultiply"
 */
@Serializable('ParticlesAlphaBlendedPremultiplyUniforms')
export class ParticlesAlphaBlendedPremultiplyUniforms
{
    declare __class__: 'ParticlesAlphaBlendedPremultiplyUniforms';

    /**
     * 粒子贴图
     */
    @SerializeProperty()
    @oav({ tooltip: '粒子贴图' })
    _MainTex = Texture2D.defaultParticle;

    /**
     * 粒子贴图使用的UV变换
     */
    @SerializeProperty()
    @oav({ tooltip: '粒子贴图使用的UV变换' })
    _MainTex_ST = new Vector4(1, 1, 0, 0);

    /**
     * @todo
     */
    @SerializeProperty()
    @oav()
    u_softParticlesFactor = 1.0;
}

shaderConfig.shaders['Particles_AlphaBlendedPremultiply'].cls = ParticlesAlphaBlendedPremultiplyUniforms;
shaderConfig.shaders['Particles_AlphaBlendedPremultiply'].renderParams = {
    enableBlend: true,
    sfactor: 'ONE',
    dfactor: 'ONE_MINUS_SRC_ALPHA',
    colorMask: [true, true, true, false],
    cullFace: 'NONE',
    depthMask: false,
};
