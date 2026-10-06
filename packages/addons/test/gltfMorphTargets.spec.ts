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

    it('weights 通道产出 Numbers 曲线，path 指向 Renderable.morphWeights', () =>
    {
        const result = load('Horse');
        const clip = result.animationClips.find((c) => c.propertyClips.some((pc) => pc.propertyName === 'morphWeights'));

        expect(clip).toBeTruthy();
        const weightClip = clip!.propertyClips.find((pc) => pc.propertyName === 'morphWeights')!;

        expect(weightClip.type).toBe('Numbers');
        // path 末项是「组件」项（PropertyClipPathItemType.Component === 1）
        const last = weightClip.path[weightClip.path.length - 1];
        expect(last[0]).toBe(1);
        //
        // 组件名必须用**基类型** `Renderable`，不能用 `MeshRenderer`：
        // `Animation.getPropertyHost` 是用 `matchType(component, 名字)` 解析宿主的，而 `matchType`
        // 只对**基类型名**命中子类型（内置层次表登记的是 Component / Behaviour / Renderable 这些基类型，
        // `MeshRenderer` 是叶子、没有反查项）。示例把渲染组件换成 `MorphMeshRenderer` 之后，
        // 写 `MeshRenderer` 就永远找不到宿主 —— morph 权重静默不写、形变完全静止。
        expect(last[1]).toBe('Renderable');
        // Horse 有 15 个 target：每帧 15 个权重
        expect(weightClip.values).toHaveLength(weightClip.times.length * 15);
        // getValue 返回该帧的切片（长度 = target 数）
        const frame = weightClip.getValue(weightClip.times[1]) as number[];
        expect(frame).toHaveLength(15);
    });

    it('morph 数据同时落到几何上（供渲染层转成 storage buffer）', () =>
    {
        const prim = load('Horse').primitives[0];

        expect(prim.geometry.morphTargets).toHaveLength(15);
        expect(prim.geometry.morphTargets![0]).toHaveLength(prim.vertexCount * 3);
        // 无 targets 的资源不多出这个字段
        expect(load('collision-world').primitives[0].geometry.morphTargets).toBeUndefined();
    });
});
