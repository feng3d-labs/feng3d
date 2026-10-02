import { assert, describe, it } from 'vitest';
import type { Segment3 } from '../../src/geom/segment3Ops';
import {
    seg3ClampPoint,
    seg3ClosestPointWithPoint,
    seg3Equals,
    seg3FromPoints,
    seg3GetLength,
    seg3GetLine,
    seg3GetNormalWithPoint,
    seg3GetPoint,
    seg3GetPositionByPoint,
} from '../../src/geom/segment3Ops';

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-12, `${msg ?? ''} 期望 ${b} 实际 ${a}`);
const xyz = (v: { x: number; y: number; z: number }) => ({ x: v.x, y: v.y, z: v.z });

/**
 * `segment3Ops` 纯函数层的**契约测试**（issue #134 阶段 A2g）。
 *
 * 几何类型是**嵌套结构**（持有 p0/p1 两个 Vector3），所以这里也顺带锁住两处易错点：
 * `seg3FromPoints` 有意的值语义收紧、以及 `getNormalWithPoint` 必须对应 `normalize()`
 * （长度平方判定）而**不是** `Normalize()`（kEpsilon 判定）。
 */
describe('segment3Ops 纯函数层（#134 A2g）', () =>
{
    it('运算不修改入参', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };
        const p = { x: 5, y: 1, z: 0 };

        seg3GetPoint(a, 0.5);
        seg3GetPositionByPoint(a, p);
        seg3ClampPoint(a, p);

        assert.deepEqual(a, { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } }, '入参线段被修改了');
        assert.deepEqual(p, { x: 5, y: 1, z: 0 }, '入参点被修改了');
    });

    it('out 传自己即就地运算（out 与 p0 同一对象）', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };

        seg3GetPoint(a, 0.5, a.p0);

        assert.deepEqual(xyz(a.p0), { x: 5, y: 0, z: 0 });
    });

    it('★ 回归：seg3GetPoint 逐分量先算后写，out 与 p0 重合也正确', () =>
    {
        const a = { p0: { x: 1, y: 2, z: 3 }, p1: { x: 11, y: 22, z: 33 } };
        const expected = { x: 6, y: 12, z: 18 }; // p0 + (p1-p0)*0.5

        seg3GetPoint(a, 0.5, a.p0);

        assert.deepEqual(xyz(a.p0), expected);
    });

    it('getLength / getPoint / getPositionByPoint 与手算一致', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 3, y: 4, z: 0 } };

        near(seg3GetLength(a), 5, 'length');
        assert.deepEqual(xyz(seg3GetPoint(a, 0)), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(seg3GetPoint(a, 1)), { x: 3, y: 4, z: 0 });
        near(seg3GetPositionByPoint(a, { x: 3, y: 4, z: 0 }), 1, 'position@p1');
        near(seg3GetPositionByPoint(a, { x: 1.5, y: 2, z: 0 }), 0.5, 'position@mid');
    });

    it('clampPoint 把线段外的点压到端点', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };

        assert.deepEqual(xyz(seg3ClampPoint(a, { x: 20, y: 0, z: 0 })), { x: 10, y: 0, z: 0 });
        assert.deepEqual(xyz(seg3ClampPoint(a, { x: -20, y: 0, z: 0 })), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(seg3ClampPoint(a, { x: 4, y: 0, z: 0 })), { x: 4, y: 0, z: 0 });
    });

    it('★ getNormalWithPoint 对应 normalize()（长度平方判定），不是 Normalize()（kEpsilon）', () =>
    {
        // 常规情形：法线就是 +Y
        const normal = seg3GetNormalWithPoint({ p0: { x: 0, y: 0, z: 0 }, p1: { x: 1, y: 0, z: 0 } }, { x: 0.5, y: 1, z: 0 });

        assert.deepEqual(xyz(normal), { x: 0, y: 1, z: 0 });

        // 退化边界：方向向量长度 1e-7（小于 kEpsilon=1e-5）
        // normalize() 因「长度平方 > 0」仍会归一化出 (0,1,0)；
        // 若误用 Normalize() 会因 kEpsilon 判零而返回零向量 —— 这一条就是防这个误译。
        const tiny = seg3GetNormalWithPoint({ p0: { x: 0, y: 0, z: 0 }, p1: { x: 1e-7, y: 0, z: 0 } }, { x: 0, y: 1, z: 0 });

        assert.deepEqual(xyz(tiny), { x: 0, y: 1, z: 0 }, '退化边界下应走 normalize() 分支');
    });

    it('★ seg3FromPoints 取值语义（复制分量），不再是原实现的引用赋值', () =>
    {
        const p0 = { x: 1, y: 2, z: 3 };
        const out = seg3FromPoints(p0, { x: 4, y: 5, z: 6 });

        assert.deepEqual(xyz(out.p0), { x: 1, y: 2, z: 3 });

        // 改源对象不应牵动结果——纯数据字面量之间没有"共享引用"
        const mutable = { x: 9, y: 9, z: 9 };
        const out2 = seg3FromPoints(mutable, { x: 0, y: 0, z: 0 });

        mutable.x = 0;

        assert.equal(out2.p0.x, 9, '应是复制而非引用');
    });

    it('seg3Equals 与端点方向无关', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 1, y: 0, z: 0 } };
        const reversed = { p0: { x: 1, y: 0, z: 0 }, p1: { x: 0, y: 0, z: 0 } };

        assert.ok(seg3Equals(a, reversed));
        assert.ok(seg3Equals(a, a));
        assert.ok(!seg3Equals(a, { p0: { x: 0, y: 0, z: 0 }, p1: { x: 0, y: 1, z: 0 } }));
    });

    it('★ 带判别字段的纯数据与裸字面量走同一份实现（C-c：接口与最小形状同址）', () =>
    {
        const tagged: Segment3 = { __type__: 'Segment3', ...seg3FromPoints({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }) };
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };

        assert.equal(seg3GetLength(tagged), seg3GetLength(a));
        assert.deepEqual(xyz(seg3GetPoint(tagged, 0.25)), xyz(seg3GetPoint(a, 0.25)));
        assert.equal(seg3GetPositionByPoint(tagged, { x: 5, y: 0, z: 0 }), seg3GetPositionByPoint(a, { x: 5, y: 0, z: 0 }));
    });

    it('seg3GetLine：origin = p0、direction = normalize(p1 − p0)（取值语义，不与入参共享端点）', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 0, y: 3, z: 0 } };
        const line = seg3GetLine(a);

        assert.deepEqual(xyz(line.origin), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(line.direction), { x: 0, y: 1, z: 0 });

        // 缺省 out 与 `new Line3()` 的默认一致（原点替零、方向 +Z）
        const dflt = seg3GetLine({ p0: { x: 2, y: 2, z: 2 }, p1: { x: 2, y: 2, z: 2 } });

        assert.deepEqual(xyz(dflt.origin), { x: 2, y: 2, z: 2 });
        assert.deepEqual(xyz(dflt.direction), { x: 0, y: 0, z: 0 }, '退化线段（两端点重合）方向归一化为零向量');

        // 传 out 时写入并返回它
        const out = { origin: { x: 9, y: 9, z: 9 }, direction: { x: 9, y: 9, z: 9 } };

        assert.equal(seg3GetLine(a, out), out);
        assert.deepEqual(xyz(out.origin), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(out.direction), { x: 0, y: 1, z: 0 });

        // 改入参不牵动已算出的直线（值语义）
        const mutable = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 5, y: 0, z: 0 } };
        const line2 = seg3GetLine(mutable);

        mutable.p0.x = 100;

        assert.equal(line2.origin.x, 0, '应是复制而非引用');
    });

    it('seg3ClosestPointWithPoint：线上点原样、线外点取投影、投影在段外取更近端点', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 10, y: 0, z: 0 } };

        // 投影落在线段内 → 投影点
        assert.deepEqual(xyz(seg3ClosestPointWithPoint(a, { x: 4, y: 3, z: 0 })), { x: 4, y: 0, z: 0 });
        // 投影落在 p1 之外 → 取更近的端点 p1
        assert.deepEqual(xyz(seg3ClosestPointWithPoint(a, { x: 30, y: 0, z: 0 })), { x: 10, y: 0, z: 0 });
        // 投影落在 p0 之外 → 取更近的端点 p0
        assert.deepEqual(xyz(seg3ClosestPointWithPoint(a, { x: -30, y: 0, z: 0 })), { x: 0, y: 0, z: 0 });
        // 线段上的点原样返回
        assert.deepEqual(xyz(seg3ClosestPointWithPoint(a, { x: 2.5, y: 0, z: 0 })), { x: 2.5, y: 0, z: 0 });

        // 传 out 时写入并返回它
        const out = { x: 9, y: 9, z: 9 };

        assert.equal(seg3ClosestPointWithPoint(a, { x: 4, y: 3, z: 0 }, out), out);
        assert.deepEqual(xyz(out), { x: 4, y: 0, z: 0 });
    });
});
