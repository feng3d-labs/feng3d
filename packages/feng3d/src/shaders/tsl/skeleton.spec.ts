import { describe, expect, it } from 'vitest';
import { getSkinningWGSL, getSkeletonUniformsWGSL, SKIN_MATRIX_COUNT } from './skeleton';

/**
 * 蒙皮 TSL 定义的离线验收（issue #337 / #711）。
 *
 * 这份用例是 **文件级 WGSL 迁移**的验收：迁移前的手写片段
 * `shaders/modules/skeleton.wgsl.ts` 已删除，内容由 TSL 生成。
 */
describe('蒙皮 TSL 定义', () =>
{
    const uniforms = getSkeletonUniformsWGSL();
    const skinning = getSkinningWGSL();

    it('uniform 声明为 group(3) binding(0)，数组长度用 SKIN_MATRIX_COUNT', () =>
    {
        expect(uniforms).toContain('struct SkinnedUniforms');
        expect(uniforms).toContain(`u_skeletonGlobalMatriices: array<mat4x4<f32>, ${SKIN_MATRIX_COUNT}>`);
        expect(uniforms).toContain('@group(3) @binding(0) var<uniform> skinned: SkinnedUniforms;');
    });

    it('函数签名保留 5 个参数（两组骨骼属性）', () =>
    {
        expect(skinning).toContain('fn skinPosition(');
        expect(skinning).toContain('position: vec4<f32>');
        expect(skinning).toContain('skinIndices: vec4<f32>');
        expect(skinning).toContain('skinWeights: vec4<f32>');
        expect(skinning).toContain('skinIndices1: vec4<f32>');
        expect(skinning).toContain('skinWeights1: vec4<f32>');
    });

    it('用 for 循环 + 动态索引累加（与手写片段逐行对应）', () =>
    {
        expect(skinning).toContain('let weightSum = skinWeights.x + skinWeights.y + skinWeights.z + skinWeights.w');
        expect(skinning).toContain('if (weightSum <= 0.0)');
        expect(skinning).toContain('return position;');
        expect(skinning).toContain('var totalPosition = vec4<f32>(0.0, 0.0, 0.0, 1.0);');
        expect((skinning.match(/for \(var i = 0; i < 4; i = i \+ 1\)/g) ?? []).length).toBe(2);
        expect(skinning).toContain('skinned.u_skeletonGlobalMatriices[i32(skinIndices[i])] * position * skinWeights[i]');
        expect(skinning).toContain('skinned.u_skeletonGlobalMatriices[i32(skinIndices1[i])] * position * skinWeights1[i]');
        expect(skinning).toContain('return vec4<f32>(totalPosition.xyz, position.w);');
    });

    it('结果被缓存（两次拿到同一个字符串）', () =>
    {
        expect(getSkeletonUniformsWGSL()).toBe(uniforms);
        expect(getSkinningWGSL()).toBe(skinning);
    });
});
