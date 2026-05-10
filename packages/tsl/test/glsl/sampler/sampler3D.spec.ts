import { describe, expect, it } from 'vitest';
import { sampler3D, Sampler3D } from '../../../src/glsl/sampler/sampler3D';
import { uniform } from '../../../src/variables/uniform';

describe('Sampler3D', () =>
{
    it('应该创建正确的 Sampler3D 实例', () =>
    {
        const s = sampler3D(uniform('volumeTexture'));

        expect(s).toBeInstanceOf(Sampler3D);
        expect(s.uniform.name).toBe('volumeTexture');
    });

    it('应该生成正确的 GLSL 声明', () =>
    {
        const s = sampler3D(uniform('volumeTexture'));

        expect(s.toGLSL()).toBe('uniform sampler3D volumeTexture;');
    });

    it('应该生成正确的 WGSL 声明', () =>
    {
        const s = sampler3D(uniform('volumeTexture'));

        // Sampler3D 在 WGSL 中需要分别声明 texture 和 sampler
        const wgsl = s.toWGSL();
        expect(wgsl).toContain('volumeTexture_texture: texture_3d<f32>');
        expect(wgsl).toContain('volumeTexture: sampler');
    });
});

