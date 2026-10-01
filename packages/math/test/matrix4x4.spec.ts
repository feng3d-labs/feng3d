import { describe, expect, it } from 'vitest';

import { Matrix4x4 } from '../src/geom/Matrix4x4';
import { Vector3 } from '../src/geom/Vector3';
import { Vector4 } from '../src/geom/Vector4';

/**
 * `Matrix4x4`（`packages/math/src/geom/Matrix4x4.ts`，**766 行** —— `math` 包里最大的文件，
 * 此前**行覆盖率 57.96%**）。
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

const v3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** 取矩阵的 16 个元素（用 toArray 读出，避免依赖内部字段名） */
const arr16 = (m: Matrix4x4) => m.toArray([]) as number[];

/** 两个矩阵是否近似相等（逐元素） */
function expectMatrixClose(a: Matrix4x4, b: Matrix4x4, digits = 6)
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
            expect(new Matrix4x4().identity().determinant).toBeCloseTo(1, 8);
        });

        it('★★ identity() 变换点不变', () =>
        {
            const m = new Matrix4x4().identity();

            for (const [x, y, z] of [[0, 0, 0], [1, 2, 3], [-5, 0.5, 100]] as [number, number, number][])
            {
                const out = m.transformPoint3(v3(x, y, z));

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
                const m = new Matrix4x4().fromScale(sx, sy, sz);

                expect(m.determinant, `(${sx},${sy},${sz})`).toBeCloseTo(sx * sy * sz, 6);
            }
        });

        it('★★ fromScale 把 (1,1,1) 映到 (sx,sy,sz)', () =>
        {
            const out = new Matrix4x4().fromScale(2, 3, 4).transformPoint3(v3(1, 1, 1));

            expect(out.x).toBeCloseTo(2, 6);
            expect(out.y).toBeCloseTo(3, 6);
            expect(out.z).toBeCloseTo(4, 6);
        });

        it('★ getScale 能读回构造时的缩放', () =>
        {
            const m = new Matrix4x4().fromScale(2, 3, 4);
            const s = m.getScale();

            expect(s.x).toBeCloseTo(2, 5);
            expect(s.y).toBeCloseTo(3, 5);
            expect(s.z).toBeCloseTo(4, 5);
        });
    });

    describe('★★ 纯平移', () =>
    {
        it('★★ fromPosition 把原点映到 (x,y,z)', () =>
        {
            const out = new Matrix4x4().fromPosition(1, 2, 3).transformPoint3(v3(0, 0, 0));

            expect(out.x).toBeCloseTo(1, 6);
            expect(out.y).toBeCloseTo(2, 6);
            expect(out.z).toBeCloseTo(3, 6);
        });

        it('★★ 平移**不影响** transformVector3（向量没有位置）', () =>
        {
            const m = new Matrix4x4().fromPosition(10, 20, 30);
            const out = m.transformVector3(v3(1, 2, 3));

            expect(out.x, '向量不该被平移').toBeCloseTo(1, 6);
            expect(out.y).toBeCloseTo(2, 6);
            expect(out.z).toBeCloseTo(3, 6);
        });

        it('★ 平移不改变行列式（仍为 1）', () =>
        {
            expect(new Matrix4x4().fromPosition(5, 6, 7).determinant).toBeCloseTo(1, 8);
        });

        it('★★ getPosition / setPosition 往返', () =>
        {
            const m = new Matrix4x4().fromPosition(1, 2, 3);
            const p = m.getPosition();

            expect(p.x).toBeCloseTo(1, 5);
            expect(p.y).toBeCloseTo(2, 5);
            expect(p.z).toBeCloseTo(3, 5);

            m.setPosition(v3(7, 8, 9));
            const q = m.getPosition();

            expect(q.x).toBeCloseTo(7, 5);
            expect(q.y).toBeCloseTo(8, 5);
            expect(q.z).toBeCloseTo(9, 5);
        });
    });

    describe('★★ 逆矩阵', () =>
    {
        it('★★ M × M⁻¹ 近似单位矩阵（纯缩放）', () =>
        {
            const m = new Matrix4x4().fromScale(2, 4, 0.5);

            m.invert();

            // 用"变换点"来间接验证：先缩放再逆缩放应当回到原点
            const p = v3(3, 4, 5);
            const scaled = new Matrix4x4().fromScale(2, 4, 0.5).transformPoint3(p);
            const back = m.transformPoint3(scaled);

            expect(back.x).toBeCloseTo(p.x, 5);
            expect(back.y).toBeCloseTo(p.y, 5);
            expect(back.z).toBeCloseTo(p.z, 5);
        });

        it('★ 逆矩阵的行列式是原行列式的倒数', () =>
        {
            const m = new Matrix4x4().fromScale(2, 4, 0.5);
            const det = m.determinant;

            m.invert();

            expect(m.determinant).toBeCloseTo(1 / det, 6);
        });
    });

    describe('★★ 数组往返', () =>
    {
        it('★★ toArray 给出 16 个数；fromArray 能读回同一个矩阵', () =>
        {
            const m = new Matrix4x4().fromTRS(v3(1, 2, 3), v3(0, 0, 0), v3(2, 2, 2));
            const arr = m.toArray([]);

            expect(arr.length).toBe(16);

            const back = new Matrix4x4().fromArray(arr);

            expectMatrixClose(back, m);
        });

        it('★ 带 index 的写入 / 读取围绕一致', () =>
        {
            const m = new Matrix4x4().fromPosition(1, 2, 3);
            const buf = new Array(20).fill(0);

            m.toArray(buf, 2);

            const back = new Matrix4x4().fromArray(buf, 2);

            expectMatrixClose(back, m);
        });

        it('★ transpose = true 时读出的数组再 transpose 读回应还原', () =>
        {
            const m = new Matrix4x4().fromTRS(v3(1, 2, 3), v3(0, 0, 0), v3(2, 3, 4));
            const plain = m.toArray([]);
            const transposed = m.toArray([], 0, true);

            // 转置两次应回到原矩阵（用 fromArray 的 transpose 读回）
            const doubleTransposed = new Matrix4x4().fromArray(transposed, 0, true);

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
            const m = new Matrix4x4().fromScale(2, 3, 4);
            const c = m.clone();

            expect(c).not.toBe(m);
            expectMatrixClose(c, m);

            c.identity();
            expect(m.determinant, 'clone 应独立').toBeCloseTo(24, 6);
        });

        it('★ copy 把另一个矩阵的内容复制过来', () =>
        {
            const src = new Matrix4x4().fromPosition(1, 2, 3);
            const dst = new Matrix4x4();

            dst.copy(src);

            expectMatrixClose(dst, src);
        });

        it('★ 单位矩阵的三个轴是 x / y / z 单位向量', () =>
        {
            const m = new Matrix4x4().identity();

            const ax = m.getAxisX();
            const ay = m.getAxisY();
            const az = m.getAxisZ();

            expect(ax.x).toBeCloseTo(1, 5);
            expect(ax.y).toBeCloseTo(0, 5);
            expect(ay.y).toBeCloseTo(1, 5);
            expect(az.z).toBeCloseTo(1, 5);
        });

        it('★ 纯缩放下轴向量被按比例放大', () =>
        {
            const m = new Matrix4x4().fromScale(2, 3, 4);
            const ax = m.getAxisX();

            expect(ax.x).toBeCloseTo(2, 5);
            expect(ax.y).toBeCloseTo(0, 5);
        });
    });

    describe('★ 齐次坐标', () =>
    {
        it('★ transformVector4 在单位矩阵下不变（含 w）', () =>
        {
            const m = new Matrix4x4().identity();
            const out = m.transformVector4(new Vector4(1, 2, 3, 1));

            expect(out.x).toBeCloseTo(1, 6);
            expect(out.y).toBeCloseTo(2, 6);
            expect(out.z).toBeCloseTo(3, 6);
            expect(out.w).toBeCloseTo(1, 6);
        });

        it('★ 纯平移下 w = 1 的点会被平移、w = 0 的向量不会', () =>
        {
            const m = new Matrix4x4().fromPosition(10, 0, 0);

            const point = m.transformVector4(new Vector4(0, 0, 0, 1));
            const dir = m.transformVector4(new Vector4(0, 0, 0, 0));

            expect(point.x, 'w=1 表示点，应被平移').toBeCloseTo(10, 6);
            expect(dir.x, 'w=0 表示方向，不应被平移').toBeCloseTo(0, 6);
        });
    });
});
