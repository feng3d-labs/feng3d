import { Material, Texture2D } from '@feng3d/core';
import { Color4, Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderConfig } from '@feng3d/renderer';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';

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

@decoratorRegisterClass()
export class ParticleMaterial extends Material
{
    uniforms = new ParticlesAdditiveUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'Particles_Additive';
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
    sfactor: 'SRC_ALPHA',
    dfactor: 'ONE',
    colorMask: [true, true, true, false],
    cullFace: 'NONE',
    depthMask: false,
};

Material.setDefault('Particle-Material', new ParticleMaterial());
