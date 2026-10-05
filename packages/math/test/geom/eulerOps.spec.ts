import { assert, describe, it, vi } from 'vitest';
import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../../src/enums/RotationOrder';
import { mat4FromRotation } from '../../src/geom/matrix4x4';
import { quatEquals, quatFromEuler } from '../../src/geom/quaternion';
import {
    eulerCopy,
    eulerEquals,
    eulerFromArray,
    eulerFromQuaternion,
    eulerFromRotationMatrix,
    eulerFromVector3,
    eulerRandom,
    eulerReorder,
    eulerSet,
    eulerToArray,
    eulerToVector3,
} from '../../src/geom/euler';

/** 只取四字段的字面量（`Euler` 数据可能带 `__type__` 判别字段，直接展开会把判别字段也算进去） */
function xyzo(e: { x: number; y: number; z: number; order: RotationOrder })
{
    return { x: e.x, y: e.y, z: e.z, order: e.order };
}

function near(actual: number, expected: number, message?: string)
{
    assert.ok(Math.abs(actual - expected) < 1e-12, `${message ?? ''} 期望 ${expected}，实际 ${actual}`);
}

/** 全部六种旋转序（枚举值顺序与字面顺序不一致：XYZ=0, ZXY=1, ZYX=2, YXZ=3, YZX=4, XZY=5） */
const ALL_ORDERS = [
    RotationOrder.XYZ,
    RotationOrder.ZXY,
    RotationOrder.ZYX,
    RotationOrder.YXZ,
    RotationOrder.YZX,
    RotationOrder.XZY,
];

/** 单位矩阵（列主序） */
const IDENTITY = { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };

/** 绕 Z 轴 +90° 的旋转矩阵（列主序，手算：R = [[0,-1,0],[1,0,0],[0,0,1]]） */
const ROT_Z_90 = { elements: [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };

/** 绕 Y 轴 +90° 的旋转矩阵（列主序，手算：R = [[0,0,1],[0,1,0],[-1,0,0]]） */
const ROT_Y_90 = { elements: [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1] };

/**
 * `euler` 纯函数层的**契约测试**（issue #134 阶段 A2l）。
 *
 * 数值类期望值手算硬编码；`fromRotationMatrix` 的六个旋转序另用 `mat4FromRotation`
 * （独立实现）做**交叉验证**——长公式抄写只能靠这种交叉验证兜住（方案 §10.1 P7）。
 * 阶段 C-a 删掉 `Euler` class 后，原来的「class 委托接线」用例一并删除：
 * 委托方已不存在，纯函数层自身的手算用例就是唯一的等价网（方案 §5.8）。
 */
describe('euler 纯函数层（#134 A2l）', () =>
{
    it('运算不修改入参', () =>
    {
        const a = { x: 0.1, y: 0.2, z: 0.3, order: RotationOrder.XZY };
        const before = { ...a };
        const v = { x: 1, y: 2, z: 3 };
        const q = { x: 0, y: 0, z: 0, w: 1 };
        const arr = [1, 2, 3, RotationOrder.YZX];

        eulerFromVector3(a, v);
        eulerFromRotationMatrix(a, IDENTITY);
        eulerFromQuaternion(a, q);
        eulerReorder(a, RotationOrder.ZYX);
        eulerToArray(a);
        eulerToVector3(a);
        eulerSet(9, 9, 9, RotationOrder.ZYX);

        assert.deepEqual(a, before, '入参欧拉角被修改了');
        assert.deepEqual(v, { x: 1, y: 2, z: 3 }, '入参向量被修改了');
        assert.deepEqual(q, { x: 0, y: 0, z: 0, w: 1 }, '入参四元数被修改了');
        assert.deepEqual(arr, [1, 2, 3, RotationOrder.YZX], '入参数组被修改了');
    });

    it('out 传自己即就地运算', () =>
    {
        const a = { x: 1, y: 2, z: 3, order: RotationOrder.XYZ };

        eulerFromVector3(a, { x: 7, y: 8, z: 9 }, RotationOrder.ZYX, a);

        assert.deepEqual(a, { x: 7, y: 8, z: 9, order: RotationOrder.ZYX });
    });

    it('★ eulerSet：order 缺省时不动 out.order，缺省 out 的 order 是默认旋转序', () =>
    {
        // 缺省 out（新建）必须与欧拉角的默认值一致（方案 §10.1 P6）
        assert.deepEqual(eulerSet(1, 2, 3), { x: 1, y: 2, z: 3, order: mathUtil.DefaultRotationOrder });

        const target = { x: 0, y: 0, z: 0, order: RotationOrder.ZYX };

        eulerSet(1, 2, 3, undefined, target);
        assert.deepEqual(target, { x: 1, y: 2, z: 3, order: RotationOrder.ZYX }, 'order 缺省时不应被改写');

        eulerSet(1, 2, 3, RotationOrder.XZY, target);
        assert.equal(target.order, RotationOrder.XZY);
    });

    it('★ eulerFromRotationMatrix 手算：绕 Z 轴 90° → (0, 0, π/2)', () =>
    {
        const r = eulerFromRotationMatrix({ x: 0, y: 0, z: 0, order: RotationOrder.XYZ }, ROT_Z_90);

        near(r.x, 0, 'x');
        near(r.y, 0, 'y');
        near(r.z, Math.PI / 2, 'z');
        assert.equal(r.order, RotationOrder.XYZ);
    });

    it('★ eulerFromRotationMatrix 手算：绕 Y 轴 90° 的退化分支（|m13| = 1）→ (0, π/2, 0)', () =>
    {
        const r = eulerFromRotationMatrix({ x: 0, y: 0, z: 0, order: RotationOrder.XYZ }, ROT_Y_90);

        near(r.x, 0, 'x');
        near(r.y, Math.PI / 2, 'y');
        near(r.z, 0, 'z');
    });

    it('★ eulerFromRotationMatrix 手算：单位矩阵 → (0, 0, 0)，order 缺省取入参的 order', () =>
    {
        const r = eulerFromRotationMatrix({ x: 5, y: 6, z: 7, order: RotationOrder.YZX }, IDENTITY);

        near(r.x, 0, 'x');
        near(r.y, 0, 'y');
        near(r.z, 0, 'z');
        assert.equal(r.order, RotationOrder.YZX, 'order 缺省应取 a.order');
    });

    it('★ 六个旋转序与 mat4FromRotation 交叉验证（往返回到原角度）', () =>
    {
        // 角度都取 (-π/2, π/2) 内，保证分解出的表示唯一
        const x = 0.3;
        const y = -0.7;
        const z = 0.5;

        for (const order of ALL_ORDERS)
        {
            const matrix = mat4FromRotation(x, y, z, order);
            const r = eulerFromRotationMatrix({ x: 0, y: 0, z: 0, order }, matrix, order);

            near(r.x, x, `order=${order} x`);
            near(r.y, y, `order=${order} y`);
            near(r.z, z, `order=${order} z`);
            assert.equal(r.order, order, `order=${order}`);
        }
    });

    it('★ 六个旋转序的退化分支（三轴各 90°，|asin 参数| = 1）都能给出有限数值', () =>
    {
        // 三轴同时 90° 时，六个分支各自的 asin 参数都会达到 ±1，从而走 if 的 else 分支
        for (const order of ALL_ORDERS)
        {
            const matrix = mat4FromRotation(Math.PI / 2, Math.PI / 2, Math.PI / 2, order);
            const r = eulerFromRotationMatrix({ x: 0, y: 0, z: 0, order }, matrix, order);

            assert.ok(
                Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.z),
                `order=${order} 退化分支应给出有限数值：${JSON.stringify(xyzo(r))}`,
            );
            assert.equal(r.order, order);
        }
    });

    it('★ 未知旋转序：三个轴都不参与计算、保持 out 原有角度、order 写成传入值', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const a = { x: 1, y: 2, z: 3, order: RotationOrder.XYZ };

        const r = eulerFromRotationMatrix(a, ROT_Z_90, 99 as RotationOrder);

        assert.deepEqual(r, { x: 1, y: 2, z: 3, order: 99 });
        assert.ok(warn.mock.calls.length === 1, '应有一条 console.warn');
        warn.mockRestore();
    });

    it('★ eulerFromQuaternion 手算：绕 Z 轴 90° 的四元数 → (0, 0, π/2)', () =>
    {
        const q = quatFromEuler(0, 0, Math.PI / 2, RotationOrder.XYZ);
        const r = eulerFromQuaternion({ x: 0, y: 0, z: 0, order: RotationOrder.XYZ }, q);

        near(r.x, 0, 'x');
        near(r.y, 0, 'y');
        near(r.z, Math.PI / 2, 'z');
    });

    it('★ eulerFromQuaternion 六序交叉验证：还原的角度再转回四元数与原来等价', () =>
    {
        for (const order of ALL_ORDERS)
        {
            const q = quatFromEuler(0.3, -0.7, 0.5, order);
            const r = eulerFromQuaternion({ x: 0, y: 0, z: 0, order }, q, order);
            const back = quatFromEuler(r.x, r.y, r.z, r.order);

            assert.ok(quatEquals(q, back), `order=${order} 还原后四元数应等价`);
        }
    });

    it('★ eulerFromVector3：写入三个分量，order 缺省取 a.order', () =>
    {
        const r = eulerFromVector3({ x: 0, y: 0, z: 0, order: RotationOrder.YZX }, { x: 1, y: 2, z: 3 });

        assert.deepEqual(r, { x: 1, y: 2, z: 3, order: RotationOrder.YZX });
    });

    it('★ eulerReorder 手算：绕 Z 轴 90°（XYZ）换 ZYX 后仍是 (0, 0, π/2)', () =>
    {
        const r = eulerReorder({ x: 0, y: 0, z: Math.PI / 2, order: RotationOrder.XYZ }, RotationOrder.ZYX);

        near(r.x, 0, 'x');
        near(r.y, 0, 'y');
        near(r.z, Math.PI / 2, 'z');
        assert.equal(r.order, RotationOrder.ZYX);
    });

    it('★ eulerReorder 会把角度归一到等价表示（同序也会改数值）', () =>
    {
        // 绕 Z 轴 10 弧度：等价的 [-π, π] 表示是 10 - 4π
        const r = eulerReorder({ x: 0, y: 0, z: 10, order: RotationOrder.XYZ }, RotationOrder.XYZ);

        near(r.z, 10 - (4 * Math.PI), 'z');
        assert.equal(r.order, RotationOrder.XYZ);
    });

    it('eulerEquals：四字段全等（含 order）', () =>
    {
        assert.ok(eulerEquals({ x: 1, y: 2, z: 3, order: RotationOrder.XYZ }, { x: 1, y: 2, z: 3, order: RotationOrder.XYZ }));
        assert.ok(!eulerEquals({ x: 1, y: 2, z: 3, order: RotationOrder.XYZ }, { x: 1, y: 2, z: 3, order: RotationOrder.ZYX }));
        assert.ok(!eulerEquals({ x: 1, y: 2, z: 3, order: RotationOrder.XYZ }, { x: 1, y: 2, z: 4, order: RotationOrder.XYZ }));
    });

    it('eulerCopy 复制四个字段', () =>
    {
        assert.deepEqual(eulerCopy({ x: 1, y: 2, z: 3, order: RotationOrder.XZY }), { x: 1, y: 2, z: 3, order: RotationOrder.XZY });
    });

    it('eulerFromArray / eulerToArray：往返与 offset', () =>
    {
        assert.deepEqual(eulerFromArray([1, 2, 3, RotationOrder.XZY]), { x: 1, y: 2, z: 3, order: RotationOrder.XZY });
        assert.deepEqual(eulerFromArray([9, 9, 4, 5, 6, RotationOrder.YZX], 2), { x: 4, y: 5, z: 6, order: RotationOrder.YZX });

        const arr: number[] = [];

        assert.equal(eulerToArray({ x: 1, y: 2, z: 3, order: RotationOrder.ZXY }, arr), arr, '应返回同一个数组');
        assert.deepEqual(arr, [1, 2, 3, RotationOrder.ZXY]);

        const arr2 = [0, 0, 0, 0, 0];

        eulerToArray({ x: 1, y: 2, z: 3, order: RotationOrder.XYZ }, arr2, 1);
        assert.deepEqual(arr2, [0, 1, 2, 3, RotationOrder.XYZ]);
    });

    it('eulerToVector3：只写 x/y/z（不含 order）', () =>
    {
        assert.deepEqual(eulerToVector3({ x: 1, y: 2, z: 3, order: RotationOrder.XYZ }), { x: 1, y: 2, z: 3 });

        const out = { x: 0, y: 0, z: 0 };

        assert.equal(eulerToVector3({ x: 4, y: 5, z: 6, order: RotationOrder.XYZ }, out), out);
        assert.deepEqual(out, { x: 4, y: 5, z: 6 });
    });

    it('eulerRandom：分量落在 [0, 2π)、order 是 0..5 的整数，且写回 out', () =>
    {
        const target = { x: 0, y: 0, z: 0, order: RotationOrder.XYZ };

        assert.equal(eulerRandom(target), target);

        for (const value of [target.x, target.y, target.z])
        {
            assert.ok(value >= 0 && value <= (Math.PI * 2), `分量越界：${value}`);
        }

        assert.ok(Number.isInteger(target.order) && target.order >= 0 && target.order <= 5, `order 越界：${target.order}`);
    });
});
