import { defaultParticleTexture } from 'feng3d';
import { type Color4, Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';

declare global
{
    export interface MixinsUniformsTypes
    {
        Particles_Additive: ParticlesAdditiveUniforms
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
    // 阶段 C-b 起 math 的 `Color4` class 已删除，颜色在装配点写字面量（等于原 `new Color4(0.5, 0.5, 0.5, 0.5)`）
    _TintColor: Color4 = { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 0.5 };

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
    _InvFade = 1.0;
}

// TODO: 粒子材质尚未重构，暂用 StandardMaterial 占位注册
