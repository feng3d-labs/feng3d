import { assert, describe, it } from 'vitest';
import type { Sphere } from '../../src/geom/sphereOps';
import {
    sphereClampPoint,
    sphereContainsPoint,
    sphereDistanceToPoint,
    sphereEquals,
    sphereFromPoints,
    sphereGetBoundingBox,
    sphereIntersectsBox,
    sphereIntersectsPlane,
    sphereIntersectsSphere,
    sphereIsEmpty,
} from '../../src/geom/sphereOps';

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-12, `${msg ?? ''} 期望 ${b} 实际 ${a}`);
const xyz = (v: { x: number; y: number; z: number }) => ({ x: v.x, y: v.y, z: v.z });

const S = { center: { x: 0, y: 0, z: 0 }, radius: 1 };

/**
 * `sphereOps` 纯函数层的**契约测试**（issue #134 阶段 A2n）。
 */
describe('sphereOps 纯函数层（#134 A2n）', () =>
{
    it('运算不修改入参', () =>
    {
        const p = { x: 5, y: 0, z: 0 };

        sphereContainsPoint(S, p);
        sphereDistanceToPoint(S, p);
        sphereClampPoint(S, p);

        assert.deepEqual(S, { center: { x: 0, y: 0, z: 0 }, radius: 1 }, '入参球被修改了');
        assert.deepEqual(p, { x: 5, y: 0, z: 0 }, '入参点被修改了');
    });

    it('out 传自己即就地运算', () =>
    {
        const s = { center: { x: 0, y: 0, z: 0 }, radius: 1 };

        sphereFromPoints([{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }], s);

        assert.deepEqual(xyz(s.center), { x: 1, y: 0, z: 0 });
        near(s.radius, 1, 'radius');
    });

    it('containsPoint / distanceToPoint 与手算一致', () =>
    {
        assert.ok(sphereContainsPoint(S, { x: 1, y: 0, z: 0 }), '球面上属于包含');
        assert.ok(!sphereContainsPoint(S, { x: 2, y: 0, z: 0 }));

        near(sphereDistanceToPoint({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, { x: 5, y: 0, z: 0 }), 3, 'distance');
        near(sphereDistanceToPoint({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, { x: 0, y: 0, z: 0 }), -2, '球心为负');
    });

    it('isEmpty / intersectsSphere / intersectsPlane', () =>
    {
        assert.ok(sphereIsEmpty({ center: { x: 0, y: 0, z: 0 }, radius: 0 }));
        assert.ok(!sphereIsEmpty(S));

        assert.ok(sphereIntersectsSphere({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, { center: { x: 3, y: 0, z: 0 }, radius: 2 }));
        assert.ok(!sphereIntersectsSphere(S, { center: { x: 3, y: 0, z: 0 }, radius: 1 }));

        // 平面 y = 0（单位法线）：球心距 0，相交
        assert.ok(sphereIntersectsPlane(S, { a: 0, b: 1, c: 0, d: 0 }));
        // 球心 (0,5,0) 到平面 y=0 距离 5 > 半径 1：不相交
        assert.ok(!sphereIntersectsPlane({ center: { x: 0, y: 5, z: 0 }, radius: 1 }, { a: 0, b: 1, c: 0, d: 0 }));
    });

    it('clampPoint：球内原样、球外投影到球面', () =>
    {
        assert.deepEqual(xyz(sphereClampPoint(S, { x: 0.5, y: 0, z: 0 })), { x: 0.5, y: 0, z: 0 });
        assert.deepEqual(xyz(sphereClampPoint(S, { x: 5, y: 0, z: 0 })), { x: 1, y: 0, z: 0 });

        // 斜方向：单位向量缩放后落在球面上
        const r = Math.SQRT1_2;

        const clamped = sphereClampPoint(S, { x: 3, y: 3, z: 0 });

        near(clamped.x, r, 'clamped.x');
        near(clamped.y, r, 'clamped.y');
        near(clamped.z, 0, 'clamped.z');
    });

    it('fromPoints：中心取包围盒中心、半径取最远点距离', () =>
    {
        const s = sphereFromPoints([{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 1, y: 2, z: 0 }]);

        assert.deepEqual(xyz(s.center), { x: 1, y: 1, z: 0 });
        near(s.radius, Math.sqrt(2), 'radius');
    });

    it('getBoundingBox / equals', () =>
    {
        const box = sphereGetBoundingBox({ center: { x: 1, y: 2, z: 3 }, radius: 2 });

        assert.deepEqual(xyz(box.min), { x: -1, y: 0, z: 1 });
        assert.deepEqual(xyz(box.max), { x: 3, y: 4, z: 5 });

        assert.ok(sphereEquals(S, { center: { x: 0, y: 0, z: 0 }, radius: 1 }));
        assert.ok(!sphereEquals(S, { center: { x: 1, y: 0, z: 0 }, radius: 1 }));
    });

    it('★ 带判别字段的纯数据与裸字面量走同一份实现（C-c：接口与最小形状同址）', () =>
    {
        const tagged: Sphere = { __type__: 'Sphere', center: { x: 0, y: 0, z: 0 }, radius: 1 };

        assert.equal(sphereContainsPoint(tagged, { x: 1, y: 0, z: 0 }), sphereContainsPoint(S, { x: 1, y: 0, z: 0 }));
        near(sphereDistanceToPoint(tagged, { x: 5, y: 0, z: 0 }), sphereDistanceToPoint(S, { x: 5, y: 0, z: 0 }), 'distance');
        assert.deepEqual(xyz(sphereGetBoundingBox(tagged).min), xyz(sphereGetBoundingBox(S).min));
        assert.ok(sphereEquals(tagged, S), '带判别字段与裸字面量判等');
    });

    it('intersectsBox（C-c 新增）：与 box3IntersectsSphere 共用同一份判据', () =>
    {
        const box = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

        // 球心在盒内
        assert.ok(sphereIntersectsBox({ center: { x: 0, y: 0, z: 0 }, radius: 0.5 }, box));
        // 球心在盒外、半径刚好够到（相切：最近点 (1,0,0)，距离 1）
        assert.ok(sphereIntersectsBox({ center: { x: 2, y: 0, z: 0 }, radius: 1 }, box));
        // 差一点够不到
        assert.ok(!sphereIntersectsBox({ center: { x: 2, y: 0, z: 0 }, radius: 0.999 }, box));
        // 远在天边
        assert.ok(!sphereIntersectsBox({ center: { x: 50, y: 50, z: 50 }, radius: 1 }, box));
    });
});
