import { assert, describe, it } from 'vitest';
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

/** 6 个都是 y = 0 平面（a=0,b=1,c=0,d=0）——便于手算距离。 */
const mk = () => ({ planes: Array.from({ length: 6 }, () => ({ a: 0, b: 1, c: 0, d: 0 })) });

/**
 * `frustumOps` 纯函数层的**契约测试**（issue #134 阶段 A2o，A2 的最后一个类型）。
 */
describe('frustumOps 纯函数层（#134 A2o）', () =>
{
    it('运算不修改入参', () =>
    {
        const f = mk();
        const p = { x: 0, y: 5, z: 0 };

        frustumContainsPoint(f, p);
        frustumIntersectsSphere(f, { center: p, radius: 1 });
        frustumIntersectsBox(f, { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } });

        assert.deepEqual(f.planes[0], { a: 0, b: 1, c: 0, d: 0 }, '入参平面被修改了');
        assert.deepEqual(p, { x: 0, y: 5, z: 0 }, '入参点被修改了');
    });

    it('containsPoint：平面正侧在内、负侧在外', () =>
    {
        const f = mk();

        assert.ok(frustumContainsPoint(f, { x: 0, y: 5, z: 0 }), '正侧');
        assert.ok(frustumContainsPoint(f, { x: 0, y: 0, z: 0 }), '平面上');
        assert.ok(!frustumContainsPoint(f, { x: 0, y: -5, z: 0 }), '负侧');
    });

    it('intersectsSphere：球心到 6 个平面的距离都不小于 -半径', () =>
    {
        const f = mk();

        assert.ok(frustumIntersectsSphere(f, { center: { x: 0, y: 5, z: 0 }, radius: 1 }));
        // 球心距 5、半径 1 ⇒ 5 < -1 不成立？注意判据是 distance < -radius，5 < -1 为假 ⇒ 相交
        assert.ok(!frustumIntersectsSphere(f, { center: { x: 0, y: -5, z: 0 }, radius: 1 }));
        assert.ok(frustumIntersectsSphere(f, { center: { x: 0, y: 0.5, z: 0 }, radius: 1 }), '跨过平面');
    });

    it('intersectsBox：取盒子相对法线的"最远角"', () =>
    {
        const f = mk();

        assert.ok(frustumIntersectsBox(f, { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }));
        assert.ok(!frustumIntersectsBox(f, { min: { x: 0, y: -2, z: 0 }, max: { x: 1, y: -1, z: 1 } }), '整盒在负侧');
        assert.ok(frustumIntersectsBox(f, { min: { x: 0, y: -1, z: 0 }, max: { x: 1, y: 1, z: 1 } }), '跨过平面');
    });

    it('fromMatrix：正交投影矩阵的 near 平面（WebGPU 坐标系 z→[0,1]）', () =>
    {
        // l=-1,r=1,t=1,b=-1,n=1,f=2 的正交投影矩阵（列主序）
        // 第 6 个平面按 WebGPU 公式取 set(me2, me6, me10, me14) = (0, 0, 1, -1)，即 z = 1
        const me = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1];

        const f = frustumFromMatrix(new Matrix4x4(me as never));

        assert.ok(frustumContainsPoint(f, { x: 0, y: 0, z: 1 }), 'z=1 在 near 平面上');
        assert.ok(!frustumContainsPoint(f, { x: 0, y: 0, z: 0.5 }), 'z=0.5 在 near 平面之内（被裁掉）');
    });

    it('★ frustumSet / frustumCopy 是**就地复制**（写入已有平面，不替换数组元素）', () =>
    {
        const out = { planes: Array.from({ length: 6 }, () => ({ a: 0, b: 0, c: 0, d: 0 })) };
        const keep = out.planes.slice();
        const p0 = new Plane(1, 0, 0, -1);
        const p1 = new Plane(1, 0, 0, 1);

        const r = frustumSet(p0, p1, p1, p1, p1, p1, out);

        assert.equal(r, out, '返回传入的 out');
        for (let i = 0; i < 6; i++)
        {
            assert.equal(out.planes[i], keep[i], `planes[${i}] 的**对象身份**不变（就地写入）`);
        }
        assert.deepEqual(out.planes[0], { a: 1, b: 0, c: 0, d: -1 });
        assert.deepEqual(out.planes[5], { a: 1, b: 0, c: 0, d: 1 });

        // copy 同上：值复制，元素身份保留
        const src = { planes: Array.from({ length: 6 }, (_, i) => ({ a: 0, b: 1, c: 0, d: i })) };
        const dst = { planes: Array.from({ length: 6 }, () => ({ a: 0, b: 0, c: 0, d: 0 })) };
        const dstKeep = dst.planes.slice();

        frustumCopy(src, dst);

        for (let i = 0; i < 6; i++)
        {
            assert.equal(dst.planes[i], dstKeep[i], `copy 后 planes[${i}] 身份不变`);
            assert.deepEqual(dst.planes[i], { a: 0, b: 1, c: 0, d: i });
        }
    });

    it('★ 带判别字段的纯数据与裸字面量走同一份实现（C-c：接口与最小形状同址）', () =>
    {
        const tagged: Frustum = { __type__: 'Frustum', ...mk() };
        const bare = mk();

        assert.equal(frustumContainsPoint(tagged, { x: 0, y: 5, z: 0 }), frustumContainsPoint(bare, { x: 0, y: 5, z: 0 }));
        assert.equal(
            frustumIntersectsSphere(tagged, { center: { x: 0, y: 5, z: 0 }, radius: 1 }),
            frustumIntersectsSphere(bare, { center: { x: 0, y: 5, z: 0 }, radius: 1 }),
        );
        assert.equal(
            frustumIntersectsBox(tagged, { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }),
            frustumIntersectsBox(bare, { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }),
        );
    });
});
