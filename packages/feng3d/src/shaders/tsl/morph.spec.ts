import { describe, expect, it } from 'vitest';
import { getMorphPositionWGSL, getMorphUniformsWGSL, MORPH_TARGET_COUNT } from './morph';

/**
 * morph（顶点形变）的 TSL 着色器离线验收。
 *
 * 只断言"生成结果里有什么"，不跑 GPU：`u_morphPositions` 走 storage buffer（uniform 装不下——
 * 实测 Horse 796 顶点 × 15 target 需约 186KB），权重与顶点数走 uniform。
 */
describe('morph 的 TSL 着色器', () =>
{
    const uniforms = getMorphUniformsWGSL();
    const morph = getMorphPositionWGSL();

    it('uniforms：固定长度的权重数组 + 运行期长度的 storage buffer', () =>
    {
        expect(uniforms).toContain('u_morphWeights: array<f32, ' + MORPH_TARGET_COUNT + '>');
        expect(uniforms).toContain('u_morphVertexCount: u32');
        // morph 并入 group 0（标准管线已占 0–3，maxBindGroups 是 4，不能再开 group 4）
        expect(uniforms).toContain('@group(0) @binding(7) var<storage, read> u_morphPositions: array<vec4<f32>>;');
    });

    it('morphPosition：按 target 遍历、以 targetIndex * vertexCount + vertexIndex 索引 delta', () =>
    {
        expect(morph).toContain('fn morphPosition(');
        expect(morph).toContain('for (var i = 0; i < ' + MORPH_TARGET_COUNT + '; i = i + 1)');
        expect(morph).toContain('u_morphWeights[i]');
        expect(morph).toContain('u_morphPositions[');
        // 顶点位置加权累加后写回
        expect(morph).toContain('morphDelta');
    });
});
