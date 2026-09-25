import { defaultParticleTexture } from 'feng3d';
import { Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';

/**
 * UnityShader "Particles/Alpha Blended Premultiply"
 */
@decoratorRegisterClass()
export class ParticlesAlphaBlendedPremultiplyUniforms
{
    __class__: 'ParticlesAlphaBlendedPremultiplyUniforms';

    /**
     * 粒子贴图
     */
    @serialize
    @oav({ tooltip: '粒子贴图' })
    _MainTex = defaultParticleTexture;

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
    u_softParticlesFactor = 1.0;
}

// shader 注册（WGSL + uniforms 工厂 + 渲染状态）由 core 的 ShaderRegistry 集中管理。
