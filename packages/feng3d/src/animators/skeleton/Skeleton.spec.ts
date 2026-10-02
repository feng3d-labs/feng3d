import { describe, expect, it } from 'vitest';
import { mat4FromPosition, mat4Identity, Matrix4x4 } from '@feng3d/math';
import { logic } from '@feng3d/reactivity';

// 触发 registerLogic 注册（否则 logic() 返回 null）
import '../../core/Object3D';
import './Skeleton';

import type { Object3D } from '../../core/Object3D';
import type { Entity } from '../../core/Entity';
import type { Skeleton, SkeletonLogic } from './Skeleton';

/**
 * issue #333：`SkeletonLogic.globalMatrices` 此前**从未被计算**。
 *
 * 它被初始化为 `[]` 之后再也没有写入，而 `SkinnedMeshRendererLogic.beforeRender` 每帧把它写进
 * `u_skeletonGlobalMatriices`——于是挂了 `Skeleton` 的模型拿到的是空/占位矩阵，骨骼变换不生效。
 * 迁移前的旧实现（`src/core/animators/skeleton/SkeletonComponent.ts:33-44`）里这段循环是有的。
 *
 * 语义：`globalMatrices[i] = boneInverses[i] × 骨骼 i 的世界矩阵`。
 * 注意 `copy(世界矩阵).prepend(逆矩阵)` 得到的是 `逆矩阵 × 世界矩阵`（`prepend` 是**左乘**）。
 *
 * 这些用例**不需要 GPU**：只构造纯数据骨骼树与逆矩阵，断言算出来的矩阵。
 */
function makeObject3D(name: string, extra: Record<string, unknown> = {}): Object3D
{
    return { __type__: 'Object3D', name, ...extra } as Object3D;
}

function makeSkeleton(boneNames: string[], boneInverses: Matrix4x4[]): Skeleton
{
    return { __type__: 'Skeleton', boneNames, boneInverses } as Skeleton;
}

/**
 * 单位矩阵（阶段 C-e 起 `Matrix4x4` 是纯数据接口，`new Matrix4x4().identity()` 换成显式装配）。
 */
function identityMatrix(): Matrix4x4
{
    return { __type__: 'Matrix4x4', ...mat4Identity() };
}

/** 平移矩阵（同上，`Matrix4x4.fromPosition` 的纯数据装配形态） */
function positionMatrix(x: number, y: number, z: number): Matrix4x4
{
    return { __type__: 'Matrix4x4', ...mat4FromPosition(x, y, z) };
}

/** 矩阵的平移分量（Matrix4x4 是列主序，elements[12..14] 是平移） */
function translationOf(m: Matrix4x4): number[]
{
    const e = m.elements;

    return [e[12], e[13], e[14]];
}

/** 消掉浮点尾差，便于 toEqual 精确比较 */
function rounded(v: number[]): number[]
{
    return v.map((x) => Math.round(x * 1e6) / 1e6);
}

describe('SkeletonLogic.globalMatrices（issue #333）', () =>
{
    it('乘法顺序被钉死：prepend 在本仓是右乘（与迁移前的旧实现同序）', () =>
    {
        // 骨骼自身无平移、但绕 Z 转 90°：用来区分乘法顺序（纯平移下两种顺序结果相同、区分不了）
        // 注意 `rotation` 的单位是**弧度**——写 90 会被当成 90 rad（≈5156°），与直觉相差极大
        const bone = makeObject3D('bone0', { rotation: { x: 0, y: 0, z: Math.PI / 2 } });
        const root = makeObject3D('root', { children: [bone] });

        // 先建父的 logic，让 children→parent 的同步 effect 建立（见 Object3D.spec.ts 的约定）
        logic(root);
        logic(bone);

        const skeletonLogic = logic(makeSkeleton(['bone0'], [positionMatrix(1, 0, 0)])) as SkeletonLogic;

        skeletonLogic.init(root as unknown as Entity);
        const gm = skeletonLogic.globalMatrices;

        expect(gm.length).toBe(1);

        // 期望 (0,1,0) 而不是 (1,0,0)——这是**实测**出来的结论，也是本用例的价值所在：
        // 本仓库的 `Matrix4x4.prepend(rhs)` 实际是**右乘**（`A.prepend(B)` = `A × B`；它的实现是
        // `copy(rhs).append(原值)`，而 `X.append(Y)` 得到 `Y × X`），与"prepend=左乘"的直觉相反。
        // 所以 `copy(世界矩阵).prepend(逆矩阵)` 真正生效的是 `逆矩阵 × 世界矩阵`：原点先被平移 (1,0,0)，
        // 再被骨骼的绕 Z 90° 旋到 (0,1,0)。
        // 这条断言把顺序钉死：一旦有人"顺手"把 prepend 改成 append，它会立刻失败。
        expect(rounded(translationOf(gm[0]))).toEqual([0, 1, 0]);
    });

    it('父子层级生效：子骨骼的世界矩阵含父的位移', () =>
    {
        const child = makeObject3D('child', { position: { x: 1, y: 0, z: 0 } });
        const parent = makeObject3D('parent', { position: { x: 10, y: 0, z: 0 }, children: [child] });
        const root = makeObject3D('root', { children: [parent] });

        logic(root);
        logic(parent);
        logic(child);

        // 逆矩阵取单位阵时，globalMatrices[0] 应等于 child 的世界矩阵 → 平移为 10 + 1
        const skeletonLogic = logic(makeSkeleton(['child'], [identityMatrix()])) as SkeletonLogic;

        skeletonLogic.init(root as unknown as Entity);

        expect(rounded(translationOf(skeletonLogic.globalMatrices[0]))).toEqual([11, 0, 0]);
    });

    it('输出顺序与 boneNames 一致（不是按树里的遍历顺序）', () =>
    {
        const a = makeObject3D('a', { position: { x: 1, y: 0, z: 0 } });
        const b = makeObject3D('b', { position: { x: 2, y: 0, z: 0 } });
        const root = makeObject3D('root', { children: [a, b] });

        logic(root);
        logic(a);
        logic(b);

        // 故意把 b 排在前面
        const skeletonLogic = logic(makeSkeleton(['b', 'a'], [identityMatrix(), identityMatrix()])) as SkeletonLogic;

        skeletonLogic.init(root as unknown as Entity);
        const gm = skeletonLogic.globalMatrices;

        expect(translationOf(gm[0])[0]).toBeCloseTo(2, 5);
        expect(translationOf(gm[1])[0]).toBeCloseTo(1, 5);
    });

    it('骨骼名字找不到时不崩：该位保持单位矩阵', () =>
    {
        const root = makeObject3D('root');

        logic(root);

        const skeletonLogic = logic(makeSkeleton(['not-exist'], [positionMatrix(5, 0, 0)])) as SkeletonLogic;

        skeletonLogic.init(root as unknown as Entity);

        // 旧实现会在 `undefined.transform` 上抛错；这里要求安静地退回单位矩阵
        expect(() => skeletonLogic.globalMatrices).not.toThrow();
        expect(translationOrZero(skeletonLogic.globalMatrices[0])).toEqual([0, 0, 0]);
    });

    it('boneInverses 比 boneNames 短时不崩', () =>
    {
        const bone = makeObject3D('bone0', { position: { x: 3, y: 0, z: 0 } });
        const root = makeObject3D('root', { children: [bone] });

        logic(root);
        logic(bone);

        const skeletonLogic = logic(makeSkeleton(['bone0'], [])) as SkeletonLogic;

        skeletonLogic.init(root as unknown as Entity);
        expect(() => skeletonLogic.globalMatrices).not.toThrow();
        // 逆矩阵缺失 → 与"保持单位矩阵"同一兜底
        expect(translationOrZero(skeletonLogic.globalMatrices[0])).toEqual([0, 0, 0]);
    });

    it('没有 entity（未 init）时返回空数组而不是抛错', () =>
    {
        const skeletonLogic = logic(makeSkeleton(['bone0'], [identityMatrix()])) as SkeletonLogic;

        expect(() => skeletonLogic.globalMatrices).not.toThrow();
        expect(skeletonLogic.globalMatrices).toEqual([]);
    });
});

/** 取某位的平移分量；该位可能尚未创建（数组长度对齐后才有），返回零向量等价物 */
function translationOrZero(m: Matrix4x4 | undefined): number[]
{
    return m ? rounded(translationOf(m)) : [0, 0, 0];
}
