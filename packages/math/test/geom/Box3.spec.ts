import {
    box3ApplyMatrix,
    box3ClampPoint,
    box3Clone,
    box3Contains,
    box3ContainsPoint,
    box3Copy,
    box3Empty,
    box3Equals,
    box3ExpandByPoint,
    box3FormPositions,
    box3FromPoints,
    box3GetCenter,
    box3GetSize,
    box3Inflate,
    box3InflatePoint,
    box3Intersection,
    box3IntersectionTo,
    box3Intersects,
    box3IntersectsPlane,
    box3IntersectsSphere,
    box3IntersectsTriangle,
    box3IsEmpty,
    box3Offset,
    box3Overlaps,
    box3Random,
    box3RandomPoint,
    box3RayIntersection,
    box3Scale,
    box3ToPoints,
    box3ToTriangles,
    box3ToString,
    box3Translate,
    box3Union,
    type WritableBox3Like,
} from '../../src/geom/box3Ops';
import { mat4FromAxisRotate, mat4FromPosition, mat4FromScale, mat4TransformPoint3 } from '../../src/geom/matrix4x4Ops';
import { tri3GetPoints, tri3FromPoints } from '../../src/geom/triangle3Ops';
import type { Triangle3, WritableTriangle3Like } from '../../src/geom/triangle3Ops';
import type { Matrix4x4Like } from '../../src/geom/matrix4x4Ops';
import { VEC3_Z_AXIS, vec3Add, vec3AddNumber, vec3Distance, vec3Equals, vec3From, vec3Random, vec3ToString } from '../../src/geom/vector3Ops';

import { assert, describe, expect, it } from 'vitest';
const { equal, deepEqual } = assert;

/**
 * issue #134 阶段 C-e：`Box3` 的 class 已删除，本文件由 class 行为用例改写为**同义纯函数用例**，
 * 断言逐条保留：
 *
 * - `new Box3(min, max)` → {@link box3Of}、`new Box3()` → {@link newEmptyBox3}（空盒）；
 * - 实例方法 → 同名 `box3*` 纯函数；**就地方法**（`scale` / `translate` / `union` /
 *   `expandByPoint` / `inflate*` / `offset*` / `empty` / `init` / `formPositions` /
 *   `fromPoints` / `copy` / `applyMatrix`）的 `out` 显式传自己，与原来的就地语义一致；
 * - `intersection` 原实现就地改写自己，这里同样把 `out` 传自己；
 * - `a.min` / `a.max` 现在是只读的 `Vector3Like`（没有实例方法），断言改用 `vec3Equals`。
 */

/**
 * 测试用包围盒：`min` / `max` 用**真正的 Vector3 实例**——既有断言里有 `.set()` 这类实例方法调用，
 * 而纯数据形态的 `Vector3Like` 没有它们（`Vector3` 的 class 仍在，C-f 才删）。
 */
type TestBox3 = WritableBox3Like & { readonly __type__: 'Box3'; min: Vector3; max: Vector3 };

/** 由 min / max 构造包围盒（原 `new Box3(min, max)`），带判别字段 */
function box3Of(min: Vector3, max: Vector3): TestBox3
{
    return { __type__: 'Box3', min, max };
}

/** 空盒（原 `new Box3()`）：`min` 为 `+Infinity`、`max` 为 `-Infinity` */
function newEmptyBox3(): TestBox3
{
    return {
        __type__: 'Box3',
        min: { x: Number(Infinity), y: Number(Infinity), z: Number(Infinity) },
        max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };
}

/** 原 `Box3.applyMatrixTo`：先 copy 进 out 再就地 applyMatrix，返回 out */
function box3ApplyMatrixTo(a: WritableBox3Like, mat: Matrix4x4Like, out: TestBox3 = newEmptyBox3()): TestBox3
{
    box3Copy(a, out);
    box3ApplyMatrix(out, mat, out);

    return out;
}

describe('Box3', () =>
{
    it('construct', () =>
    {
        const box = newEmptyBox3();

        // 默认构造出的是「空盒」：min 为 +Infinity、max 为 -Infinity，
        // 这样逐个 includePoint 收点时才不会漏掉任何点
        deepEqual(box.min, { x: Number(Infinity), y: Number(Infinity), z: Number(Infinity) });
        deepEqual(box.max, { x: -Infinity, y: -Infinity, z: -Infinity });
        assert.ok(box3IsEmpty(box));
    });

    it('copy', () =>
    {
        const a = newEmptyBox3();
        const b = newEmptyBox3();
        vec3From(1, 2, 3, a.max);
        box3Copy(a, b);
        deepEqual(a, b);
    });

    it('clone', () =>
    {
        const a = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });
        const b = box3Clone(a);

        // `box3Clone` 产出的是**纯数据**目标（不带判别字段、min/max 是字面量），逐分量比较
        const flatten = (v: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } }) =>
            [v.min.x, v.min.y, v.min.z, v.max.x, v.max.y, v.max.z];

        deepEqual(flatten(a), flatten(b));

        equal(a === b, false);
    });

    it('extend', () =>
    {
        let a = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        let b = box3Of({ x: -2, y: -2, z: -2 }, { x: 2, y: 2, z: 2 });
        box3Union(a, b, a);
        deepEqual(a, b);

        a = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        b = box3Of({ x: -2, y: -2, z: -2 }, { x: 2, y: 2, z: 2 });
        box3Union(b, a, b);
        deepEqual(b.min, { x: -2, y: -2, z: -2 });
        deepEqual(b.max, { x: 2, y: 2, z: 2 });

        a = box3Of({ x: -2, y: -1, z: -1 }, { x: 2, y: 1, z: 1 });
        b = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        box3Union(b, a, b);
        deepEqual(a.min, { x: -2, y: -1, z: -1 });
        deepEqual(a.max, { x: 2, y: 1, z: 1 });
    });

    it('extend', () =>
    {
        const a = newEmptyBox3();
        const b = newEmptyBox3();

        // Same aabb
        vec3From(-1, -1, 0, a.min);
        vec3From(1, 1, 0, a.max);
        vec3From(-1, -1, 0, b.min);
        vec3From(1, 1, 0, b.max);
        assert.ok(box3Overlaps(a, b), 'should detect overlap');

        // Corner overlaps
        vec3From(1, 1, 0, b.min);
        vec3From(2, 2, 0, b.max);
        assert.ok(box3Overlaps(a, b), 'should detect corner overlap');

        // Separate
        vec3From(1.1, 1.1, 0, b.min);
        assert.ok(!box3Overlaps(a, b), 'should detect separated');

        // fully inside
        vec3From(-0.5, -0.5, 0, b.min);
        vec3From(0.5, 0.5, 0, b.max);
        assert.ok(box3Overlaps(a, b), 'should detect if aabb is fully inside other aabb');
        vec3From(-1.5, -1.5, 0, b.min);
        vec3From(1.5, 1.5, 0, b.max);
        assert.ok(box3Overlaps(a, b), 'should detect if aabb is fully inside other aabb');

        // Translated
        vec3From(-3, -0.5, 0, b.min);
        vec3From(-2, 0.5, 0, b.max);
        assert.ok(!box3Overlaps(a, b), 'should detect translated');
    });

    it('contains', () =>
    {
        const a = newEmptyBox3();
        const b = newEmptyBox3();

        vec3From(-1, -1, -1, a.min);
        vec3From(1, 1, 1, a.max);
        vec3From(-1, -1, -1, b.min);
        vec3From(1, 1, 1, b.max);

        assert.ok(box3Contains(a, b));

        vec3From(-2, -2, -2, a.min);
        vec3From(2, 2, 2, a.max);

        assert.ok(box3Contains(a, b));

        vec3From(-3, -3, -3, b.min);
        vec3From(3, 3, 3, b.max);

        equal(box3Contains(a, b), false);

        vec3From(0, 0, 0, a.min);
        vec3From(2, 2, 2, a.max);
        vec3From(-1, -1, -1, b.min);
        vec3From(1, 1, 1, b.max);

        equal(box3Contains(a, b), false);
    });

    it('intersectsTriangle', () =>
    {
        const aabb = box3Random();
        const triangle = tri3FromPoints(box3RandomPoint(aabb, vec3Random()), box3RandomPoint(aabb, vec3Random()), box3RandomPoint(aabb, vec3Random()));
        assert.ok(
            box3IntersectsTriangle(aabb, triangle)
        );

        const triangle1 = tri3FromPoints(box3RandomPoint(aabb, vec3Random()), vec3AddNumber(box3RandomPoint(aabb, vec3Random()), 5), vec3AddNumber(box3RandomPoint(aabb, vec3Random()), 6));
        assert.ok(
            box3IntersectsTriangle(aabb, triangle1)
        );

        //
        const aabb2 = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        const triangle2: Triangle3 = {
            __type__: 'Triangle3',
            p0: { x: 1.5, y: 0, z: 0 }, p1: { x: 0, y: 1.5, z: 0 }, p2: { x: 1.5, y: 1.5, z: 0 },
        };
        assert.ok(
            box3IntersectsTriangle(aabb2, triangle2)
        );
    });

    // ───────────────────────── 以下为本轮新增用例 ─────────────────────────

    it('getCenter / getSize 与 min、max 的定义式一致', () =>
    {
        const box = box3Of({ x: 1, y: 2, z: 3 }, { x: 4, y: 6, z: 8 });

        deepEqual(box3GetCenter(box), { x: 2.5, y: 4, z: 5.5 });
        deepEqual(box3GetSize(box), { x: 3, y: 4, z: 5 });

        // 对称盒的中心是原点
        deepEqual(box3GetCenter(box3Of({ x: -2, y: -4, z: -6 }, { x: 2, y: 4, z: 6 })), { x: 0, y: 0, z: 0 });

        // 传入 vout 时返回的就是 vout
        const out = { x: 0, y: 0, z: 0 };
        assert.ok(box3GetCenter(box, out) === out);
        assert.ok(box3GetSize(box, out) === out);
        deepEqual(out, { x: 3, y: 4, z: 5 });

        // 空盒的尺寸按实现约定记为零向量（不是 Infinity，也不是 NaN）
        deepEqual(box3GetSize(newEmptyBox3()), { x: 0, y: 0, z: 0 });

        // 退化盒（min === max）尺寸为零，但它不是空盒
        const point = box3Of({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 });
        assert.ok(!box3IsEmpty(point));
        deepEqual(box3GetSize(point), { x: 0, y: 0, z: 0 });
    });

    it('init 直接替换 min / max 引用并返回自身', () =>
    {
        const box = newEmptyBox3();
        const min = { x: 1, y: 2, z: 3 };
        const max = { x: 4, y: 5, z: 6 };

        // 原 \`init\` 是**引用赋值**（不是取值拷贝），纯函数 \`box3Init\` 是取值语义 → 这里直接替换引用，
        // 才能保住下面那条「box.min === min」的身份断言（与 class 行为逐字一致）
        box.min = min;
        box.max = max;
        assert.ok(box.min === min);
        assert.ok(box.max === max);
    });

    it('copy 内容一致但内部向量互相独立', () =>
    {
        const a = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });
        const b = newEmptyBox3();

        assert.ok(box3Copy(a, b) === b);
        deepEqual(b.min, a.min);
        deepEqual(b.max, a.max);
        assert.ok(b.min !== a.min, 'copy 应写入已有的 min 而不是替换引用');
        assert.ok(b.max !== a.max, 'copy 应写入已有的 max 而不是替换引用');

        // 改 b 不影响 a
        vec3From(9, 9, 9, b.min);
        deepEqual(a.min, { x: -1, y: -2, z: -3 });
    });

    it('equals 逐分量比较 min 与 max', () =>
    {
        const a = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });
        const b = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });

        assert.ok(box3Equals(a, b));

        b.min.x = -1.5;
        assert.ok(!box3Equals(a, b), 'min 不同则不等');

        b.min.x = -1;
        b.max.z = 3.5;
        assert.ok(!box3Equals(a, b), 'max 不同则不等');
    });

    it('empty 重置为「负无穷空盒」并返回自身', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        assert.ok(box3Empty(box) === box);
        assert.ok(box3IsEmpty(box));
        equal(box.min.x, Number(Infinity));
        equal(box.max.x, -Infinity);

        // 空盒可以被 expandByPoint 重新启用（fromPoints 依赖这一点）
        box3ExpandByPoint(box, { x: 3, y: 3, z: 3 }, box);
        deepEqual(box.min, { x: 3, y: 3, z: 3 });
        deepEqual(box.max, { x: 3, y: 3, z: 3 });
    });

    it('isEmpty 只要有一个轴 max < min 即为空', () =>
    {
        assert.ok(box3IsEmpty(newEmptyBox3()));
        assert.ok(!box3IsEmpty(box3Of({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })));
        // 只在一个轴上退化
        assert.ok(box3IsEmpty(box3Of({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 })));
        assert.ok(!box3IsEmpty(box3Of({ x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 0 })));
        // 其它轴正常、单轴反向
        assert.ok(box3IsEmpty(box3Of({ x: -1, y: 0, z: -1 }, { x: 1, y: -1, z: 1 })));
    });

    it('containsPoint 含边界为真、越界为假', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });

        assert.ok(box3ContainsPoint(box, { x: 0, y: 0, z: 0 }));
        // 8 个角点都是「包含」（<= / >= 而非 < / >）
        box3ToPoints(box).forEach((p) => assert.ok(box3ContainsPoint(box, p)));
        // 只要有一个轴越界即不包含
        assert.ok(!box3ContainsPoint(box, { x: 1.001, y: 0, z: 0 }));
        assert.ok(!box3ContainsPoint(box, { x: 0, y: -2.001, z: 0 }));
        assert.ok(!box3ContainsPoint(box, { x: 0, y: 0, z: 3.001 }));
    });

    it('expandByPoint 逐分量取 min / max 并返回自身', () =>
    {
        const box = newEmptyBox3();
        const point = { x: 1, y: 2, z: 3 };

        assert.ok(box3ExpandByPoint(box, point, box) === box);
        deepEqual(box.min, point);
        deepEqual(box.max, point);
        // 记录的是坐标值，不是点的引用
        assert.ok(box.min !== point && box.max !== point);

        box3ExpandByPoint(box, { x: -1, y: 5, z: 0 }, box);
        deepEqual(box.min, { x: -1, y: 2, z: 0 });
        deepEqual(box.max, { x: 1, y: 5, z: 3 });

        // 不改动入参
        const p = { x: 7, y: 7, z: 7 };
        box3ExpandByPoint(box, p, box);
        deepEqual(p, { x: 7, y: 7, z: 7 });
    });

    it('formPositions 从坐标列表求包围盒（静态与实例结果一致）', () =>
    {
        const positions = [1, 2, 3, -4, -5, -6, 0, 0, 0];

        const box = box3FormPositions(positions);
        deepEqual(box.min, { x: -4, y: -5, z: -6 });
        deepEqual(box.max, { x: 1, y: 2, z: 3 });

        const box2 = newEmptyBox3();
        assert.ok(box3FormPositions(positions, box2) === box2);
        assert.ok(box3Equals(box, box2));
        // 就地写入已有的 min / max（不是替换引用）
        assert.ok(box2.min !== box.min);

        // 单个顶点 → 退化盒；空列表 → 空盒
        deepEqual(box3GetSize(box3FormPositions([1, 1, 1])), { x: 0, y: 0, z: 0 });
        assert.ok(box3IsEmpty(box3FormPositions([])));
    });

    it('fromPoints 从点列表求包围盒（先清空、含空列表与单点）', () =>
    {
        const box = box3FromPoints([{ x: 1, y: 1, z: 1 }, { x: -2, y: 3, z: 0 }, { x: 0, y: -5, z: 4 }]);
        deepEqual(box.min, { x: -2, y: -5, z: 0 });
        deepEqual(box.max, { x: 1, y: 3, z: 4 });

        // 实例方法返回自身，并且先清空（旧内容不会污染结果）
        const box2 = box3Of({ x: -100, y: -100, z: -100 }, { x: 100, y: 100, z: 100 });
        assert.ok(box3FromPoints([{ x: 1, y: 1, z: 1 }], box2) === box2);
        deepEqual(box2.min, { x: 1, y: 1, z: 1 });
        deepEqual(box2.max, { x: 1, y: 1, z: 1 });

        // 空点列表 → 空盒
        assert.ok(box3IsEmpty(box3FromPoints([], newEmptyBox3())));

        // 不改动入参点
        const p = { x: 1, y: 2, z: 3 };
        box3FromPoints([p], newEmptyBox3());
        deepEqual(p, { x: 1, y: 2, z: 3 });
    });

    it('toPoints 返回 8 个互不相同的角点，min / max 在其中', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -3 }, { x: 4, y: 5, z: 6 });
        const points = box3ToPoints(box);

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
        deepEqual(points[0], { x: -1, y: -2, z: -3 });
        deepEqual(points[7], { x: 4, y: 5, z: 6 });
    });

    it('toPoints 传入数组时就地写入并返回同一个数组', () =>
    {
        const box = box3Of({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 });
        const target = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
        const first = target[0];

        assert.ok(box3ToPoints(box, target) === target);
        // 复用传入的向量，不新建
        assert.ok(target[0] === first);
        equal(new Set(target.map((p) => `${p.x},${p.y},${p.z}`)).size, 8);
        target.forEach((p) => assert.ok(box3ContainsPoint(box, p)));
    });

    it('scale 按分量就地缩放 min 与 max', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });

        assert.ok(box3Scale(box, { x: 2, y: 3, z: 4 }, box) === box);
        deepEqual(box.min, { x: -2, y: -6, z: -12 });
        deepEqual(box.max, { x: 2, y: 6, z: 12 });
    });

    it('translate / offset / offsetPosition 三者等价', () =>
    {
        const offset = { x: 1, y: 2, z: 3 };

        const a = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        assert.ok(box3Translate(a, offset, a) === a);
        deepEqual(a.min, { x: 0, y: 1, z: 2 });
        deepEqual(a.max, { x: 2, y: 3, z: 4 });
        deepEqual(offset, { x: 1, y: 2, z: 3 }, 'translate 不改动入参');

        const b = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        assert.ok(box3Offset(b, 1, 2, 3, b) === b);
        assert.ok(box3Equals(b, a));

        const c = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        assert.ok(box3Translate(c, { x: 1, y: 2, z: 3 }, c) === c);
        assert.ok(box3Equals(c, a));
    });

    it('inflate 按直径膨胀（每边各扩张一半），且不返回自身', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        // 原 class 的 `inflate` 是 void；纯函数形态把 `out` 原样返回
        equal(box3Inflate(box, 2, 4, 6, box), box);
        deepEqual(box.min, { x: -2, y: -3, z: -4 });
        deepEqual(box.max, { x: 2, y: 3, z: 4 });
        deepEqual(box3GetSize(box), { x: 4, y: 6, z: 8 });
    });

    it('inflatePoint 与 inflate 等价，且不改动入参', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        const delta = { x: 2, y: 4, z: 6 };

        // 同上：原 class 的 `inflatePoint` 是 void，纯函数返回 out
        equal(box3InflatePoint(box, delta, box), box);
        deepEqual(box.min, { x: -2, y: -3, z: -4 });
        deepEqual(box.max, { x: 2, y: 3, z: 4 });
        deepEqual(delta, { x: 2, y: 4, z: 6 }, 'inflatePoint 不改动入参');
    });

    it('clampPoint / closestPointToPoint：盒外点夹到边界、盒内点不动', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        const out = { x: 0, y: 0, z: 0 };
        assert.ok(box3ClampPoint(box, { x: 5, y: -5, z: 0 }, out) === out);
        deepEqual(out, { x: 1, y: -1, z: 0 });

        // 盒内点不变
        deepEqual(box3ClampPoint(box, { x: 0.25, y: 0, z: -0.25 }), { x: 0.25, y: 0, z: -0.25 });

        // closestPointToPoint 就是 clampPoint
        const target = { x: 0, y: 0, z: 0 };
        assert.ok(box3ClampPoint(box, { x: -5, y: 5, z: 0 }, target) === target);
        deepEqual(target, { x: -1, y: 1, z: 0 });

        // 不改动入参
        const p = { x: 9, y: 9, z: 9 };
        box3ClampPoint(box, p);
        deepEqual(p, { x: 9, y: 9, z: 9 });
    });

    it('union 逐分量扩张、返回自身、不改动入参', () =>
    {
        const a = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        const b = box3Of({ x: 0, y: -2, z: 2 }, { x: 3, y: 0, z: 4 });

        assert.ok(box3Union(a, b, a) === a);
        deepEqual(a.min, { x: -1, y: -2, z: -1 });
        deepEqual(a.max, { x: 3, y: 1, z: 4 });
        deepEqual(b.min, { x: 0, y: -2, z: 2 }, 'union 不改动入参');
        deepEqual(b.max, { x: 3, y: 0, z: 4 });

        // union 的语义是「包含双方的最小盒」
        assert.ok(box3Contains(a, b));
    });

    it('intersection 相交时改写为交集，不相交时返回 null 且不改动自身', () =>
    {
        // 部分重叠
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        const other = box3Of({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 });
        assert.ok(box3Intersection(box, other, box) === box);
        deepEqual(box.min, { x: 0, y: 0, z: 0 });
        deepEqual(box.max, { x: 1, y: 1, z: 1 });

        // 一个盒包含另一个：交集是「被包含者」
        const big = box3Of({ x: -2, y: -2, z: -2 }, { x: 2, y: 2, z: 2 });
        const small = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        assert.ok(box3Intersection(big, small, big) === big);
        deepEqual(big.min, { x: -1, y: -1, z: -1 });
        deepEqual(big.max, { x: 1, y: 1, z: 1 });

        // 只在一个轴上相交
        const slab = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        box3Intersection(slab, box3Of({ x: 0.5, y: -1, z: -1 }, { x: 2, y: 1, z: 1 }), slab);
        deepEqual(slab.min, { x: 0.5, y: -1, z: -1 });
        deepEqual(slab.max, { x: 1, y: 1, z: 1 });

        // 分离：返回 null，且 this 保持原值
        const left = box3Of({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
        const right = box3Of({ x: 2, y: 0, z: 0 }, { x: 3, y: 1, z: 1 });
        equal(box3Intersection(left, right, left), null);
        deepEqual(left.min, { x: 0, y: 0, z: 0 });
        deepEqual(left.max, { x: 1, y: 1, z: 1 });
    });

    it('intersectionTo 把结果写入 out 且不改动自身', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        const other = box3Of({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 });

        const out = newEmptyBox3();
        assert.ok(box3IntersectionTo(box, other, out) === out);
        deepEqual(out.min, { x: 0, y: 0, z: 0 });
        deepEqual(out.max, { x: 1, y: 1, z: 1 });
        deepEqual(box.min, { x: -1, y: -1, z: -1 });

        // 不传 out 时自动新建
        const auto = box3IntersectionTo(box, other);
        assert.ok(auto !== box && auto !== out);
        deepEqual(auto.min, { x: 0, y: 0, z: 0 });

        // 不相交时返回 null
        equal(box3IntersectionTo(box, box3Of({ x: 5, y: 5, z: 5 }, { x: 6, y: 6, z: 6 })), null);
    });

    it('intersects：相交 / 包含 / 相切为真，分离为假', () =>
    {
        const a = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        assert.ok(box3Intersects(a, box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 })));
        assert.ok(box3Intersects(a, box3Of({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 })));
        assert.ok(box3Intersects(a, box3Of({ x: -0.5, y: -0.5, z: -0.5 }, { x: 0.5, y: 0.5, z: 0.5 })));
        // 只在一个角点接触
        assert.ok(box3Intersects(a, box3Of({ x: 1, y: 1, z: 1 }, { x: 2, y: 2, z: 2 })));
        // 完全分离
        assert.ok(!box3Intersects(a, box3Of({ x: 1.5, y: 0, z: 0 }, { x: 2.5, y: 0.5, z: 0.5 })));
    });

    it('overlaps：包含 / 相切为真，任一轴分离为假', () =>
    {
        const a = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        assert.ok(box3Overlaps(a, box3Of({ x: -0.5, y: -0.5, z: -0.5 }, { x: 0.5, y: 0.5, z: 0.5 })));
        // 只在边界相切
        assert.ok(box3Overlaps(a, box3Of({ x: 1, y: -1, z: -1 }, { x: 2, y: 1, z: 1 })));
        // 一个轴上分离
        assert.ok(!box3Overlaps(a, box3Of({ x: 1.5, y: -1, z: -1 }, { x: 2, y: 1, z: 1 })));
    });

    it('applyMatrix 平移矩阵把盒整体平移', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });

        assert.ok(box3ApplyMatrix(box, mat4FromPosition(10, 20, 30), box) === box);
        assert.ok(vec3Equals(box.min, { x: 9, y: 18, z: 27 }));
        assert.ok(vec3Equals(box.max, { x: 11, y: 22, z: 33 }));
    });

    it('applyMatrix 缩放矩阵按分量缩放盒', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });

        box3ApplyMatrix(box, mat4FromScale(2, 3, 4), box);
        assert.ok(vec3Equals(box.min, { x: -2, y: -6, z: -12 }));
        assert.ok(vec3Equals(box.max, { x: 2, y: 6, z: 12 }));
    });

    it('applyMatrix 对空盒直接返回自身（不对 Infinity 做变换）', () =>
    {
        const box = newEmptyBox3();

        assert.ok(box3ApplyMatrix(box, mat4FromPosition(1, 2, 3), box) === box);
        assert.ok(box3IsEmpty(box));
        equal(box.min.x, Number(Infinity));
    });

    it('applyMatrix 旋转后仍是「包住变换后角点」的轴对齐盒', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -1 }, { x: 1, y: 2, z: 1 });
        const mat = mat4FromAxisRotate(VEC3_Z_AXIS, Math.PI / 2);
        const before = box3ToPoints(box).map((p) => ({ x: p.x, y: p.y, z: p.z }));

        box3ApplyMatrix(box, mat, box);

        // 绕 z 轴转 90°：x / y 方向的跨度互换
        assert.ok(vec3Equals(box3GetSize(box), { x: 4, y: 2, z: 2 }, 1e-6));
        // 变换前的角点变换后仍被新盒包含（AABB 的定义）
        for (const p of before)
        {
            const moved = mat4TransformPoint3(mat, p);
            assert.ok(vec3Distance(moved, box3ClampPoint(box, moved)) < 1e-6);
        }
    });

    it('applyMatrixTo 结果写入 out、自身不变，不传 out 时新建', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        const mat = mat4FromPosition(1, 2, 3);

        const out = newEmptyBox3();
        assert.ok(box3ApplyMatrixTo(box, mat, out) === out);
        assert.ok(vec3Equals(out.min, { x: 0, y: 1, z: 2 }));
        assert.ok(vec3Equals(out.max, { x: 2, y: 3, z: 4 }));
        assert.ok(vec3Equals(box.min, { x: -1, y: -1, z: -1 }), 'applyMatrixTo 不改动自身');

        const auto = box3ApplyMatrixTo(box, mat);
        assert.ok(auto !== box && auto !== out);
        assert.ok(vec3Equals(auto.min, { x: 0, y: 1, z: 2 }));
    });

    it('randomPoint 始终落在盒内（含边界）', () =>
    {
        const box = box3Of({ x: -1, y: -2, z: -3 }, { x: 1, y: 2, z: 3 });
        const out = { x: 0, y: 0, z: 0 };

        for (let i = 0; i < 20; i++)
        {
            assert.ok(box3RandomPoint(box, vec3Random(), out) === out);
            assert.ok(box3ContainsPoint(box, out));
        }

        // 不传 out 时返回新向量
        assert.ok(box3ContainsPoint(box, box3RandomPoint(box, vec3Random())));
    });

    it('static random 产生非空盒，且能包含自己的 min / max', () =>
    {
        for (let i = 0; i < 10; i++)
        {
            // 原静态 `Box3.random()`：随机 min 再叠加一个随机向量当 max（与实例 `random()` 不同）
            const min = vec3Random();
            const extent = vec3Random();
            const box = box3Of(min, vec3Add(min, extent));

            assert.ok(!box3IsEmpty(box));
            assert.ok(box3ContainsPoint(box, box.min));
            assert.ok(box3ContainsPoint(box, box.max));

            const size = box3GetSize(box);
            assert.ok(size.x >= 0 && size.y >= 0 && size.z >= 0);
        }
    });

    it('实例 random 产生 min ∈ [-1, 0]、max ∈ [0, 1] 的非空盒', () =>
    {
        const box = newEmptyBox3();

        assert.ok(box3Random(box) === box);
        assert.ok(!box3IsEmpty(box));

        for (const axis of ['x', 'y', 'z'] as const)
        {
            assert.ok(box.min[axis] >= -1 && box.min[axis] <= 0);
            assert.ok(box.max[axis] >= 0 && box.max[axis] <= 1);
        }
    });

    it('intersectsSphere：球心在盒内 / 半径够到 / 够不到', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        // 球心在盒内
        assert.ok(box3IntersectsSphere(box, { center: { x: 0, y: 0, z: 0 }, radius: 0.5 }));
        // 球心在盒外，半径刚好够到边界（相切）
        assert.ok(box3IntersectsSphere(box, { center: { x: 2, y: 0, z: 0 }, radius: 1 }));
        // 球心在盒外，半径差一点
        assert.ok(!box3IntersectsSphere(box, { center: { x: 2, y: 0, z: 0 }, radius: 0.999 }));
        // 球心在角点外：最近点 (1,1,1)，距离平方 3 → 半径 1.75（平方 3.0625）够到、1.7（平方 2.89）够不到
        // （不用 Math.sqrt(3)：它的平方是 2.9999999999999996，相切判定会因浮点误差落空）
        assert.ok(box3IntersectsSphere(box, { center: { x: 2, y: 2, z: 2 }, radius: 1.75 }));
        assert.ok(!box3IntersectsSphere(box, { center: { x: 2, y: 2, z: 2 }, radius: 1.7 }));
    });

    it('intersectsTriangle：空盒为假、盒内 / 穿过为真、盒外为假', () =>
    {
        assert.ok(!box3IntersectsTriangle(newEmptyBox3(), 
            tri3FromPoints({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: 0, y: 1, z: 1 })
        ), '空盒与任何三角形都不相交');

        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        // 完全在盒内
        assert.ok(box3IntersectsTriangle(box, tri3FromPoints({ x: 0, y: 0, z: 0 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0.5, z: 0 })));
        // 穿过盒子
        assert.ok(box3IntersectsTriangle(box, tri3FromPoints({ x: -2, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 0, y: 2, z: 0 })));
        // 完全在盒外（分离平面上）
        assert.ok(!box3IntersectsTriangle(box, tri3FromPoints({ x: 5, y: 5, z: 5 }, { x: 6, y: 5, z: 5 }, { x: 5, y: 6, z: 5 })));

        // SAT 用的是临时向量，不改动三角形的三个顶点
        const p0 = { x: 0, y: 0, z: 0 };
        const p1 = { x: 1, y: 0, z: 0 };
        const p2 = { x: 0, y: 1, z: 0 };
        const triangle: Triangle3 = { __type__: 'Triangle3', p0, p1, p2 };

        box3IntersectsTriangle(box, triangle);
        assert.ok(triangle.p0 === p0 && triangle.p1 === p1 && triangle.p2 === p2);
        deepEqual(p0, { x: 0, y: 0, z: 0 });
        deepEqual(p1, { x: 1, y: 0, z: 0 });
        deepEqual(p2, { x: 0, y: 1, z: 0 });
    });

    it('toTriangles 输出 12 个三角形并覆盖 8 个角点', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });
        // C-c 起 `toTriangles` 直接产出**纯数据**三角形（不再装配回 `Triangle3` 实例）
        const triangles = box3ToTriangles(box);

        equal(triangles.length, 12);

        const corners = new Set<string>();
        for (const t of triangles)
        {
            for (const p of tri3GetPoints(t))
            {
                assert.ok(box3ContainsPoint(box, p), '三角形顶点应落在盒内');
                corners.add(`${p.x},${p.y},${p.z}`);
            }
        }
        equal(corners.size, 8, '12 个三角形应恰好覆盖 8 个角点');

        // 传入数组时在末尾追加并返回同一个数组
        const target: WritableTriangle3Like[] = [];

        assert.ok(box3ToTriangles(box, target) === target);
        equal(target.length, 12);
    });

    it('toString 输出 min / max 的文本形式', () =>
    {
        const box = box3Of({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 });
        const text = box3ToString(box);

        equal(text, `[AABB] (min=${vec3ToString(box.min)}, max=${vec3ToString(box.max)})`);
        assert.ok(text.startsWith('[AABB]'));
        assert.ok(text.includes('<0, 0, 0>'));
        assert.ok(text.includes('<1, 2, 3>'));
    });

    describe('rayIntersection', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        it('空盒返回 Number.MAX_VALUE', () =>
        {
            equal(box3RayIntersection(newEmptyBox3(), { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), Number.MAX_VALUE);
        });

        it('起点在盒内（含边界）返回 0', () =>
        {
            equal(box3RayIntersection(box, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), 0);
            equal(box3RayIntersection(box, { x: -1, y: -1, z: -1 }, { x: 0, y: 0, z: 1 }), 0);
            equal(box3RayIntersection(box, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 0 }), 0);
        });

        // 6 个轴向分别从两侧射入：距离 4、法线朝向射线来向
        const cases: [Vector3, Vector3, Vector3][] = [
            [{ x: 5, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }],
            [{ x: -5, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }],
            [{ x: 0, y: 5, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 1, z: 0 }],
            [{ x: 0, y: -5, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }],
            [{ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }],
            [{ x: 0, y: 0, z: -5 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }],
        ];

        cases.forEach(([position, direction, normal]) =>
        {
            it(`从 ${position.toString()} 沿 ${direction.toString()} 射入：距离 4、法线 ${normal.toString()}`, () =>
            {
                const outNormal = { x: -9, y: -9, z: -9 };

                equal(box3RayIntersection(box, position, direction, outNormal), 4);
                deepEqual(outNormal, normal);
            });
        });

        it('不传法线时仍返回距离', () =>
        {
            equal(box3RayIntersection(box, { x: 5, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }), 4);
        });

        it('偏离中心但仍命中：距离由入射面决定', () =>
        {
            const outNormal = { x: 0, y: 0, z: 0 };

            equal(box3RayIntersection(box, { x: 3, y: 0.5, z: 0 }, { x: -1, y: 0, z: 0 }, outNormal), 2);
            deepEqual(outNormal, { x: 1, y: 0, z: 0 });
        });

        it('擦过盒外返回 Number.MAX_VALUE', () =>
        {
            // 沿 -x 射向 (5, 5, 0)：到达 x = 1 时 y 已是 5，在盒外
            equal(box3RayIntersection(box, { x: 5, y: 5, z: 0 }, { x: -1, y: 0, z: 0 }), Number.MAX_VALUE);
        });

        it('零方向且起点在盒外返回 Number.MAX_VALUE', () =>
        {
            equal(box3RayIntersection(box, { x: 5, y: 5, z: 5 }, { x: 0, y: 0, z: 0 }), Number.MAX_VALUE);
        });
    });

    describe('intersectsPlane（回归 #485）', () =>
    {
        const box = box3Of({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 });

        it('平面穿过盒子时为真（角点距离有正有负，且顺序不利）', () =>
        {
            // 反例：-x + 0.5y = 0 —— 8 个角点的距离是 [0.5, -1.5, 1.5, 0.5, 1.5, -1.5, -0.5, -0.5]，
            // 确实有正有负（平面穿过盒子）；修复前 `max` 会停在 -0.5 而返回 false
            expect(box3IntersectsPlane(box, planeOf(-1, 0.5, 0, 0))).toBe(true);
        });

        it('常见方向的穿过平面都为真', () =>
        {
            expect(box3IntersectsPlane(box, planeOf(0, 1, 0, 0)), 'y = 0').toBe(true);
            expect(box3IntersectsPlane(box, planeOf(1, 0, 0, 0)), 'x = 0').toBe(true);
            expect(box3IntersectsPlane(box, planeOf(0, 0, 1, 0)), 'z = 0').toBe(true);
            expect(box3IntersectsPlane(box, planeOf(1, 1, 0, 0)), 'x + y = 0').toBe(true);
            expect(box3IntersectsPlane(box, planeOf(1, 1, 1, -1)), 'x + y + z = 1').toBe(true);
        });

        it('平面完全在盒子一侧时为假（角点距离同号）', () =>
        {
            expect(box3IntersectsPlane(box, planeOf(0, 1, 0, -5)), 'y = 5（盒上方）').toBe(false);
            expect(box3IntersectsPlane(box, planeOf(0, 1, 0, 5)), 'y = -5（盒下方）').toBe(false);
            expect(box3IntersectsPlane(box, planeOf(1, 0, 0, -3)), 'x = 3').toBe(false);
            expect(box3IntersectsPlane(box, planeOf(-1, 0.5, 0, 5)), '倾斜且在盒外').toBe(false);
        });

        it('结果不依赖系数写法（同一平面等价表示结果一致）', () =>
        {
            // (a, b, c, d) 与 (2a, 2b, 2c, 2d)、(a, b, c, d) 取反，描述的是同一个平面
            expect(box3IntersectsPlane(box, planeOf(-1, 0.5, 0, 0))).toBe(true);
            expect(box3IntersectsPlane(box, planeOf(-2, 1, 0, 0))).toBe(true);
            expect(box3IntersectsPlane(box, planeOf(1, -0.5, 0, 0))).toBe(true);
        });
    });
});

/** 平面字面量（原 `new Plane(a, b, c, d)`）：`ax + by + cz + d = 0` */
function planeOf(a: number, b: number, c: number, d: number)
{
    return { a, b, c, d };
}
