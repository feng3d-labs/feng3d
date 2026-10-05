import { describe, expect, it } from 'vitest';

import {
    mat4Copy,
    mat4Determinant,
    mat4FromArray,
    mat4FromPosition,
    mat4FromScale,
    mat4FromTRS,
    mat4GetAxisX,
    mat4GetAxisY,
    mat4GetAxisZ,
    mat4GetPosition,
    mat4GetScale,
    mat4Identity,
    mat4Invert,
    mat4SetPosition,
    mat4ToArray,
    mat4TransformPoint3,
    mat4TransformVector3,
    mat4TransformVector4,
    type Matrix4x4Like,
} from '../src/geom/matrix4x4';



/**
 * `Matrix4x4` 的不变式用例（issue #134 阶段 C-e 起 class 已删除，本文件改写为**纯函数形态**：
 * `mat4Identity().fromScale(…)` → `mat4FromScale(…)`、`m.determinant` → `mat4Determinant(m)`、
 * `m.transformPoint3(p)` → `mat4TransformPoint3(m, p)` …；断言逐条保留）。
 *
 * 断言都选**数学必然成立**的不变量，而不是"某个矩阵的第 7 个元素应该是多少"：
 *
 * - **单位矩阵**：`identity()` 的行列式为 1、变换任何点/向量都不变；
 * - **纯缩放**：`fromScale(sx, sy, sz)` 的**行列式 === sx·sy·sz**，且把 `(1,1,1)` 映到 `(sx,sy,sz)`；
 * - **纯平移**：`fromPosition(x,y,z)` 把**原点**映到 `(x,y,z)`，但**不影响 `transformVector3`**（向量无位置）；
 * - **可用 `setPosition` / `setScale` 读回**：`getPosition` / `getScale` 与构造值一致；
 * - **逆矩阵**：`invert()` 之后与原矩阵相乘应当近似单位矩阵；
 * - **数组往返**：`toArray` → `fromArray` 一致（含 `transpose` 语义的自洽）。
 *
 * ⚠️ **有意不测**：`fromAxisRotate` / `appendRotation` / `prependRotation` / `getRotation` /
 * `setRotation` 的**具体角度数值** —— 它们涉及 `RotationOrder` 的分支与角度单位，
 * 属于另一类工作。本文件只覆盖与旋转顺序无关的部分。
 */

const v3 = (x: number, y: number, z: number) => ({ x: x, y: y, z: z });

/** 取矩阵的 16 个元素（用 toArray 读出，避免依赖内部字段名） */
const arr16 = (m: Matrix4x4Like) => mat4ToArray(m) as number[];

/** 两个矩阵是否近似相等（逐元素） */
function expectMatrixClose(a: Matrix4x4Like, b: Matrix4x4Like, digits = 6)
{
    const x = arr16(a);
    const y = arr16(b);

    expect(x.length, '矩阵应展开为 16 个数').toBe(16);
    for (let i = 0; i < 16; i++)
    {
        expect(x[i], `第 ${i} 个元素`).toBeCloseTo(y[i], digits);
    }
}

describe('Matrix4x4（math/geom）', () =>
{
    describe('★★ 单位矩阵与行列式', () =>
    {
        it('★★ identity() 的行列式为 1', () =>
        {
            expect(mat4Determinant(mat4Identity())).toBeCloseTo(1, 8);
        });

        it('★★ identity() 变换点不变', () =>
        {
            const m = mat4Identity();

            for (const [x, y, z] of [[0, 0, 0], [1, 2, 3], [-5, 0.5, 100]] as [number, number, number][])
            {
                const out = mat4TransformPoint3(m, v3(x, y, z));

                expect(out.x, `(${x},${y},${z})`).toBeCloseTo(x, 6);
                expect(out.y, `(${x},${y},${z})`).toBeCloseTo(y, 6);
                expect(out.z, `(${x},${y},${z})`).toBeCloseTo(z, 6);
            }
        });
    });

    describe('★★ 纯缩放', () =>
    {
        it('★★ fromScale 的行列式 === sx·sy·sz', () =>
        {
            for (const [sx, sy, sz] of [[2, 3, 4], [1, 1, 1], [0.5, 2, 10], [-1, 1, 1]] as [number, number, number][])
            {
                const m = mat4FromScale(sx, sy, sz);

                expect(mat4Determinant(m), `(${sx},${sy},${sz})`).toBeCloseTo(sx * sy * sz, 6);
            }
        });

        it('★★ fromScale 把 (1,1,1) 映到 (sx,sy,sz)', () =>
        {
            const out = mat4TransformPoint3(mat4FromScale(2, 3, 4), v3(1, 1, 1));

            expect(out.x).toBeCloseTo(2, 6);
            expect(out.y).toBeCloseTo(3, 6);
            expect(out.z).toBeCloseTo(4, 6);
        });

        it('★ getScale 能读回构造时的缩放', () =>
        {
            const m = mat4FromScale(2, 3, 4);
            const s = mat4GetScale(m);

            expect(s.x).toBeCloseTo(2, 5);
            expect(s.y).toBeCloseTo(3, 5);
            expect(s.z).toBeCloseTo(4, 5);
        });
    });

    describe('★★ 纯平移', () =>
    {
        it('★★ fromPosition 把原点映到 (x,y,z)', () =>
        {
            const out = mat4TransformPoint3(mat4FromPosition(1, 2, 3), v3(0, 0, 0));

            expect(out.x).toBeCloseTo(1, 6);
            expect(out.y).toBeCloseTo(2, 6);
            expect(out.z).toBeCloseTo(3, 6);
        });

        it('★★ 平移**不影响** transformVector3（向量没有位置）', () =>
        {
            const m = mat4FromPosition(10, 20, 30);
            const out = mat4TransformVector3(m, v3(1, 2, 3));

            expect(out.x, '向量不该被平移').toBeCloseTo(1, 6);
            expect(out.y).toBeCloseTo(2, 6);
            expect(out.z).toBeCloseTo(3, 6);
        });

        it('★ 平移不改变行列式（仍为 1）', () =>
        {
            expect(mat4Determinant(mat4FromPosition(5, 6, 7))).toBeCloseTo(1, 8);
        });

        it('★★ getPosition / setPosition 往返', () =>
        {
            const m = mat4FromPosition(1, 2, 3);
            const p = mat4GetPosition(m);

            expect(p.x).toBeCloseTo(1, 5);
            expect(p.y).toBeCloseTo(2, 5);
            expect(p.z).toBeCloseTo(3, 5);

            mat4SetPosition(m, v3(7, 8, 9), m);
            const q = mat4GetPosition(m);

            expect(q.x).toBeCloseTo(7, 5);
            expect(q.y).toBeCloseTo(8, 5);
            expect(q.z).toBeCloseTo(9, 5);
        });
    });

    describe('★★ 逆矩阵', () =>
    {
        it('★★ M × M⁻¹ 近似单位矩阵（纯缩放）', () =>
        {
            const m = mat4FromScale(2, 4, 0.5);

            mat4Invert(m, m);

            // 用"变换点"来间接验证：先缩放再逆缩放应当回到原点
            const p = v3(3, 4, 5);
            const scaled = mat4TransformPoint3(mat4FromScale(2, 4, 0.5), p);
            const back = mat4TransformPoint3(m, scaled);

            expect(back.x).toBeCloseTo(p.x, 5);
            expect(back.y).toBeCloseTo(p.y, 5);
            expect(back.z).toBeCloseTo(p.z, 5);
        });

        it('★ 逆矩阵的行列式是原行列式的倒数', () =>
        {
            const m = mat4FromScale(2, 4, 0.5);
            const det = mat4Determinant(m);

            mat4Invert(m, m);

            expect(mat4Determinant(m)).toBeCloseTo(1 / det, 6);
        });
    });

    describe('★★ 数组往返', () =>
    {
        it('★★ toArray 给出 16 个数；fromArray 能读回同一个矩阵', () =>
        {
            const m = mat4FromTRS(v3(1, 2, 3), v3(0, 0, 0), v3(2, 2, 2));
            const arr = mat4ToArray(m);

            expect(arr.length).toBe(16);

            const back = mat4FromArray(arr as number[]);

            expectMatrixClose(back, m);
        });

        it('★ 带 index 的写入 / 读取围绕一致', () =>
        {
            const m = mat4FromPosition(1, 2, 3);
            const buf = new Array(20).fill(0);

            mat4ToArray(m, buf, 2);

            const back = mat4FromArray(buf, 2);

            expectMatrixClose(back, m);
        });

        it('★ transpose = true 时读出的数组再 transpose 读回应还原', () =>
        {
            const m = mat4FromTRS(v3(1, 2, 3), v3(0, 0, 0), v3(2, 3, 4));
            const plain = mat4ToArray(m) as number[];
            const transposed = mat4ToArray(m, [], 0, true) as number[];

            // 转置两次应回到原矩阵（用 fromArray 的 transpose 读回）
            const doubleTransposed = mat4FromArray(transposed, 0, true);

            expectMatrixClose(doubleTransposed, m);

            // 转置后的数组应当与 plain 不同（除非矩阵对称）
            const same = plain.every((v, i) => Math.abs(v - transposed[i]) < 1e-9);

            expect(same, '非对称矩阵的转置应当与自身不同').toBe(false);
        });
    });

    describe('★ clone / copy / 轴向量', () =>
    {
        it('★ clone 产生独立对象', () =>
        {
            const m = mat4FromScale(2, 3, 4);
            const c = mat4Copy(m);

            expect(c).not.toBe(m);
            expect(c.elements).not.toBe(m.elements);
            expectMatrixClose(c, m);

            mat4Identity(c);
            expect(mat4Determinant(m), 'copy 应独立').toBeCloseTo(24, 6);
        });

        it('★ copy 把另一个矩阵的内容复制过来', () =>
        {
            const src = mat4FromPosition(1, 2, 3);
            const dst = mat4Identity();

            mat4Copy(src, dst);

            expectMatrixClose(dst, src);
        });

        it('★ 单位矩阵的三个轴是 x / y / z 单位向量', () =>
        {
            const m = mat4Identity();

            const ax = mat4GetAxisX(m);
            const ay = mat4GetAxisY(m);
            const az = mat4GetAxisZ(m);

            expect(ax.x).toBeCloseTo(1, 5);
            expect(ax.y).toBeCloseTo(0, 5);
            expect(ay.y).toBeCloseTo(1, 5);
            expect(az.z).toBeCloseTo(1, 5);
        });

        it('★ 纯缩放下轴向量被按比例放大', () =>
        {
            const m = mat4FromScale(2, 3, 4);
            const ax = mat4GetAxisX(m);

            expect(ax.x).toBeCloseTo(2, 5);
            expect(ax.y).toBeCloseTo(0, 5);
        });
    });

    describe('★ 齐次坐标', () =>
    {
        it('★ transformVector4 在单位矩阵下不变（含 w）', () =>
        {
            const m = mat4Identity();
            const out = mat4TransformVector4(m, { x: 1, y: 2, z: 3, w: 1 });

            expect(out.x).toBeCloseTo(1, 6);
            expect(out.y).toBeCloseTo(2, 6);
            expect(out.z).toBeCloseTo(3, 6);
            expect(out.w).toBeCloseTo(1, 6);
        });

        it('★ 纯平移下 w = 1 的点会被平移、w = 0 的向量不会', () =>
        {
            const m = mat4FromPosition(10, 0, 0);

            const point = mat4TransformVector4(m, { x: 0, y: 0, z: 0, w: 1 });
            const dir = mat4TransformVector4(m, { x: 0, y: 0, z: 0, w: 0 });

            expect(point.x, 'w=1 表示点，应被平移').toBeCloseTo(10, 6);
            expect(dir.x, 'w=0 表示方向，不应被平移').toBeCloseTo(0, 6);
        });
    });
});
