import { describe, expect, it } from 'vitest';
import { getParticleShaderWGSL } from './particleMaterial';

/**
 * 粒子着色器（TSL 构建）的回归断言。
 *
 * 粒子画面本身带随机性（发射方向由 Math.random 抽取），无法用截图严格对比；
 * 这里钉住着色器文本的关键结构：实例属性入口、mat3x3 公告牌矩阵、采样器展开命名与 UV 变换。
 */
describe('particleMaterial（TSL 构建）', () =>
{
    it('顶点着色器声明全部粒子实例属性与 mat3x3 公告牌矩阵', () =>
    {
        const { vertex } = getParticleShaderWGSL();

        for (const name of ['a_particle_position', 'a_particle_scale', 'a_particle_rotation', 'a_particle_color', 'a_particle_tilingOffset', 'a_particle_flipUV'])
        {
            expect(vertex).toContain(name);
        }
        expect(vertex).toContain('@location(4)');
        expect(vertex).toContain('@location(9)');
        expect(vertex).toContain('u_particle_billboardMatrix: mat3x3<f32>');
        expect(vertex).toContain('u_modelMatrix: mat4x4<f32>');
    });

    it('顶点着色器包含 YXZ 旋转矩阵函数与翻转 / 平铺 UV 逻辑', () =>
    {
        const { vertex } = getParticleShaderWGSL();

        expect(vertex).toContain('fn makeParticleRotationMatrix(');
        expect(vertex).toContain('sin(');
        expect(vertex).toContain('cos(');
        expect(vertex).toContain('.xy');
        expect(vertex).toContain('.zw');
    });

    it('片段着色器按 TSL 展开命名采样纹理，并逐分量乘颜色与色调', () =>
    {
        const { fragment } = getParticleShaderWGSL();

        expect(fragment).toContain('s_texture_texture');
        expect(fragment).toContain('var s_texture: sampler');
        expect(fragment).toContain('textureSample(');
        expect(fragment).toContain('u_TintColor');
    });
});
