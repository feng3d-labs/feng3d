import { describe, expect, it } from 'vitest';
import { getStandardMorphVertexWGSL, getStandardVertexWGSL } from './standardVertex';

/**
 * morph 顶点变体的**声明完整性**回归。
 *
 * 背景：TSL 的依赖分析没有把 `morphPosition` 用到的 `morph` uniform 收集进来——
 * 生成结果里有 `morph.u_morphWeights[i]` 的引用却没有声明，WGSL 编译失败且**静默**
 * （示例里表现为"动物完全不可见、控制台无错"）。这里把"引用了就必须有声明"钉住。
 */
describe('standardVertex 的 morph 变体', () =>
{
    it('既引用 morph.u_morphWeights，也声明了 morph uniform 与 storage buffer', () =>
    {
        const wgsl = getStandardMorphVertexWGSL();

        expect(wgsl).toContain('morph.u_morphWeights[i]');
        expect(wgsl).toContain('struct MorphUniforms');
        expect(wgsl).toContain('@group(4) @binding(0) var<uniform> morph: MorphUniforms;');
        // TSL 生成的 attribute 顺序是 binding 在前
        expect(wgsl).toContain('@binding(1) @group(4) var<storage, read> u_morphPositions: array<vec4<f32>>;');
        // 声明只出现一次（不能因为前置拼接而重复）
        expect(wgsl.split('var<uniform> morph: MorphUniforms;').length).toBe(2);
        // struct 只声明一次：TSL 自己会生成，前置段只补那一行 var<uniform>
        expect(wgsl.split('struct MorphUniforms').length).toBe(2);
    });

    it('标准变体不受影响（无 morph 声明、无 vertex_index）', () =>
    {
        const wgsl = getStandardVertexWGSL();

        expect(wgsl).not.toContain('MorphUniforms');
        expect(wgsl).not.toContain('u_morphPositions');
        expect(wgsl).not.toContain('vertex_index');
    });
});
