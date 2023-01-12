import { Material, RegisterMaterial } from '../../core/Material';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { $set } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Texture2D } from '../../textures/Texture2D';

declare module '../../core/Material'
{
    interface MaterialMap { ParticlesAlphaBlendedPremultiplyMaterial: ParticlesAlphaBlendedPremultiplyMaterial }
    interface UniformsMap { ParticlesAlphaBlendedPremultiplyUniforms: ParticlesAlphaBlendedPremultiplyUniforms }
}

@RegisterMaterial('ParticlesAlphaBlendedPremultiplyMaterial')
export class ParticlesAlphaBlendedPremultiplyMaterial extends Material
{
    constructor()
    {
        super();
        this.shader.shaderName = 'Particles_AlphaBlendedPremultiply';

        $set(this.renderParams, {
            enableBlend: true,
            sfactor: 'ONE',
            dfactor: 'ONE_MINUS_SRC_ALPHA',
            colorMask: [true, true, true, false],
            cullFace: 'NONE',
            depthMask: false,
        });
    }
}

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
