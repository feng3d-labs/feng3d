/**
 * DebugShadowMapMaterial 的 TSL 着色器离线验收。
 *
 * 该材质是 feng3d 侧**最后一个**内联手写 WGSL 的材质（原 textureVertexWGSL +
 * debugShadowMapFragmentWGSL 两段字符串）。这里用"与手写逐句对照"验收。
 */
import { describe, expect, it } from 'vitest';
import { getDebugShadowMapShaderWGSL } from './debugShadowMapMaterial';

describe('DebugShadowMapMaterial 的 TSL 着色器', () =>
{
    const shader = getDebugShadowMapShaderWGSL();

    it('顶点：标准变换 + uv 传递', () =>
    {
        expect(shader.vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(shader.vertex).toContain('@location(3) a_uv: vec2<f32>');
        expect(shader.vertex).toContain('let worldPosition = transform.u_modelMatrix * vec4<f32>(a_position, 1.0);');
        expect(shader.vertex).toContain('output.position = cameraUniforms.u_viewProjection * worldPosition;');
        expect(shader.vertex).toContain('output.uv = a_uv;');
    });

    it('片元：深度纹理**只**声明 texture_depth_2d（不带占位 sampler）', () =>
    {
        expect(shader.fragment).toContain('var s_texture_texture: texture_depth_2d;');
        // 手写里那个 s_textureSampler 只是占位（textureLoad 不使用它），TSL 不生成
        expect(shader.fragment).not.toContain('var s_textureSampler');
    });

    it('片元：uv 翻转 Y + 整数 texel 坐标 + textureLoad', () =>
    {
        expect(shader.fragment).toContain('let flippedY = 1.0 - input.uv.y;');
        expect(shader.fragment).toContain('let texel = vec2<u32>(u32(texelX), u32(texelY));');
        expect(shader.fragment).toContain('var depth = textureLoad(s_texture_texture, texel, 0u);');
    });

    it('片元：NaN 安全的钳制与手写等价', () =>
    {
        // 手写：if (!(depth >= 0.0)) depth = 0.0;  if (!(depth <= 1.0)) depth = 1.0;
        // WGSL 的 select(f, t, cond)：cond 为 false 时取 f。
        // '>=' 对 NaN 为 false，所以 NaN → 0，与手写一致。
        expect(shader.fragment).toContain('depth = select(0.0, depth, depth >= 0.0);');
        expect(shader.fragment).toContain('depth = select(1.0, depth, depth <= 1.0);');
        expect(shader.fragment).toContain('return vec4<f32>(depth, depth, depth, 1.0);');
    });
});
