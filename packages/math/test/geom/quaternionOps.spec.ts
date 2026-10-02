import { assert, describe, it } from 'vitest';
import { RotationOrder } from '../../src/enums/RotationOrder';
import {
    quatCopy,
    quatEquals,
    quatFromAxisAngle,
    quatFromEuler,
    quatInverse,
    quatMagnitude,
    quatRotatePoint,
    quatSlerp,
    quatToAxisAngle,
} from '../../src/geom/quaternionOps';

/** 只取四分量的字面量（`Quaternion` 实例还有其他自有属性，直接展开不安全） */
function xyzw(q: { x: number; y: number; z: number; w: number })
{
    return { x: q.x, y: q.y, z: q.z, w: q.w };
}

function assertClose(actual: number, expected: number, message?: string)
{
    assert.ok(Math.abs(actual - expected) < 1e-12, `${message ?? ''} 期望 ${expected}，实际 ${actual}`);
}

/**
 * `quaternionOps` 纯函数层的**契约测试**（issue #134 阶段 A2b）。
 *
 * 数值类期望值手算硬编码；`fromEuler` 的六种旋转序**不在这里重复交叉验证**
 * （`Quaternion.spec.ts` 已用 `Matrix4x4.fromRotation` 做独立对比，
 * 那条用例正是抓到 XZY 分支抄错一项的那条），这里只锁「都是单位四元数」。
 */
describe('quaternionOps 纯函数层（#134 A2b）', () =>
{
    it('运算不修改入参', () =>
    {
        const a = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };
        const before = { ...a };
        const p = { x: 1, y: 2, z: 3 };

        quatInverse(a);
        quatRotatePoint(a, p);
        quatCopy(a);

        assert.deepEqual(a, before, '入参四元数被修改了');
        assert.deepEqual(p, { x: 1, y: 2, z: 3 }, '入参向量被修改了');
    });

    it('out 传自己即就地运算', () =>
    {
        const target = { x: 1, y: 2, z: 3, w: 4 };

        quatInverse(target, target);

        assert.deepEqual(target, { x: -1, y: -2, z: -3, w: 4 });
    });

    it('★ quatInverse 只写 x/y/z，w 必须从入参保留', () =>
    {
        // 若缺省 out 的 w 用了默认值而没显式写回，这里会得到 w=1 而不是 4
        const result = quatInverse({ x: 1, y: 2, z: 3, w: 4 });

        assert.deepEqual(result, { x: -1, y: -2, z: -3, w: 4 });
    });

    it('quatMagnitude 与手算一致', () =>
    {
        assertClose(quatMagnitude({ x: 3, y: 4, z: 0, w: 0 }), 5);
        assertClose(quatMagnitude({ x: 0, y: 0, z: 0, w: 1 }), 1);
    });

    it('quatFromAxisAngle：绕 z 轴 90° 得到 (0,0,√2/2,√2/2)', () =>
    {
        const q = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        assertClose(q.x, 0, 'x');
        assertClose(q.y, 0, 'y');
        assertClose(q.z, Math.SQRT1_2, 'z');
        assertClose(q.w, Math.SQRT1_2, 'w');
    });

    it('quatRotatePoint：绕 z 轴 90° 把 (1,0,0) 送到 (0,1,0)', () =>
    {
        const q = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);
        const p = quatRotatePoint(q, { x: 1, y: 0, z: 0 });

        assertClose(p.x, 0, 'x');
        assertClose(p.y, 1, 'y');
        assertClose(p.z, 0, 'z');
    });

    it('quatSlerp 的端点：t=0 取 a、t=1 取 b', () =>
    {
        const a = { x: 0, y: 0, z: 0, w: 1 };
        const b = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);

        assert.deepEqual(xyzw(quatSlerp(a, b, 0)), xyzw(a));
        assert.deepEqual(xyzw(quatSlerp(a, b, 1)), xyzw(b));
    });

    it('★ quatToAxisAngle 不修改入参（原 class 方法会先 normalize 自身）', () =>
    {
        // 未归一化的四元数：ops 只对副本归一化
        const q = { x: 0, y: 0, z: 10, w: 0 };
        const before = { ...q };

        const [axis, angle] = quatToAxisAngle(q);

        assert.deepEqual(q, before, '入参被 normalize 了');
        assertClose(axis.x, 0, 'axis.x');
        assertClose(axis.y, 0, 'axis.y');
        assertClose(axis.z, 1, 'axis.z');
        assertClose(angle, Math.PI, 'angle');
    });

    it('quatFromEuler 六种旋转序都得到单位四元数', () =>
    {
        const orders = [RotationOrder.XYZ, RotationOrder.YXZ, RotationOrder.ZXY, RotationOrder.ZYX, RotationOrder.YZX, RotationOrder.XZY];

        for (const order of orders)
        {
            const q = quatFromEuler(0.3, -0.7, 1.1, order);

            assertClose(quatMagnitude(q), 1, `order=${order}`);
        }
    });

    it('quatEquals：四元数与取负等价（#489 回归，x=0 也要能区分）', () =>
    {
        assert.ok(quatEquals({ x: 1, y: 2, z: 3, w: 4 }, { x: -1, y: -2, z: -3, w: -4 }));
        assert.ok(quatEquals({ x: 0, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 1 }));
        assert.ok(!quatEquals({ x: 0, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 1, w: 0 }));
    });

    it('quatFromEuler 无隐藏状态：两次调用逐位一致，且 quatCopy 与之相等（原「class 委托接线」用例的接替）', () =>
    {
        // 阶段 C-e：`Quaternion` 的 class 已删除，「class 结果 == 纯函数结果」失去被测对象；
        // 保留它真正有价值的断言：同一输入两次调用结果相同、复制后仍相等
        const q = quatFromEuler(0.3, -0.7, 1.1, RotationOrder.XZY);
        const expected = quatFromEuler(0.3, -0.7, 1.1, RotationOrder.XZY);

        assert.deepEqual(xyzw(q), xyzw(expected));
        assert.ok(quatEquals(q, quatCopy(q)));
    });
});
