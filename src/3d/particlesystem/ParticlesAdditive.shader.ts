import { AssetData } from '../../core/AssetData';
import { Material, RegisterMaterial } from '../../core/Material';
import { Color4 } from '../../math/Color4';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '@feng3d/objectview';
import { Serializable } from '@feng3d/serialization';
import { $set } from '@feng3d/serialization';
import { SerializeProperty } from '@feng3d/serialization';

declare module '../../core/Material'
{
    interface MaterialMap { ParticleMaterial: ParticleMaterial }
    interface UniformsMap { ParticlesAdditiveUniforms: ParticlesAdditiveUniforms }
    interface DefaultMaterialMap { 'Particle-Material': Material }
}

@RegisterMaterial('ParticleMaterial')
export class ParticleMaterial extends Material
{
    uniforms = new ParticlesAdditiveUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'Particles_Additive';
        $set(this.renderParams, {
            enableBlend: true,
            sfactor: 'SRC_ALPHA',
            dfactor: 'ONE',
            colorMask: [true, true, true, false],
            cullFace: 'NONE',
            depthMask: false,
        });
    }
}

/**
 * UnityShader "Particles/Additive"
 */
@Serializable('ParticlesAdditiveUniforms')
export class ParticlesAdditiveUniforms
{
    declare __class__: 'ParticlesAdditiveUniforms';

    @SerializeProperty()
    @oav()
    _TintColor = new Color4(0.5, 0.5, 0.5, 0.5);

    /**
     * 粒子贴图
     */
    @SerializeProperty()
    @oav({ tooltip: '粒子贴图' })
    _MainTex = AssetData.getDefaultAssetData('Default-ParticleTexture');

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
    _InvFade = 1.0;
}

Material.setDefault('Particle-Material', () => new ParticleMaterial());
