import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGLB } from '../src/loaders/GLTFLoader';

/**
 * glTF morph target（形变目标）的解析。
 *
 * `webgl_shadowmap` 阶段 C 的 4 个动物模型是 three 经典的 **morph 动画**（不是骨骼蒙皮）：
 * 顶点形变 + 逐帧改权重。这批先落地"解析出每 target 的 POSITION delta"。
 */
function load(name: string)
{
    const buffer = readFileSync(new URL(`../../../examples/resources/${name}.glb`, import.meta.url));

    return parseGLB(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

describe('glTF morph target 的解析', () =>
{
    it('Horse.glb：15 个 target，每个 delta 与顶点数对齐、初始权重全 0', () =>
    {
        const result = load('Horse');

        expect(result.primitives).toHaveLength(1);
        const prim = result.primitives[0];
        expect(prim.morphTargets).toHaveLength(15);
        for (const target of prim.morphTargets)
        {
            expect(target).toHaveLength(prim.vertexCount * 3);
        }
        expect(prim.morphWeights).toHaveLength(15);
        expect(prim.morphWeights.every((w) => w === 0)).toBe(true);
        // delta 真的读出来了（不是整片补零）
        expect(prim.morphTargets.some((target) => target.some((v) => v !== 0))).toBe(true);
    });

    it('四个动物模型都带 morph target，权重长度与之一致', () =>
    {
        for (const name of ['Horse', 'Flamingo', 'Stork', 'Parrot'])
        {
            const prim = load(name).primitives[0];
            expect(prim.morphTargets.length, `${name} 应有 morph target`).toBeGreaterThan(0);
            expect(prim.morphWeights).toHaveLength(prim.morphTargets.length);
        }
    });

    it('无 targets 的资源不产出 morph 字段（collision-world.glb 不回归）', () =>
    {
        const prim = load('collision-world').primitives[0];
        expect(prim.morphTargets).toEqual([]);
        expect(prim.morphWeights).toEqual([]);
    });
});
