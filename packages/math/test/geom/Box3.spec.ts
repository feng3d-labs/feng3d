import { Box3 } from '../../src/geom/Box3';
import { mat4FromAxisRotate, mat4FromPosition, mat4FromScale } from '../../src/geom/matrix4x4Ops';
import { Plane } from '../../src/geom/Plane';
import { tri3GetPoints, tri3FromPoints } from '../../src/geom/triangle3Ops';
import type { Triangle3, WritableTriangle3Like } from '../../src/geom/triangle3Ops';
import { Vector3 } from '../../src/geom/Vector3';

import { assert, describe, it } from 'vitest';
const { equal, deepEqual } = assert;

describe('Box3', () =>
{
    it('construct', () =>
    {
        const box = new Box3();

        // 默认构造出的是「空盒」：min 为 +Infinity、max 为 -Infinity，
        // 这样逐个 includePoint 收点时才不会漏掉任何点
        deepEqual(box.min, new Vector3(Number(Infinity), Number(Infinity), Number(Infinity)));
        deepEqual(box.max, new Vector3(-Infinity, -Infinity, -Infinity));
        assert.ok(box.isEmpty());
    });

    it('copy', () =>
    {
        const a = new Box3();
        const b = new Box3();
        a.max.set(1, 2, 3);
        b.copy(a);
        deepEqual(a, b);
    });

    it('clone', () =>
    {
        const a = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
        const b = a.clone();

        deepEqual(a, b);

        equal(a === b, false);
    });

    it('extend', () =>
    {
        let a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        let b = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
        a.union(b);
        deepEqual(a, b);

        a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        b = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
        b.union(a);
        deepEqual(b.min, new Vector3(-2, -2, -2));
        deepEqual(b.max, new Vector3(2, 2, 2));

        a = new Box3(new Vector3(-2, -1, -1), new Vector3(2, 1, 1));
        b = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        b.union(a);
        deepEqual(a.min, new Vector3(-2, -1, -1));
        deepEqual(a.max, new Vector3(2, 1, 1));
    });

    it('extend', () =>
    {
        const a = new Box3();
        const b = new Box3();

        // Same aabb
        a.min.set(-1, -1, 0);
        a.max.set(1, 1, 0);
        b.min.set(-1, -1, 0);
        b.max.set(1, 1, 0);
        assert.ok(a.overlaps(b), 'should detect overlap');

        // Corner overlaps
        b.min.set(1, 1, 0);
        b.max.set(2, 2, 0);
        assert.ok(a.overlaps(b), 'should detect corner overlap');

        // Separate
        b.min.set(1.1, 1.1, 0);
        assert.ok(!a.overlaps(b), 'should detect separated');

        // fully inside
        b.min.set(-0.5, -0.5, 0);
        b.max.set(0.5, 0.5, 0);
        assert.ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');
        b.min.set(-1.5, -1.5, 0);
        b.max.set(1.5, 1.5, 0);
        assert.ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');

        // Translated
        b.min.set(-3, -0.5, 0);
        b.max.set(-2, 0.5, 0);
        assert.ok(!a.overlaps(b), 'should detect translated');
    });

    it('contains', () =>
    {
        const a = new Box3();
        const b = new Box3();

        a.min.set(-1, -1, -1);
        a.max.set(1, 1, 1);
        b.min.set(-1, -1, -1);
        b.max.set(1, 1, 1);

        assert.ok(a.contains(b));

        a.min.set(-2, -2, -2);
        a.max.set(2, 2, 2);

        assert.ok(a.contains(b));

        b.min.set(-3, -3, -3);
        b.max.set(3, 3, 3);

        equal(a.contains(b), false);

        a.min.set(0, 0, 0);
        a.max.set(2, 2, 2);
        b.min.set(-1, -1, -1);
        b.max.set(1, 1, 1);

        equal(a.contains(b), false);
    });

    it('intersectsTriangle', () =>
    {
        const aabb = new Box3().random();
        const triangle = tri3FromPoints(aabb.randomPoint(), aabb.randomPoint(), aabb.randomPoint());
        assert.ok(
            aabb.intersectsTriangle(triangle)
        );

        const triangle1 = tri3FromPoints(aabb.randomPoint(), aabb.randomPoint().addNumber(5), aabb.randomPoint().addNumber(6));
        assert.ok(
            aabb.intersectsTriangle(triangle1)
        );

        //
        const aabb2 = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const triangle2: Triangle3 = {
            __type__: 'Triangle3',
            p0: new Vector3(1.5, 0, 0), p1: new Vector3(0, 1.5, 0), p2: new Vector3(1.5, 1.5, 0),
        };
        assert.ok(
            aabb2.intersectsTriangle(triangle2)
        );
    });

    // ───────────────────────── 以下为本轮新增用例 ─────────────────────────

    it('getCenter / getSize 与 min、max 的定义式一致', () =>
    {
        const box = new Box3(new Vector3(1, 2, 3), new Vector3(4, 6, 8));

        deepEqual(box.getCenter(), new Vector3(2.5, 4, 5.5));
        deepEqual(box.getSize(), new Vector3(3, 4, 5));

        // 对称盒的中心是原点
        deepEqual(new Box3(new Vector3(-2, -4, -6), new Vector3(2, 4, 6)).getCenter(), new Vector3(0, 0, 0));

        // 传入 vout 时返回的就是 vout
        const out = new Vector3();
        assert.ok(box.getCenter(out) === out);
        assert.ok(box.getSize(out) === out);
        deepEqual(out, new Vector3(3, 4, 5));

        // 空盒的尺寸按实现约定记为零向量（不是 Infinity，也不是 NaN）
        deepEqual(new Box3().getSize(), new Vector3(0, 0, 0));

        // 退化盒（min === max）尺寸为零，但它不是空盒
        const point = new Box3(new Vector3(1, 1, 1), new Vector3(1, 1, 1));
        assert.ok(!point.isEmpty());
        deepEqual(point.getSize(), new Vector3(0, 0, 0));
    });

    it('init 直接替换 min / max 引用并返回自身', () =>
    {
        const box = new Box3();
        const min = new Vector3(1, 2, 3);
        const max = new Vector3(4, 5, 6);

        assert.ok(box.init(min, max) === box);
        assert.ok(box.min === min);
        assert.ok(box.max === max);
    });

    it('copy 内容一致但内部向量互相独立', () =>
    {
        const a = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
        const b = new Box3();

        assert.ok(b.copy(a) === b);
        deepEqual(b.min, a.min);
        deepEqual(b.max, a.max);
        assert.ok(b.min !== a.min, 'copy 应写入已有的 min 而不是替换引用');
        assert.ok(b.max !== a.max, 'copy 应写入已有的 max 而不是替换引用');

        // 改 b 不影响 a
        b.min.set(9, 9, 9);
        deepEqual(a.min, new Vector3(-1, -2, -3));
    });

    it('equals 逐分量比较 min 与 max', () =>
    {
        const a = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
        const b = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));

        assert.ok(a.equals(b));

        b.min.x = -1.5;
        assert.ok(!a.equals(b), 'min 不同则不等');

        b.min.x = -1;
        b.max.z = 3.5;
        assert.ok(!a.equals(b), 'max 不同则不等');
    });

    it('empty 重置为「负无穷空盒」并返回自身', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        assert.ok(box.empty() === box);
        assert.ok(box.isEmpty());
        equal(box.min.x, Number(Infinity));
        equal(box.max.x, -Infinity);

        // 空盒可以被 expandByPoint 重新启用（fromPoints 依赖这一点）
        box.expandByPoint(new Vector3(3, 3, 3));
        deepEqual(box.min, new Vector3(3, 3, 3));
        deepEqual(box.max, new Vector3(3, 3, 3));
    });

    it('isEmpty 只要有一个轴 max < min 即为空', () =>
    {
        assert.ok(new Box3().isEmpty());
        assert.ok(!new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0)).isEmpty());
        // 只在一个轴上退化
        assert.ok(new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, -1)).isEmpty());
        assert.ok(!new Box3(new Vector3(0, 0, -1), new Vector3(0, 0, 0)).isEmpty());
        // 其它轴正常、单轴反向
        assert.ok(new Box3(new Vector3(-1, 0, -1), new Vector3(1, -1, 1)).isEmpty());
    });

    it('containsPoint 含边界为真、越界为假', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));

        assert.ok(box.containsPoint(new Vector3(0, 0, 0)));
        // 8 个角点都是「包含」（<= / >= 而非 < / >）
        box.toPoints().forEach((p) => assert.ok(box.containsPoint(p)));
        // 只要有一个轴越界即不包含
        assert.ok(!box.containsPoint(new Vector3(1.001, 0, 0)));
        assert.ok(!box.containsPoint(new Vector3(0, -2.001, 0)));
        assert.ok(!box.containsPoint(new Vector3(0, 0, 3.001)));
    });

    it('expandByPoint 逐分量取 min / max 并返回自身', () =>
    {
        const box = new Box3();
        const point = new Vector3(1, 2, 3);

        assert.ok(box.expandByPoint(point) === box);
        deepEqual(box.min, point);
        deepEqual(box.max, point);
        // 记录的是坐标值，不是点的引用
        assert.ok(box.min !== point && box.max !== point);

        box.expandByPoint(new Vector3(-1, 5, 0));
        deepEqual(box.min, new Vector3(-1, 2, 0));
        deepEqual(box.max, new Vector3(1, 5, 3));

        // 不改动入参
        const p = new Vector3(7, 7, 7);
        box.expandByPoint(p);
        deepEqual(p, new Vector3(7, 7, 7));
    });

    it('formPositions 从坐标列表求包围盒（静态与实例结果一致）', () =>
    {
        const positions = [1, 2, 3, -4, -5, -6, 0, 0, 0];

        const box = Box3.formPositions(positions);
        deepEqual(box.min, new Vector3(-4, -5, -6));
        deepEqual(box.max, new Vector3(1, 2, 3));

        const box2 = new Box3();
        assert.ok(box2.formPositions(positions) === box2);
        assert.ok(box.equals(box2));
        // 就地写入已有的 min / max（不是替换引用）
        assert.ok(box2.min !== box.min);

        // 单个顶点 → 退化盒；空列表 → 空盒
        deepEqual(Box3.formPositions([1, 1, 1]).getSize(), new Vector3(0, 0, 0));
        assert.ok(Box3.formPositions([]).isEmpty());
    });

    it('fromPoints 从点列表求包围盒（先清空、含空列表与单点）', () =>
    {
        const box = Box3.fromPoints([new Vector3(1, 1, 1), new Vector3(-2, 3, 0), new Vector3(0, -5, 4)]);
        deepEqual(box.min, new Vector3(-2, -5, 0));
        deepEqual(box.max, new Vector3(1, 3, 4));

        // 实例方法返回自身，并且先清空（旧内容不会污染结果）
        const box2 = new Box3(new Vector3(-100, -100, -100), new Vector3(100, 100, 100));
        assert.ok(box2.fromPoints([new Vector3(1, 1, 1)]) === box2);
        deepEqual(box2.min, new Vector3(1, 1, 1));
        deepEqual(box2.max, new Vector3(1, 1, 1));

        // 空点列表 → 空盒
        assert.ok(new Box3().fromPoints([]).isEmpty());

        // 不改动入参点
        const p = new Vector3(1, 2, 3);
        new Box3().fromPoints([p]);
        deepEqual(p, new Vector3(1, 2, 3));
    });

    it('toPoints 返回 8 个互不相同的角点，min / max 在其中', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -3), new Vector3(4, 5, 6));
        const points = box.toPoints();

        equal(points.length, 8);

        // 每个分量只能取 min 或 max
        for (const p of points)
        {
            assert.ok(p.x === -1 || p.x === 4);
            assert.ok(p.y === -2 || p.y === 5);
            assert.ok(p.z === -3 || p.z === 6);
        }

        // 8 个角点两两不同，且首尾恰好是 min / max
        equal(new Set(points.map((p) => `${p.x},${p.y},${p.z}`)).size, 8);
        deepEqual(points[0], new Vector3(-1, -2, -3));
        deepEqual(points[7], new Vector3(4, 5, 6));
    });

    it('toPoints 传入数组时就地写入并返回同一个数组', () =>
    {
        const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 2, 3));
        const target = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
        const first = target[0];

        assert.ok(box.toPoints(target) === target);
        // 复用传入的向量，不新建
        assert.ok(target[0] === first);
        equal(new Set(target.map((p) => `${p.x},${p.y},${p.z}`)).size, 8);
        target.forEach((p) => assert.ok(box.containsPoint(p)));
    });

    it('scale 按分量就地缩放 min 与 max', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));

        assert.ok(box.scale(new Vector3(2, 3, 4)) === box);
        deepEqual(box.min, new Vector3(-2, -6, -12));
        deepEqual(box.max, new Vector3(2, 6, 12));
    });

    it('translate / offset / offsetPosition 三者等价', () =>
    {
        const offset = new Vector3(1, 2, 3);

        const a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        assert.ok(a.translate(offset) === a);
        deepEqual(a.min, new Vector3(0, 1, 2));
        deepEqual(a.max, new Vector3(2, 3, 4));
        deepEqual(offset, new Vector3(1, 2, 3), 'translate 不改动入参');

        const b = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        assert.ok(b.offset(1, 2, 3) === b);
        assert.ok(b.equals(a));

        const c = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        assert.ok(c.offsetPosition(new Vector3(1, 2, 3)) === c);
        assert.ok(c.equals(a));
    });

    it('inflate 按直径膨胀（每边各扩张一半），且不返回自身', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        equal(box.inflate(2, 4, 6), undefined);
        deepEqual(box.min, new Vector3(-2, -3, -4));
        deepEqual(box.max, new Vector3(2, 3, 4));
        deepEqual(box.getSize(), new Vector3(4, 6, 8));
    });

    it('inflatePoint 与 inflate 等价，且不改动入参', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const delta = new Vector3(2, 4, 6);

        equal(box.inflatePoint(delta), undefined);
        deepEqual(box.min, new Vector3(-2, -3, -4));
        deepEqual(box.max, new Vector3(2, 3, 4));
        deepEqual(delta, new Vector3(2, 4, 6), 'inflatePoint 不改动入参');
    });

    it('clampPoint / closestPointToPoint：盒外点夹到边界、盒内点不动', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        const out = new Vector3();
        assert.ok(box.clampPoint(new Vector3(5, -5, 0), out) === out);
        deepEqual(out, new Vector3(1, -1, 0));

        // 盒内点不变
        deepEqual(box.clampPoint(new Vector3(0.25, 0, -0.25)), new Vector3(0.25, 0, -0.25));

        // closestPointToPoint 就是 clampPoint
        const target = new Vector3();
        assert.ok(box.closestPointToPoint(new Vector3(-5, 5, 0), target) === target);
        deepEqual(target, new Vector3(-1, 1, 0));

        // 不改动入参
        const p = new Vector3(9, 9, 9);
        box.clampPoint(p);
        deepEqual(p, new Vector3(9, 9, 9));
    });

    it('union 逐分量扩张、返回自身、不改动入参', () =>
    {
        const a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const b = new Box3(new Vector3(0, -2, 2), new Vector3(3, 0, 4));

        assert.ok(a.union(b) === a);
        deepEqual(a.min, new Vector3(-1, -2, -1));
        deepEqual(a.max, new Vector3(3, 1, 4));
        deepEqual(b.min, new Vector3(0, -2, 2), 'union 不改动入参');
        deepEqual(b.max, new Vector3(3, 0, 4));

        // union 的语义是「包含双方的最小盒」
        assert.ok(a.contains(b));
    });

    it('intersection 相交时改写为交集，不相交时返回 null 且不改动自身', () =>
    {
        // 部分重叠
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const other = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
        assert.ok(box.intersection(other) === box);
        deepEqual(box.min, new Vector3(0, 0, 0));
        deepEqual(box.max, new Vector3(1, 1, 1));

        // 一个盒包含另一个：交集是「被包含者」
        const big = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
        const small = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        assert.ok(big.intersection(small) === big);
        deepEqual(big.min, new Vector3(-1, -1, -1));
        deepEqual(big.max, new Vector3(1, 1, 1));

        // 只在一个轴上相交
        const slab = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        slab.intersection(new Box3(new Vector3(0.5, -1, -1), new Vector3(2, 1, 1)));
        deepEqual(slab.min, new Vector3(0.5, -1, -1));
        deepEqual(slab.max, new Vector3(1, 1, 1));

        // 分离：返回 null，且 this 保持原值
        const left = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
        const right = new Box3(new Vector3(2, 0, 0), new Vector3(3, 1, 1));
        equal(left.intersection(right), null);
        deepEqual(left.min, new Vector3(0, 0, 0));
        deepEqual(left.max, new Vector3(1, 1, 1));
    });

    it('intersectionTo 把结果写入 out 且不改动自身', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const other = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));

        const out = new Box3();
        assert.ok(box.intersectionTo(other, out) === out);
        deepEqual(out.min, new Vector3(0, 0, 0));
        deepEqual(out.max, new Vector3(1, 1, 1));
        deepEqual(box.min, new Vector3(-1, -1, -1));

        // 不传 out 时自动新建
        const auto = box.intersectionTo(other);
        assert.ok(auto !== box && auto !== out);
        deepEqual(auto.min, new Vector3(0, 0, 0));

        // 不相交时返回 null
        equal(box.intersectionTo(new Box3(new Vector3(5, 5, 5), new Vector3(6, 6, 6))), null);
    });

    it('intersects：相交 / 包含 / 相切为真，分离为假', () =>
    {
        const a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        assert.ok(a.intersects(new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))));
        assert.ok(a.intersects(new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2))));
        assert.ok(a.intersects(new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5))));
        // 只在一个角点接触
        assert.ok(a.intersects(new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2))));
        // 完全分离
        assert.ok(!a.intersects(new Box3(new Vector3(1.5, 0, 0), new Vector3(2.5, 0.5, 0.5))));
    });

    it('overlaps：包含 / 相切为真，任一轴分离为假', () =>
    {
        const a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        assert.ok(a.overlaps(new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5))));
        // 只在边界相切
        assert.ok(a.overlaps(new Box3(new Vector3(1, -1, -1), new Vector3(2, 1, 1))));
        // 一个轴上分离
        assert.ok(!a.overlaps(new Box3(new Vector3(1.5, -1, -1), new Vector3(2, 1, 1))));
    });

    it('applyMatrix 平移矩阵把盒整体平移', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));

        assert.ok(box.applyMatrix(mat4FromPosition(10, 20, 30)) === box);
        assert.ok(box.min.equals(new Vector3(9, 18, 27)));
        assert.ok(box.max.equals(new Vector3(11, 22, 33)));
    });

    it('applyMatrix 缩放矩阵按分量缩放盒', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));

        box.applyMatrix(mat4FromScale(2, 3, 4));
        assert.ok(box.min.equals(new Vector3(-2, -6, -12)));
        assert.ok(box.max.equals(new Vector3(2, 6, 12)));
    });

    it('applyMatrix 对空盒直接返回自身（不对 Infinity 做变换）', () =>
    {
        const box = new Box3();

        assert.ok(box.applyMatrix(mat4FromPosition(1, 2, 3)) === box);
        assert.ok(box.isEmpty());
        equal(box.min.x, Number(Infinity));
    });

    it('applyMatrix 旋转后仍是「包住变换后角点」的轴对齐盒', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -1), new Vector3(1, 2, 1));
        const mat = mat4FromAxisRotate(Vector3.Z_AXIS, Math.PI / 2);
        const before = box.toPoints().map((p) => p.clone());

        box.applyMatrix(mat);

        // 绕 z 轴转 90°：x / y 方向的跨度互换
        assert.ok(box.getSize().equals(new Vector3(4, 2, 2), 1e-6));
        // 变换前的角点变换后仍被新盒包含（AABB 的定义）
        for (const p of before)
        {
            const moved = p.applyMatrix4x4(mat);
            assert.ok(moved.subTo(box.clampPoint(moved)).length < 1e-6);
        }
    });

    it('applyMatrixTo 结果写入 out、自身不变，不传 out 时新建', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const mat = mat4FromPosition(1, 2, 3);

        const out = new Box3();
        assert.ok(box.applyMatrixTo(mat, out) === out);
        assert.ok(out.min.equals(new Vector3(0, 1, 2)));
        assert.ok(out.max.equals(new Vector3(2, 3, 4)));
        assert.ok(box.min.equals(new Vector3(-1, -1, -1)), 'applyMatrixTo 不改动自身');

        const auto = box.applyMatrixTo(mat);
        assert.ok(auto !== box && auto !== out);
        assert.ok(auto.min.equals(new Vector3(0, 1, 2)));
    });

    it('randomPoint 始终落在盒内（含边界）', () =>
    {
        const box = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
        const out = new Vector3();

        for (let i = 0; i < 20; i++)
        {
            assert.ok(box.randomPoint(out) === out);
            assert.ok(box.containsPoint(out));
        }

        // 不传 out 时返回新向量
        assert.ok(box.containsPoint(box.randomPoint()));
    });

    it('static random 产生非空盒，且能包含自己的 min / max', () =>
    {
        for (let i = 0; i < 10; i++)
        {
            const box = Box3.random();

            assert.ok(!box.isEmpty());
            assert.ok(box.containsPoint(box.min));
            assert.ok(box.containsPoint(box.max));

            const size = box.getSize();
            assert.ok(size.x >= 0 && size.y >= 0 && size.z >= 0);
        }
    });

    it('实例 random 产生 min ∈ [-1, 0]、max ∈ [0, 1] 的非空盒', () =>
    {
        const box = new Box3();

        assert.ok(box.random() === box);
        assert.ok(!box.isEmpty());

        for (const axis of ['x', 'y', 'z'] as const)
        {
            assert.ok(box.min[axis] >= -1 && box.min[axis] <= 0);
            assert.ok(box.max[axis] >= 0 && box.max[axis] <= 1);
        }
    });

    it('intersectsSphere：球心在盒内 / 半径够到 / 够不到', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        // 球心在盒内
        assert.ok(box.intersectsSphere({ center: new Vector3(0, 0, 0), radius: 0.5 }));
        // 球心在盒外，半径刚好够到边界（相切）
        assert.ok(box.intersectsSphere({ center: new Vector3(2, 0, 0), radius: 1 }));
        // 球心在盒外，半径差一点
        assert.ok(!box.intersectsSphere({ center: new Vector3(2, 0, 0), radius: 0.999 }));
        // 球心在角点外：最近点 (1,1,1)，距离平方 3 → 半径 1.75（平方 3.0625）够到、1.7（平方 2.89）够不到
        // （不用 Math.sqrt(3)：它的平方是 2.9999999999999996，相切判定会因浮点误差落空）
        assert.ok(box.intersectsSphere({ center: new Vector3(2, 2, 2), radius: 1.75 }));
        assert.ok(!box.intersectsSphere({ center: new Vector3(2, 2, 2), radius: 1.7 }));
    });

    it('intersectsTriangle：空盒为假、盒内 / 穿过为真、盒外为假', () =>
    {
        assert.ok(!new Box3().intersectsTriangle(
            tri3FromPoints(new Vector3(-1, -1, -1), new Vector3(1, 1, -1), new Vector3(0, 1, 1))
        ), '空盒与任何三角形都不相交');

        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        // 完全在盒内
        assert.ok(box.intersectsTriangle(
            tri3FromPoints(new Vector3(0, 0, 0), new Vector3(0.5, 0, 0), new Vector3(0, 0.5, 0))
        ));
        // 穿过盒子
        assert.ok(box.intersectsTriangle(
            tri3FromPoints(new Vector3(-2, 0, 0), new Vector3(2, 0, 0), new Vector3(0, 2, 0))
        ));
        // 完全在盒外（分离平面上）
        assert.ok(!box.intersectsTriangle(
            tri3FromPoints(new Vector3(5, 5, 5), new Vector3(6, 5, 5), new Vector3(5, 6, 5))
        ));

        // SAT 用的是临时向量，不改动三角形的三个顶点
        const p0 = new Vector3(0, 0, 0);
        const p1 = new Vector3(1, 0, 0);
        const p2 = new Vector3(0, 1, 0);
        const triangle: Triangle3 = { __type__: 'Triangle3', p0, p1, p2 };

        box.intersectsTriangle(triangle);
        assert.ok(triangle.p0 === p0 && triangle.p1 === p1 && triangle.p2 === p2);
        deepEqual(p0, new Vector3(0, 0, 0));
        deepEqual(p1, new Vector3(1, 0, 0));
        deepEqual(p2, new Vector3(0, 1, 0));
    });

    it('toTriangles 输出 12 个三角形并覆盖 8 个角点', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        // C-c 起 `toTriangles` 直接产出**纯数据**三角形（不再装配回 `Triangle3` 实例）
        const triangles = box.toTriangles();

        equal(triangles.length, 12);

        const corners = new Set<string>();
        for (const t of triangles)
        {
            for (const p of tri3GetPoints(t))
            {
                assert.ok(box.containsPoint(p), '三角形顶点应落在盒内');
                corners.add(`${p.x},${p.y},${p.z}`);
            }
        }
        equal(corners.size, 8, '12 个三角形应恰好覆盖 8 个角点');

        // 传入数组时在末尾追加并返回同一个数组
        const target: WritableTriangle3Like[] = [];

        assert.ok(box.toTriangles(target) === target);
        equal(target.length, 12);
    });

    it('toString 输出 min / max 的文本形式', () =>
    {
        const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 2, 3));
        const text = box.toString();

        equal(text, `[AABB] (min=${box.min.toString()}, max=${box.max.toString()})`);
        assert.ok(text.startsWith('[AABB]'));
        assert.ok(text.includes('<0, 0, 0>'));
        assert.ok(text.includes('<1, 2, 3>'));
    });

    describe('rayIntersection', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        it('空盒返回 Number.MAX_VALUE', () =>
        {
            equal(new Box3().rayIntersection(new Vector3(0, 0, 0), new Vector3(1, 0, 0)), Number.MAX_VALUE);
        });

        it('起点在盒内（含边界）返回 0', () =>
        {
            equal(box.rayIntersection(new Vector3(0, 0, 0), new Vector3(1, 0, 0)), 0);
            equal(box.rayIntersection(new Vector3(-1, -1, -1), new Vector3(0, 0, 1)), 0);
            equal(box.rayIntersection(new Vector3(1, 1, 1), new Vector3(0, 1, 0)), 0);
        });

        // 6 个轴向分别从两侧射入：距离 4、法线朝向射线来向
        const cases: [Vector3, Vector3, Vector3][] = [
            [new Vector3(5, 0, 0), new Vector3(-1, 0, 0), new Vector3(1, 0, 0)],
            [new Vector3(-5, 0, 0), new Vector3(1, 0, 0), new Vector3(-1, 0, 0)],
            [new Vector3(0, 5, 0), new Vector3(0, -1, 0), new Vector3(0, 1, 0)],
            [new Vector3(0, -5, 0), new Vector3(0, 1, 0), new Vector3(0, -1, 0)],
            [new Vector3(0, 0, 5), new Vector3(0, 0, -1), new Vector3(0, 0, 1)],
            [new Vector3(0, 0, -5), new Vector3(0, 0, 1), new Vector3(0, 0, -1)],
        ];

        cases.forEach(([position, direction, normal]) =>
        {
            it(`从 ${position.toString()} 沿 ${direction.toString()} 射入：距离 4、法线 ${normal.toString()}`, () =>
            {
                const outNormal = new Vector3(-9, -9, -9);

                equal(box.rayIntersection(position, direction, outNormal), 4);
                deepEqual(outNormal, normal);
            });
        });

        it('不传法线时仍返回距离', () =>
        {
            equal(box.rayIntersection(new Vector3(5, 0, 0), new Vector3(-1, 0, 0)), 4);
        });

        it('偏离中心但仍命中：距离由入射面决定', () =>
        {
            const outNormal = new Vector3();

            equal(box.rayIntersection(new Vector3(3, 0.5, 0), new Vector3(-1, 0, 0), outNormal), 2);
            deepEqual(outNormal, new Vector3(1, 0, 0));
        });

        it('擦过盒外返回 Number.MAX_VALUE', () =>
        {
            // 沿 -x 射向 (5, 5, 0)：到达 x = 1 时 y 已是 5，在盒外
            equal(box.rayIntersection(new Vector3(5, 5, 0), new Vector3(-1, 0, 0)), Number.MAX_VALUE);
        });

        it('零方向且起点在盒外返回 Number.MAX_VALUE', () =>
        {
            equal(box.rayIntersection(new Vector3(5, 5, 5), new Vector3(0, 0, 0)), Number.MAX_VALUE);
        });
    });

    describe('intersectsPlane（回归 #485）', () =>
    {
        const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        it('平面穿过盒子时为真（角点距离有正有负，且顺序不利）', () =>
        {
            // 反例：-x + 0.5y = 0 —— 8 个角点的距离是 [0.5, -1.5, 1.5, 0.5, 1.5, -1.5, -0.5, -0.5]，
            // 确实有正有负（平面穿过盒子）；修复前 `max` 会停在 -0.5 而返回 false
            expect(box.intersectsPlane(new Plane(-1, 0.5, 0, 0))).toBe(true);
        });

        it('常见方向的穿过平面都为真', () =>
        {
            expect(box.intersectsPlane(new Plane(0, 1, 0, 0)), 'y = 0').toBe(true);
            expect(box.intersectsPlane(new Plane(1, 0, 0, 0)), 'x = 0').toBe(true);
            expect(box.intersectsPlane(new Plane(0, 0, 1, 0)), 'z = 0').toBe(true);
            expect(box.intersectsPlane(new Plane(1, 1, 0, 0)), 'x + y = 0').toBe(true);
            expect(box.intersectsPlane(new Plane(1, 1, 1, -1)), 'x + y + z = 1').toBe(true);
        });

        it('平面完全在盒子一侧时为假（角点距离同号）', () =>
        {
            expect(box.intersectsPlane(new Plane(0, 1, 0, -5)), 'y = 5（盒上方）').toBe(false);
            expect(box.intersectsPlane(new Plane(0, 1, 0, 5)), 'y = -5（盒下方）').toBe(false);
            expect(box.intersectsPlane(new Plane(1, 0, 0, -3)), 'x = 3').toBe(false);
            expect(box.intersectsPlane(new Plane(-1, 0.5, 0, 5)), '倾斜且在盒外').toBe(false);
        });

        it('结果不依赖系数写法（同一平面等价表示结果一致）', () =>
        {
            // (a, b, c, d) 与 (2a, 2b, 2c, 2d)、(a, b, c, d) 取反，描述的是同一个平面
            expect(box.intersectsPlane(new Plane(-1, 0.5, 0, 0))).toBe(true);
            expect(box.intersectsPlane(new Plane(-2, 1, 0, 0))).toBe(true);
            expect(box.intersectsPlane(new Plane(1, -0.5, 0, 0))).toBe(true);
        });
    });
});
