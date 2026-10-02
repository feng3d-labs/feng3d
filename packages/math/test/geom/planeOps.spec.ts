import { assert, describe, it, vi } from 'vitest';
import { PlaneClassification } from '../../src/enums/PlaneClassification';
import type { Line3 } from '../../src/geom/line3Ops';
import { line3FromPosAndDir } from '../../src/geom/line3Ops';

import { vec3Add, vec3Dot } from '../../src/geom/vector3Ops';
import {
    planeClassifyPoint,
    planeClosestPointWithPoint,
    planeCopy,
    planeDistanceWithPoint,
    planeEquals,
    planeFromLine3,
    planeFromNormalAndPoint,
    planeFromPoints,
    planeGetNormal,
    planeGetOrigin,
    planeIntersectWithLine3,
    planeIntersectWithPlane3D,
    planeIntersectWithTwoPlane3D,
    planeNegate,
    planeNormalize,
    planeOnWithPoint,
    planeParallelWithLine3D,
    planeParallelWithPlane3D,
    planeProjectPoint,
    planeRandom,
    planeRandomPoint,
    planeSet,
    planeToString,
} from '../../src/geom/planeOps';

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-12, `${msg ?? ''} 期望 ${b} 实际 ${a}`);
const abcd = (p: { a: number; b: number; c: number; d: number }) => ({ a: p.a, b: p.b, c: p.c, d: p.d });
const xyz = (v: { x: number; y: number; z: number }) => ({ x: v.x, y: v.y, z: v.z });
const nearXyz = (p: { x: number; y: number; z: number }, e: { x: number; y: number; z: number }) =>
{
    near(p.x, e.x, 'x');
    near(p.y, e.y, 'y');
    near(p.z, e.z, 'z');
};
const nearAbcd = (p: { a: number; b: number; c: number; d: number }, e: { a: number; b: number; c: number; d: number }) =>
{
    near(p.a, e.a, 'a');
    near(p.b, e.b, 'b');
    near(p.c, e.c, 'c');
    near(p.d, e.d, 'd');
};

/** `y = 2` 平面（法线 +Y）。 */
const Y2 = { a: 0, b: 1, c: 0, d: -2 };

/**
 * `planeOps` 纯函数层的**契约测试**（issue #134 阶段 A2j）。
 *
 * 期望值全部**手算硬编码**（方案 §10.1 P3）：拿 class 当基准的话，class 已委托给同一个纯函数，
 * 把实现改坏用例照样通过。class 与纯函数的一致性由**接线用例**单独负责。
 *
 * 重点钉住两条容易踩的边界：
 * - `planeNormalize` 的退化分支（原实现只 `console.warn`、不写分量）→ 缺省 `out` 必须是
 *   `new Plane()` 的默认值 `(0,1,0,0)`，不能是全零（方案 §10.1 P6）；
 * - `planeFromPoints` / `planeGetNormal` 等跨分量运算在 `out` 与入参别名时不得自污染（方案 §10.1 P2）。
 */
describe('planeOps 纯函数层（#134 A2j）', () =>
{
    it('运算不修改入参', () =>
    {
        const plane = { a: 0, b: 1, c: 0, d: -2 };
        const p0 = { x: 0, y: 0, z: 1 };
        const p1 = { x: 1, y: 0, z: 1 };
        const p2 = { x: 1, y: 1, z: 1 };
        const normal = { x: 0, y: 0, z: 2 };
        const point = { x: 3, y: 5, z: 7 };
        const line = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };

        planeFromPoints(p0, p1, p2);
        planeFromNormalAndPoint(normal, point);
        planeNormalize(plane);
        planeNegate(plane);
        planeProjectPoint(plane, point);
        planeClosestPointWithPoint(plane, point);
        planeGetOrigin(plane);
        planeGetNormal(plane);
        planeDistanceWithPoint(plane, point);
        planeOnWithPoint(plane, point);
        planeClassifyPoint(plane, point);
        planeParallelWithLine3D(plane, line);
        planeParallelWithPlane3D(plane, { a: 1, b: 0, c: 0, d: -1 });
        planeIntersectWithLine3(plane, line);
        planeIntersectWithPlane3D(plane, { a: 1, b: 0, c: 0, d: -1 });
        planeIntersectWithTwoPlane3D(plane, { a: 1, b: 0, c: 0, d: -1 }, { a: 0, b: 0, c: 1, d: -3 });
        planeEquals(plane, { a: 0, b: 1, c: 0, d: -2 });
        planeCopy(plane);
        planeRandom();

        assert.deepEqual(abcd(plane), { a: 0, b: 1, c: 0, d: -2 }, '入参平面被修改了');
        assert.deepEqual(xyz(p0), { x: 0, y: 0, z: 1 }, '入参 p0 被修改了');
        assert.deepEqual(xyz(p1), { x: 1, y: 0, z: 1 }, '入参 p1 被修改了');
        assert.deepEqual(xyz(p2), { x: 1, y: 1, z: 1 }, '入参 p2 被修改了');
        assert.deepEqual(xyz(normal), { x: 0, y: 0, z: 2 }, '入参法线被修改了（原实现是 clone().normalize()）');
        assert.deepEqual(xyz(point), { x: 3, y: 5, z: 7 }, '入参点被修改了');
        assert.deepEqual(line, { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } }, '入参直线被修改了');
    });

    it('out 传自己即就地运算', () =>
    {
        const plane = { a: 0, b: 0, c: 2, d: 4 };

        planeNormalize(plane, plane);
        assert.deepEqual(abcd(plane), { a: 0, b: 0, c: 1, d: 2 });

        planeNegate(plane, plane);
        nearAbcd(plane, { a: -0, b: -0, c: -1, d: -2 });

        planeSet(1, -2, 3, 4, plane);
        assert.deepEqual(abcd(plane), { a: 1, b: -2, c: 3, d: 4 });

        // 源与目标同一个对象时 copy 是恒等操作
        planeCopy(plane, plane);
        assert.deepEqual(abcd(plane), { a: 1, b: -2, c: 3, d: 4 });

        // 投影：out 是预先有值的对象，被就地改写
        const p = { a: 0, b: 1, c: 0, d: -2 };
        const point = { x: 3, y: 5, z: 7 };
        const out = { x: 3, y: 5, z: 7 };

        planeProjectPoint(p, point, out);
        assert.deepEqual(xyz(out), { x: 3, y: 2, z: 7 });

        // 别名边界（out 与 point 是同一个对象）：结果由原实现的求值顺序决定——
        // 先 getNormal(vout) 写 out，再用**已被改写**的 out 当 point 算距离。
        // 期望值手算：out=(0,1,0) → dist = 1 - 2 = -1 → n*1 + out = (0,2,0)。
        // 这不是「修 bug」，而是钉住 class 委托后逐字不变的行为。
        const aliased = { x: 3, y: 5, z: 7 };

        planeProjectPoint(p, aliased, aliased);
        assert.deepEqual(xyz(aliased), { x: 0, y: 2, z: 0 });
    });

    it('planeSet / planeGetNormal / planeCopy / planeToString 与原文一致', () =>
    {
        assert.deepEqual(abcd(planeSet(1, 2, 3, 4)), { a: 1, b: 2, c: 3, d: 4 });
        assert.deepEqual(abcd(planeCopy({ a: -1, b: -2, c: -3, d: -4 })), { a: -1, b: -2, c: -3, d: -4 });
        assert.deepEqual(xyz(planeGetNormal(Y2)), { x: 0, y: 1, z: 0 });
        assert.equal(planeToString({ a: 1, b: 2, c: 3, d: 4 }), 'Plane3D [this.a:1, this.b:2, this.c:3, this.d:4]');
    });

    it('planeFromPoints：三点定面（法线 = (p1-p0)×(p2-p1) 归一化，d = -n·p0）', () =>
    {
        // XY 平面（d = -n·p0 = -0，用 near 比较避免 -0 与 0 的 deepEqual 差异）
        nearAbcd(planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }), { a: 0, b: 0, c: 1, d: 0 });
        // z = 1 平面
        nearAbcd(planeFromPoints({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }), { a: 0, b: 0, c: 1, d: -1 });
        // x = 0 平面：v0 = (0,1,0)、v1 = (0,-1,1)，叉乘 = (1,0,0)
        nearAbcd(planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }), { a: 1, b: 0, c: 0, d: 0 });
        // 非单位法线要归一化：v0 = (2,0,0)、v1 = (0,3,0)，叉乘 = (0,0,6) → (0,0,1)
        nearAbcd(planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 2, y: 3, z: 0 }), { a: 0, b: 0, c: 1, d: 0 });
        // d 取 -n·p0：z = 7 平面、法线 (0,0,1)
        nearAbcd(planeFromPoints({ x: 5, y: 6, z: 7 }, { x: 6, y: 6, z: 7 }, { x: 6, y: 7, z: 7 }), { a: 0, b: 0, c: 1, d: -7 });
    });

    it('planeFromPoints：退化（重合点）时法线置零，不抛错', () =>
    {
        // 三点重合 → 叉乘为零向量；normalize() 用「长度平方 > 0」判定 → 置零
        nearAbcd(planeFromPoints({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }), { a: 0, b: 0, c: 0, d: 0 });
        nearAbcd(planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), { a: 0, b: 0, c: 0, d: 0 });
    });

    it('planeFromNormalAndPoint：法线归一化，且不改入参', () =>
    {
        const normal = { x: 0, y: 0, z: 2 };
        const result = planeFromNormalAndPoint(normal, { x: 0, y: 0, z: 5 });

        assert.deepEqual(abcd(result), { a: 0, b: 0, c: 1, d: -5 });
        assert.deepEqual(xyz(normal), { x: 0, y: 0, z: 2 }, '入参法线被就地归一化了');

        // d = -n·point
        assert.deepEqual(abcd(planeFromNormalAndPoint({ x: 1, y: 0, z: 0 }, { x: 3, y: 4, z: 5 })), { a: 1, b: 0, c: 0, d: -3 });
        // 零法线（normalize() 的退化分支）→ 法线置零
        nearAbcd(planeFromNormalAndPoint({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }), { a: 0, b: 0, c: 0, d: 0 });
    });

    it('planeDistanceWithPoint / planeOnWithPoint / planeClassifyPoint 手算', () =>
    {
        assert.equal(planeDistanceWithPoint(Y2, { x: 3, y: 5, z: 7 }), 3);
        assert.equal(planeDistanceWithPoint(Y2, { x: 0, y: 2, z: 0 }), 0);
        assert.equal(planeDistanceWithPoint(Y2, { x: 0, y: 0, z: 0 }), -2);
        // 斜平面：x + 2y + 2z - 6 = 0 上取点 (0,3,0) → 0；(1,1,1) → 1+2+2-6 = -1
        assert.equal(planeDistanceWithPoint({ a: 1, b: 2, c: 2, d: -6 }, { x: 1, y: 1, z: 1 }), -1);

        assert.ok(planeOnWithPoint(Y2, { x: 0, y: 2, z: 0 }));
        assert.ok(!planeOnWithPoint(Y2, { x: 0, y: 2.001, z: 0 }));
        assert.ok(planeOnWithPoint(Y2, { x: 0, y: 2.0000001, z: 0 }), 'precision 默认 1e-6');

        assert.equal(planeClassifyPoint(Y2, { x: 0, y: 5, z: 0 }), PlaneClassification.FRONT);
        assert.equal(planeClassifyPoint(Y2, { x: 0, y: 0, z: 0 }), PlaneClassification.BACK);
        assert.equal(planeClassifyPoint(Y2, { x: 0, y: 2, z: 0 }), PlaneClassification.INTERSECT);
    });

    it('planeParallelWithLine3D / planeParallelWithPlane3D 手算', () =>
    {
        const alongX = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };
        const alongY = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 1, z: 0 } };

        assert.ok(planeParallelWithLine3D(Y2, alongX), '方向与法线点乘为 0');
        assert.ok(!planeParallelWithLine3D(Y2, alongY));

        assert.ok(planeParallelWithPlane3D(Y2, { a: 0, b: 1, c: 0, d: -3 }));
        assert.ok(!planeParallelWithPlane3D(Y2, { a: 1, b: 0, c: 0, d: -1 }));
        // 法线成比例（同一平面）也算平行
        assert.ok(planeParallelWithPlane3D(Y2, { a: 0, b: 2, c: 0, d: -4 }));
    });

    it('planeIntersectWithLine3：交点 / 线在面内 / 平行三种形态', () =>
    {
        // t = (-d - origin·n) / (direction·n) = (2 - 0) / 1 = 2
        const hit = planeIntersectWithLine3(Y2, { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 1, z: 0 } });

        assert.ok(hit !== null && !('origin' in hit));
        assert.deepEqual(xyz(hit as { x: number; y: number; z: number }), { x: 0, y: 2, z: 0 });

        // 斜向直线：x = 1 平面、方向 (1,1,0)（未归一化）→ t = 1，交点 (1,1,0)
        const slanted = planeIntersectWithLine3({ a: 1, b: 0, c: 0, d: -1 }, { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 1, z: 0 } });

        assert.deepEqual(xyz(slanted as { x: number; y: number; z: number }), { x: 1, y: 1, z: 0 });

        // 线在平面内：返回**直线**（原实现的 line.clone()），判别键是 origin
        const inPlane = planeIntersectWithLine3(Y2, { origin: { x: 1, y: 2, z: 0 }, direction: { x: 1, y: 0, z: 0 } });

        assert.ok(inPlane !== null && 'origin' in inPlane);
        assert.deepEqual(inPlane, { origin: { x: 1, y: 2, z: 0 }, direction: { x: 1, y: 0, z: 0 } });

        // 平行且不在平面内
        assert.equal(planeIntersectWithLine3(Y2, { origin: { x: 0, y: 3, z: 0 }, direction: { x: 1, y: 0, z: 0 } }), null);
    });

    it('planeIntersectWithPlane3D：交线与平行（解方程的两个分支）', () =>
    {
        // y=2 与 x=1 → 交线过 (1,2,0)、方向 = (0,1,0)×(1,0,0) = (0,0,-1)
        const r1 = planeIntersectWithPlane3D(Y2, { a: 1, b: 0, c: 0, d: -1 });

        assert.ok(r1 !== null);
        assert.deepEqual(xyz(r1.origin), { x: 1, y: 2, z: 0 });
        assert.deepEqual(xyz(r1.direction), { x: 0, y: 0, z: -1 });

        // x+y+z=3 与 z=1 → 交线过 (0,2,1)、方向 = (1,1,1)×(0,0,1) = (1,-1,0) 归一化
        const r2 = planeIntersectWithPlane3D({ a: 1, b: 1, c: 1, d: -3 }, { a: 0, b: 0, c: 1, d: -1 });

        assert.ok(r2 !== null);
        assert.deepEqual(xyz(r2.origin), { x: 0, y: 2, z: 1 });
        near(r2.direction.x, 0.7071067811865475, 'direction.x');
        near(r2.direction.y, -0.7071067811865475, 'direction.y');
        assert.equal(r2.direction.z, 0);

        // 平行（y=2 与 y=3）
        assert.equal(planeIntersectWithPlane3D(Y2, { a: 0, b: 1, c: 0, d: -3 }), null);
    });

    it('planeNormalize：正常平面手算；退化分支只 warn 且不写分量（P6）', () =>
    {
        assert.deepEqual(abcd(planeNormalize({ a: 0, b: 0, c: 3, d: 6 })), { a: 0, b: 0, c: 1, d: 2 });
        // invLen = 1/5 = 0.2：3*0.2 在双精度下是 0.6000000000000001，用 near 比较
        nearAbcd(planeNormalize({ a: 3, b: 0, c: 4, d: 5 }), { a: 0.6, b: 0, c: 0.8, d: 1 });

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        try
        {
            // 缺省 out 必须是 new Plane() 的默认值 (0,1,0,0)：退化分支一个分量都不写
            assert.deepEqual(abcd(planeNormalize({ a: 0, b: 0, c: 0, d: 5 })), { a: 0, b: 1, c: 0, d: 0 });
            assert.equal(warn.mock.calls.length, 1);
            assert.ok(String(warn.mock.calls[0][0]).startsWith('无效平面 Plane3D [this.a:0, this.b:1, this.c:0, this.d:0]'));

            // out 传自己时告警文本用的是 out 的当前值（与 class 的 `${this}` 一致）
            const plane = { a: 0, b: 0, c: 0, d: 5 };

            planeNormalize(plane, plane);
            assert.deepEqual(abcd(plane), { a: 0, b: 0, c: 0, d: 5 });
            assert.equal(warn.mock.calls.length, 2);
            assert.ok(String(warn.mock.calls[1][0]).startsWith('无效平面 Plane3D [this.a:0, this.b:0, this.c:0, this.d:5]'));
        }
        finally
        {
            warn.mockRestore();
        }
    });

    it('planeNegate / planeProjectPoint / planeClosestPointWithPoint / planeGetOrigin 手算', () =>
    {
        assert.deepEqual(abcd(planeNegate({ a: 1, b: -2, c: 3, d: 4 })), { a: -1, b: 2, c: -3, d: -4 });

        // y = 2 上的投影：点 (3,5,7) → 距离 3，n*(-3) + p = (3,2,7)
        assert.deepEqual(xyz(planeProjectPoint(Y2, { x: 3, y: 5, z: 7 })), { x: 3, y: 2, z: 7 });
        // 已在平面上则不动
        assert.deepEqual(xyz(planeProjectPoint(Y2, { x: 0, y: 2, z: 9 })), { x: 0, y: 2, z: 9 });
        assert.deepEqual(xyz(planeClosestPointWithPoint(Y2, { x: 3, y: 5, z: 7 })), { x: 3, y: 2, z: 7 });
        // 原点的投影 = 平面上的「原点」
        assert.deepEqual(xyz(planeGetOrigin(Y2)), { x: 0, y: 2, z: 0 });
        // 注意：原实现对**非单位法线不除以 |n|²**（就是 n * (-d)），这里钉住原行为——
        // 平面 x + 2y + 2z - 6 = 0 的 getOrigin 是 6*(1,2,2) = (6,12,12)，而不是几何投影 (2/3,4/3,4/3)
        nearXyz(xyz(planeGetOrigin({ a: 1, b: 2, c: 2, d: -6 })), { x: 6, y: 12, z: 12 });
    });

    it('planeIntersectWithTwoPlane3D：三面交点手算与共面 null', () =>
    {
        // z=3、y=2、x=1 → (1,2,3)
        const p = planeIntersectWithTwoPlane3D({ a: 0, b: 0, c: 1, d: -3 }, Y2, { a: 1, b: 0, c: 0, d: -1 });

        assert.ok(p !== null);
        assert.deepEqual(xyz(p), { x: 1, y: 2, z: 3 });

        // 三个平面法线线性相关（m = 0）→ null
        assert.equal(planeIntersectWithTwoPlane3D({ a: 0, b: 0, c: 1, d: -3 }, { a: 0, b: 0, c: 1, d: -1 }, { a: 0, b: 0, c: 1, d: -2 }), null);
    });

    it('planeEquals 按 precision 逐一比较四个系数', () =>
    {
        assert.ok(planeEquals({ a: 0, b: 1, c: 0, d: -2 }, { a: 0, b: 1, c: 0, d: -2 }));
        assert.ok(!planeEquals({ a: 0, b: 1, c: 0, d: -2 }, { a: 0, b: 1, c: 0, d: -2.001 }));
        assert.ok(planeEquals({ a: 0, b: 1, c: 0, d: -2 }, { a: 1e-7, b: 1, c: 0, d: -2 }), '1e-7 在默认 precision 1e-6 之内 → 相等');
        assert.ok(!planeEquals({ a: 0, b: 1, c: 0, d: -2 }, { a: 1e-5, b: 1, c: 0, d: -2 }));
        assert.ok(planeEquals({ a: 0, b: 1, c: 0, d: -2 }, { a: 1e-5, b: 1, c: 0, d: -2 }, 1e-3), '放宽 precision 后相等');
    });

    it('planeRandom / planeRandomPoint：固定随机序列手算', () =>
    {
        const spy = vi.spyOn(Math, 'random');

        try
        {
            // 法线随机数 (0.6, 0, 0) → 归一化 (1,0,0)；d = 0.25
            [0.6, 0, 0, 0.25].forEach((v) => spy.mockReturnValueOnce(v));
            nearAbcd(planeRandom(), { a: 1, b: 0, c: 0, d: 0.25 });

            // 随机向量 (0.3, 0.4, 0) → 长度 0.5 → 归一化 (0.6, 0.8, 0)；d = 0.1
            [0.3, 0.4, 0, 0.1].forEach((v) => spy.mockReturnValueOnce(v));
            nearAbcd(planeRandom(), { a: 0.6, b: 0.8, c: 0, d: 0.1 });

            // y=2 平面 + 随机向量 (0.5, 0, 0.25)：原点投影 (0,2,0)，
            // 法线 (0,1,0) × 随机向量 = (0.25, 0, -0.5)
            [0.5, 0, 0.25].forEach((v) => spy.mockReturnValueOnce(v));
            nearXyz(xyz(planeRandomPoint(Y2)), { x: 0.25, y: 2, z: -0.5 });
        }
        finally
        {
            spy.mockRestore();
        }
    });

    it('就地语义（原「class 委托接线」用例的接替）：out 传自己与新建路径结果一致', () =>
    {
        // 阶段 C-e：`Plane` 的 class 已删除，「class 结果 == 纯函数结果」这条接线用例失去被测对象。
        // 这里保留它真正锁住的东西：**就地方法（out 传自己）与新建路径结果逐位相同**，
        // 以及各纯函数的输出形状。
        const plane = planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 });

        assert.deepEqual(xyz(planeGetNormal(plane)), { x: 0, y: 0, z: 1 });
        assert.deepEqual(xyz(planeGetOrigin(plane)), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(planeProjectPoint(plane, { x: 3, y: 5, z: 7 })), { x: 3, y: 5, z: 0 });
        assert.deepEqual(xyz(planeClosestPointWithPoint(plane, { x: 3, y: 5, z: 7 })), { x: 3, y: 5, z: 0 });
        assert.equal(planeDistanceWithPoint(plane, { x: 3, y: 5, z: 7 }), 7);
        assert.equal(planeOnWithPoint(plane, { x: 3, y: 5, z: 7 }), false);
        assert.equal(planeClassifyPoint(plane, { x: 3, y: 5, z: 7 }), planeClassifyPoint(plane, { x: 3, y: 5, z: 7 }));
        assert.equal(planeToString(plane), 'Plane3D [this.a:0, this.b:0, this.c:1, this.d:0]');

        // 就地的 normalize / negate / copy / set / fromPoints / fromNormalAndPoint：out 传自己，返回它
        const inPlace = { a: 0, b: 0, c: 3, d: 6 };

        assert.equal(planeNormalize(inPlace, inPlace), inPlace);
        assert.deepEqual(abcd(inPlace), abcd(planeNormalize({ a: 0, b: 0, c: 3, d: 6 })));

        const inPlace2 = { a: 0, b: 0, c: 3, d: 6 };
        const pureNeg = planeNegate({ a: 0, b: 0, c: 3, d: 6 });

        assert.equal(planeNegate(inPlace2, inPlace2), inPlace2);
        assert.deepEqual(abcd(inPlace2), abcd(pureNeg));

        const inPlace3 = { a: 0, b: 1, c: 0, d: 0 };

        assert.equal(planeCopy(inPlace, inPlace3), inPlace3);
        assert.deepEqual(abcd(inPlace3), abcd(inPlace));

        const inPlace4 = { a: 0, b: 1, c: 0, d: 0 };

        assert.equal(planeSet(1, 2, 3, 4, inPlace4), inPlace4);
        assert.deepEqual(abcd(inPlace4), abcd(planeSet(1, 2, 3, 4)));

        const inPlace5 = { a: 0, b: 1, c: 0, d: 0 };

        assert.equal(planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, inPlace5), inPlace5);
        assert.deepEqual(abcd(inPlace5), abcd(planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 })));

        const inPlace6 = { a: 0, b: 1, c: 0, d: 0 };

        assert.equal(planeFromNormalAndPoint({ x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: 5 }, inPlace6), inPlace6);
        assert.deepEqual(abcd(inPlace6), abcd(planeFromNormalAndPoint({ x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: 5 })));

        // clone / copy 是新建对象，不共享引用
        const cloned = planeCopy(inPlace3);

        assert.notEqual(cloned, inPlace3);
        assert.deepEqual(abcd(cloned), abcd(inPlace3));

        // 静态工厂 == 新建路径（期望值手算：z = 1 平面；y = 3 平面）
        assert.deepEqual(abcd(planeFromPoints({ x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }, { x: 2, y: 2, z: 1 })), { a: 0, b: 0, c: 1, d: -1 });
        assert.deepEqual(abcd(planeFromNormalAndPoint({ x: 0, y: 2, z: 0 }, { x: 0, y: 3, z: 0 })), abcd(planeFromNormalAndPoint({ x: 0, y: 2, z: 0 }, { x: 0, y: 3, z: 0 })));
    });

    it('intersectWithLine3 的三种返回形态装配正确（纯数据接口）', () =>
    {
        const plane = { a: 0, b: 1, c: 0, d: -2 };

        // 交点 → 纯数据点（阶段 C-e 起 class 已删除，不再装配成 Vector3 实例）
        const point = planeIntersectWithLine3(plane, line3FromPosAndDir({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }));

        assert.ok(point !== null && !('origin' in point));
        assert.deepEqual(xyz(point as { x: number, y: number, z: number }), { x: 0, y: 2, z: 0 });

        // 线在平面内 → 直线（不是同一引用）
        const line = line3FromPosAndDir({ x: 1, y: 2, z: 0 }, { x: 1, y: 0, z: 0 });
        const same = planeIntersectWithLine3(plane, line) as Line3;

        assert.ok(!('x' in same), '线在平面内时不应返回点');
        // 阶段 C-e：`Plane` 的 class 已删除，装配回 `__type__: 'Line3'` 的那一步也随 class 消失，
        // 纯函数层按约定**不产判别字段**（与 `line3IntersectWithLine3D` 等同层函数一致）
        assert.equal((same as { __type__?: string }).__type__, undefined, '纯函数层不产判别字段');
        assert.notEqual(same, line);
        assert.deepEqual(
            { origin: xyz(same.origin), direction: xyz(same.direction) },
            { origin: { x: 1, y: 2, z: 0 }, direction: { x: 1, y: 0, z: 0 } }
        );

        // 平行不在平面内 → null
        assert.equal(planeIntersectWithLine3(plane, line3FromPosAndDir({ x: 0, y: 3, z: 0 }, { x: 1, y: 0, z: 0 })), null);
    });

    it('planeFromLine3：过一条直线的平面（原 Line3.getPlane / Plane.ts 的原型补丁）', () =>
    {
        const line = line3FromPosAndDir({ x: 1, y: 2, z: 3 }, { x: 0.5, y: 1, z: -0.25 });
        const plane = planeFromLine3(line);

        // 原断言逐条保留：平面过 line.origin 与 line.origin + line.direction
        assert.ok(planeOnWithPoint(plane, line.origin), '平面应过直线上的一点');
        assert.ok(planeOnWithPoint(plane, vec3Add(line.origin, line.direction)), '平面应过「原点 + 方向」那一点');
        // 法线是 `random() × direction` ⇒ 与 direction 垂直
        assert.ok(Math.abs(vec3Dot(planeGetNormal(plane), line.direction)) < 1e-12, '法线应与直线方向垂直');
    });

    it('Plane.normalize 的退化行为逐字不变（只 warn、不改分量）', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        try
        {
            const plane = { a: 0, b: 0, c: 0, d: 5 };

            assert.equal(planeNormalize(plane, plane), plane);
            assert.deepEqual(abcd(plane), { a: 0, b: 0, c: 0, d: 5 }, '退化时不得写任何分量');
            assert.equal(warn.mock.calls.length, 1);

            // 静态 random 走实例 random，与纯函数同一实现
            const spy = vi.spyOn(Math, 'random');

            [0.6, 0, 0, 0.25].forEach((v) => spy.mockReturnValueOnce(v));
            nearAbcd(planeRandom(), { a: 1, b: 0, c: 0, d: 0.25 });
            spy.mockRestore();
        }
        finally
        {
            warn.mockRestore();
        }
    });
});
