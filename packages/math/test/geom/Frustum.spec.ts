/**
 * @author bhouston / http://exocortex.com
 * @author TristanVALCKE / https://github.com/Itee
 *
 * issue #134 阶段 C-c：`Frustum` 的 class 已删除，本文件由 class 行为用例改写为**同义纯函数用例**，
 * 断言逐条保留（`new Frustum(...)` → 同形字面量、`a.clone()` → `frustumCopy(a)`、
 * `a.set(...)` → `frustumSet(...)`、`a.fromMatrix(m)` → `frustumFromMatrix(m)`、
 * `a.containsPoint(p)` → `frustumContainsPoint(a, p)`、`a.intersectsSphere(s)` →
 * `frustumIntersectsSphere(a, s)`、`a.intersectsBox(b)` → `frustumIntersectsBox(a, b)`）。
 */
import { Box3 } from '../../src/geom/Box3';
import { Matrix4x4 } from '../../src/geom/Matrix4x4';
import { Plane } from '../../src/geom/Plane';
import type { Frustum } from '../../src/geom/frustumOps';
import {
    frustumContainsPoint,
    frustumCopy,
    frustumFromMatrix,
    frustumIntersectsBox,
    frustumIntersectsSphere,
    frustumSet,
} from '../../src/geom/frustumOps';
import { planeCopy, planeEquals } from '../../src/geom/planeOps';
import { Vector3 } from '../../src/geom/Vector3';

import { assert, describe, it } from 'vitest';

/** 6 个"斜率为 1、截距各异"的平面，原来是 `new Frustum(p0, …, p5)` 的入参。 */
const mkPlanes = () => [
    new Plane(1, 0, 0, -1), new Plane(1, 0, 0, 1), new Plane(1, 0, 0, 2),
    new Plane(1, 0, 0, 3), new Plane(1, 0, 0, 4), new Plane(1, 0, 0, 5),
];

/** 6 个可写的平面（`frustumSet` / `frustumCopy` 的 `out` 目标）。 */
const mkOut = () => ({ planes: Array.from({ length: 6 }, () => ({ a: 0, b: 0, c: 0, d: 0 })) });

describe('Frustum', () =>
{
    // INSTANCING
    it('Instancing', () =>
    {
        // C-c：纯数据形态下"构造"就是字面量 —— 6 个平面按**引用**装配
        const ps = mkPlanes();
        const a: Frustum = { __type__: 'Frustum', planes: ps };

        assert.ok(a.planes !== undefined, 'Passed!');
        assert.ok(a.planes.length === 6, 'Passed!');

        for (let i = 0; i < 6; i++)
        {
            assert.ok(a.planes[i] === ps[i], `planes[${i}] 应是调用方传入的那个对象`);
        }

        // 缺省 out（不传 out）必须自带 6 个**可写**的平面槽位，否则 `planeCopy` 无处可写
        const dflt = frustumSet(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5]);

        assert.ok(dflt.planes !== undefined, 'Passed!');
        assert.ok(dflt.planes.length === 6, 'Passed!');
        for (let i = 0; i < 6; i++)
        {
            assert.ok(planeEquals(dflt.planes[i], ps[i]), '缺省 out 收到的是入参平面的分量');
            assert.ok(dflt.planes[i] !== ps[i], '缺省 out 是新建的 6 个对象，不是入参');
        }
    });

    // PUBLIC STUFF
    it('set', () =>
    {
        const ps = mkPlanes();
        const out = mkOut();

        frustumSet(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5], out);

        assert.ok(planeEquals(out.planes[0], ps[0]), 'Check plane #0');
        assert.ok(planeEquals(out.planes[1], ps[1]), 'Check plane #1');
        assert.ok(planeEquals(out.planes[2], ps[2]), 'Check plane #2');
        assert.ok(planeEquals(out.planes[3], ps[3]), 'Check plane #3');
        assert.ok(planeEquals(out.planes[4], ps[4]), 'Check plane #4');
        assert.ok(planeEquals(out.planes[5], ps[5]), 'Check plane #5');
    });

    it('clone', () =>
    {
        const [p0, p1, p2, p3, p4, p5] = mkPlanes();
        const expected = [p0, p1, p2, p3, p4, p5];
        const b: Frustum = { __type__: 'Frustum', planes: expected };

        // 原 `b.clone()`：缺省 out 新建 6 个平面
        const a = frustumCopy(b);

        for (let i = 0; i < 6; i++)
        {
            assert.ok(planeEquals(a.planes[i], expected[i]), 'Passed!');
            assert.ok(a.planes[i] !== expected[i], 'Passed!（clone 必须是新建的对象）');
        }

        // ensure it is a true copy by modifying source
        planeCopy(p1, a.planes[0]);
        assert.ok(planeEquals(b.planes[0], p0), 'Passed!');
        assert.ok(b.planes[0] === p0, 'Passed!（改副本不牵动原对象）');
    });

    it('copy', () =>
    {
        const [p0, p1, p2, p3, p4, p5] = mkPlanes();
        // 源数组刻意保持**可变**（原用例就是靠改它的元素来证明"真拷贝"）
        const planes = [p0, p1, p2, p3, p4, p5];
        const b = { __type__: 'Frustum' as const, planes };
        const a = frustumCopy(b, mkOut());

        for (let i = 0; i < 6; i++)
        {
            assert.ok(planeEquals(a.planes[i], planes[i]), 'Passed!');
        }

        // ensure it is a true copy by modifying source
        planes[0] = p1;
        assert.ok(planeEquals(a.planes[0], p0), 'Passed!');
    });

    it('fromMatrix/makeOrthographic/containsPoint', () =>
    {
        const m = new Matrix4x4().setOrtho(-1, 1, -1, 1, 1, 100);
        const a = frustumFromMatrix(m);

        // WebGPU 约定（相机看 -Z，z→[0,1]）：视锥体在 -Z 方向，测试点 z 取负
        assert.ok(!frustumContainsPoint(a, new Vector3(0, 0, 0)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(0, 0, -50)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(0, 0, -1.001)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(-1, -1, -1.001)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(-1.1, -1.1, -1.001)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(1, 1, -1.001)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(1.1, 1.1, -1.001)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(0, 0, -100)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(-1, -1, -100)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(-1.1, -1.1, -100.1)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(1, 1, -100)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(1.1, 1.1, -100.1)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(0, 0, -101)), 'Passed!');
    });

    it('fromMatrix/makePerspective/containsPoint', () =>
    {
        const m = new Matrix4x4().setPerspective(-1, 1, 1, -1, 1, 100);
        const a = frustumFromMatrix(m);

        // WebGPU 约定（相机看 -Z）：视锥体在 -Z 方向，测试点 z 取负
        assert.ok(!frustumContainsPoint(a, new Vector3(0, 0, 0)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(0, 0, -50)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(0, 0, -1.001)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(-1, -1, -1.001)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(-1.1, -1.1, -1.001)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(1, 1, -1.001)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(1.1, 1.1, -1.001)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(0, 0, -99.999)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(-99.999, -99.999, -99.999)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(-100.1, -100.1, -100.1)), 'Passed!');
        assert.ok(frustumContainsPoint(a, new Vector3(99.999, 99.999, -99.999)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(100.1, 100.1, -100.1)), 'Passed!');
        assert.ok(!frustumContainsPoint(a, new Vector3(0, 0, -101)), 'Passed!');
    });

    it('fromMatrix/makePerspective/intersectsSphere', () =>
    {
        const m = new Matrix4x4().setPerspective(-1, 1, 1, -1, 1, 100);
        const a = frustumFromMatrix(m);
        const s = (x: number, y: number, z: number, radius: number) => ({ center: { x, y, z }, radius });

        // WebGPU 约定（相机看 -Z）：测试球心 z 取负
        assert.ok(!frustumIntersectsSphere(a, s(0, 0, 0, 0)), 'Passed!');
        assert.ok(!frustumIntersectsSphere(a, s(0, 0, 0, 0.9)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(0, 0, 0, 1.1)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(0, 0, -50, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(0, 0, -1.001, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(-1, -1, -1.001, 0)), 'Passed!');
        assert.ok(!frustumIntersectsSphere(a, s(-1.1, -1.1, -1.001, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(-1.1, -1.1, -1.001, 0.5)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(1, 1, -1.001, 0)), 'Passed!');
        assert.ok(!frustumIntersectsSphere(a, s(1.1, 1.1, -1.001, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(1.1, 1.1, -1.001, 0.5)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(0, 0, -99.999, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(-99.999, -99.999, -99.999, 0)), 'Passed!');
        assert.ok(!frustumIntersectsSphere(a, s(-100.1, -100.1, -100.1, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(-100.1, -100.1, -100.1, 0.5)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(99.999, 99.999, -99.999, 0)), 'Passed!');
        assert.ok(!frustumIntersectsSphere(a, s(100.1, 100.1, -100.1, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(100.1, 100.1, -100.1, 0.2)), 'Passed!');
        assert.ok(!frustumIntersectsSphere(a, s(0, 0, -101, 0)), 'Passed!');
        assert.ok(frustumIntersectsSphere(a, s(0, 0, -101, 1.1)), 'Passed!');
    });

    it('intersectsBox', () =>
    {
        const m = new Matrix4x4().setPerspective(-1, 1, 1, -1, 1, 100);
        const a = frustumFromMatrix(m);
        const box = new Box3(Vector3.ZERO.clone(), Vector3.ONE.clone());
        let intersects;

        // 视锥体在 -Z 方向（WebGPU 约定相机看 -Z），原点 box 不相交
        intersects = frustumIntersectsBox(a, box);
        assert.ok(!intersects, 'No intersection');

        // 平移到 -Z 方向（视锥体内）则相交
        box.translate(new Vector3(0, 0, -5));

        intersects = frustumIntersectsBox(a, box);
        assert.ok(intersects, 'Successful intersection');
    });
});
