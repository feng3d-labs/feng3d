import { assert, describe, it } from 'vitest';
import { mat4FromAxisRotate, mat4FromPosition, mat4FromScale } from '../../src/geom/matrix4x4';
import type { Box3Like, WritableBox3Like } from '../../src/geom/box3';
import {
    box3ApplyMatrix,
    box3ClampPoint,
    box3Clone,
    box3Contains,
    box3ContainsPoint,
    box3Copy,
    box3DistanceSquaredToPoint,
    box3Empty,
    box3Equals,
    box3ExpandByPoint,
    box3FormPositions,
    box3FromPoints,
    box3GetCenter,
    box3GetSize,
    box3Inflate,
    box3InflatePoint,
    box3Init,
    box3Intersection,
    box3IntersectionTo,
    box3Intersects,
    box3IsEmpty,
    box3Offset,
    box3Overlaps,
    box3RandomPoint,
    box3RayIntersection,
    box3Scale,
    box3ToPoints,
    box3ToString,
    box3Translate,
    box3Union,
} from '../../src/geom/box3';
import { VEC3_Z_AXIS } from '../../src/geom/vector3';

/**
 * `box3` 纯函数层的**契约测试**（issue #134 阶段 A2i）。
 *
 * 两条纪律（方案 §10.1 的 P3）：
 *
 * 1. 期望值一律**手算硬编码**，不拿 `Box3` class 当基准——class 已经委托给同一批纯函数，
 *    用它当期望值等于拿实现验证实现，改坏了照样通过；
 * 2. 最后单设一条「class 结果 == 纯函数结果」的**接线**用例，专门锁委托是否接通。
 *
 * 另有两条本批特有的坑被下面单独用 `★` 标出：
 *
 * - **P6**：缺省 `out` 必须是 `new Box3()` 的**空盒**（`min` 为 `+Infinity`、`max` 为 `-Infinity`），
 *   不是零向量——`box3FormPositions([])` 这种「一个点都没收到」的路径会**原样保留缺省初值**；
 * - **空盒的 `getSize()` 是零向量**（不是 `Infinity` / `NaN`），这也是 class 的既有约定。
 */

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-12, `${msg ?? ''} 期望 ${b} 实际 ${a}`);
const xyz = (v: { x: number; y: number; z: number }) => ({ x: v.x, y: v.y, z: v.z });
const xyz6 = (b: Box3Like) => ({ min: xyz(b.min), max: xyz(b.max) });
/** 空盒（`new Box3()` 的纯数据等价物）。 */
const EMPTY = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
const write = (b: WritableBox3Like) => b;

describe('box3 纯函数层（#134 A2i）', () =>
{
    it('运算不修改入参盒子', () =>
    {
        const a = { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } };
        const b = { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } };
        const p = { x: 5, y: 5, z: 5 };

        box3GetCenter(a);
        box3GetSize(a);
        box3ToPoints(a);
        box3Union(a, b);
        box3Overlaps(a, b);
        box3Intersects(a, b);
        box3Intersection(a, b);
        box3IntersectionTo(a, b);
        box3RayIntersection(a, p, { x: -1, y: 0, z: 0 });
        box3DistanceSquaredToPoint(a, p);
        box3InflatePoint(a, p);
        box3Translate(a, p);
        box3Scale(a, p);
        box3ExpandByPoint(a, p);
        box3ClampPoint(a, p);

        assert.deepEqual(xyz6(a), { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } });
        assert.deepEqual(xyz6(b), { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } });
        assert.deepEqual(p, { x: 5, y: 5, z: 5 });
    });

    it('out 传自己即就地运算（out 与 a 同一个盒子）', () =>
    {
        const a = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

        box3Scale(a, { x: 2, y: 2, z: 2 }, a);
        assert.deepEqual(xyz6(a), { min: { x: -2, y: -2, z: -2 }, max: { x: 2, y: 2, z: 2 } });

        box3Translate(a, { x: 1, y: 2, z: 3 }, a);
        assert.deepEqual(xyz6(a), { min: { x: -1, y: 0, z: 1 }, max: { x: 3, y: 4, z: 5 } });

        box3Empty(a);
        assert.deepEqual(xyz6(a), EMPTY);

        // 就地扩点后再收一个点
        box3ExpandByPoint(a, { x: 7, y: 7, z: 7 }, a);
        assert.deepEqual(xyz6(a), { min: { x: 7, y: 7, z: 7 }, max: { x: 7, y: 7, z: 7 } });

        box3Inflate(a, 2, 4, 6, a);
        assert.deepEqual(xyz6(a), { min: { x: 6, y: 5, z: 4 }, max: { x: 8, y: 9, z: 10 } });
    });

    it('★ 缺省 out 与 new Box3() 一致：是「负无穷空盒」而不是零向量（P6）', () =>
    {
        // 一个点都没收到 → 缺省 out 原样返回，正是空盒
        assert.deepEqual(xyz6(box3FormPositions([])), EMPTY);
        assert.deepEqual(xyz6(box3FromPoints([])), EMPTY);
        assert.deepEqual(xyz6(box3Clone({ min: { x: 1, y: 2, z: 3 }, max: { x: 4, y: 5, z: 6 } })), {
            min: { x: 1, y: 2, z: 3 },
            max: { x: 4, y: 5, z: 6 },
        });

        // 与「空盒」字面量逐字段相同
        const box = EMPTY;
        const empty = box3FormPositions([]);

        assert.equal(empty.min.x, box.min.x);
        assert.equal(empty.max.x, box.max.x);
        assert.ok(box3IsEmpty(empty));
    });

    it('★ 空盒的 getSize 是零向量（不是 Infinity / NaN），getCenter 仍是 Infinity', () =>
    {
        assert.deepEqual(xyz(box3GetSize(EMPTY)), { x: 0, y: 0, z: 0 });
        // 空盒中心 = (+Inf + -Inf) * 0.5 = NaN —— 与原实现一致，不是"修好"成 0
        assert.ok(Number.isNaN(box3GetCenter(EMPTY).x));

        // 退化盒（min === max）尺寸为零，但它不是空盒
        const point = { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } };

        assert.ok(!box3IsEmpty(point));
        assert.deepEqual(xyz(box3GetSize(point)), { x: 0, y: 0, z: 0 });
    });

    it('getCenter / getSize 与手算一致', () =>
    {
        const a = { min: { x: 1, y: 2, z: 3 }, max: { x: 4, y: 6, z: 8 } };

        assert.deepEqual(xyz(box3GetCenter(a)), { x: 2.5, y: 4, z: 5.5 });
        assert.deepEqual(xyz(box3GetSize(a)), { x: 3, y: 4, z: 5 });

        // 缺省 out 每次新建：两次调用互不干扰
        const first = box3GetCenter(a);

        first.x = 999;
        assert.deepEqual(xyz(box3GetCenter(a)), { x: 2.5, y: 4, z: 5.5 });
    });

    it('★ box3ToPoints 的 8 个角点顺序与原实现逐行一致，且就地写入不换引用', () =>
    {
        const a = { min: { x: 1, y: 2, z: 3 }, max: { x: 4, y: 5, z: 6 } };
        const points = box3ToPoints(a);

        assert.equal(points.length, 8);
        // 顺序：min、+x、+y、+z、+y+z、+x+z、+x+y、max
        assert.deepEqual(points.map(xyz), [
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 2, z: 3 },
            { x: 1, y: 5, z: 3 },
            { x: 1, y: 2, z: 6 },
            { x: 1, y: 5, z: 6 },
            { x: 4, y: 2, z: 6 },
            { x: 4, y: 5, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);

        // 传入数组时就地写入、返回同一个数组、复用元素对象
        const target = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
        const firstElement = target[0];

        assert.ok(box3ToPoints(a, target) === target);
        assert.ok(target[0] === firstElement);
        assert.deepEqual(target.map(xyz), points.map(xyz));
    });

    it('formPositions / fromPoints / init / empty 的手算结果', () =>
    {
        const positions = [1, 2, 3, -4, -5, -6, 0, 0, 0];

        assert.deepEqual(xyz6(box3FormPositions(positions)), { min: { x: -4, y: -5, z: -6 }, max: { x: 1, y: 2, z: 3 } });
        // 单个顶点 → 退化盒
        assert.deepEqual(xyz6(box3FormPositions([1, 1, 1])), { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } });

        // formPositions 覆盖 out 里已有的内容（不是与旧内容取并集）
        const dirty = { min: { x: -100, y: -100, z: -100 }, max: { x: 100, y: 100, z: 100 } };

        assert.deepEqual(xyz6(box3FormPositions([1, 1, 1], dirty)), { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } });

        // fromPoints 先清空再收点
        assert.deepEqual(xyz6(box3FromPoints([{ x: 1, y: 1, z: 1 }, { x: -2, y: 3, z: 0 }, { x: 0, y: -5, z: 4 }])), {
            min: { x: -2, y: -5, z: 0 },
            max: { x: 1, y: 3, z: 4 },
        });
        assert.deepEqual(xyz6(box3FromPoints([{ x: 1, y: 1, z: 1 }], dirty)), { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } });

        // init 取值语义（复制分量，不是引用赋值）
        const min = { x: 1, y: 2, z: 3 };
        const out = box3Init(min, { x: 4, y: 5, z: 6 });

        assert.deepEqual(xyz6(out), { min: { x: 1, y: 2, z: 3 }, max: { x: 4, y: 5, z: 6 } });
        min.x = 999;
        assert.equal(out.min.x, 1, 'box3Init 应是复制而非引用');

        // empty 就地重置
        assert.deepEqual(xyz6(box3Empty(box3Clone(out))), EMPTY);
    });

    it('copy / clone：写分量不换引用；clone 是新建', () =>
    {
        const a = { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } };
        const out = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
        const outMin = out.min;
        const outMax = out.max;

        assert.ok(box3Copy(a, out) === out);
        assert.ok(out.min === outMin && out.max === outMax, 'copy 应写入已有的 min / max');
        assert.deepEqual(xyz6(out), xyz6(a));

        const cloned = box3Clone(a);

        assert.notEqual(cloned, a);
        assert.notEqual(cloned.min, a.min);
        assert.deepEqual(xyz6(cloned), xyz6(a));
    });

    it('containsPoint / contains / equals / isEmpty 的边界语义', () =>
    {
        const a = { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } };

        assert.ok(box3ContainsPoint(a, { x: 0, y: 0, z: 0 }));
        // 含边界：8 个角点都算包含
        for (const p of box3ToPoints(a)) { assert.ok(box3ContainsPoint(a, p)); }
        assert.ok(!box3ContainsPoint(a, { x: 1.001, y: 0, z: 0 }));
        assert.ok(!box3ContainsPoint(a, { x: 0, y: 0, z: -3.001 }));

        const inner = { min: { x: -1, y: -2, z: -3 }, max: { x: 0, y: 0, z: 0 } };

        assert.ok(box3Contains(a, inner));
        assert.ok(!box3Contains(inner, a));

        assert.ok(box3Equals(a, { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } }));
        assert.ok(!box3Equals(a, { min: { x: -1.5, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } }));

        assert.ok(box3IsEmpty(EMPTY));
        assert.ok(box3IsEmpty({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: -1 } }), '单轴反向即为空');
        assert.ok(!box3IsEmpty({ min: { x: 0, y: 0, z: -1 }, max: { x: 0, y: 0, z: 0 } }));
    });

    it('union / inflate / inflatePoint / translate / offset 的手算结果', () =>
    {
        const a = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
        const b = { min: { x: 0, y: -2, z: 2 }, max: { x: 3, y: 0, z: 4 } };

        assert.deepEqual(xyz6(box3Union(a, b)), { min: { x: -1, y: -2, z: -1 }, max: { x: 3, y: 1, z: 4 } });

        // ★ out 与 b 是同一个盒：先写 out 再读 b 会算出错误结果（跨分量依赖必须先算局部变量）
        const bCopy = box3Clone(b);

        box3Union(a, bCopy, bCopy);
        assert.deepEqual(xyz6(bCopy), { min: { x: -1, y: -2, z: -1 }, max: { x: 3, y: 1, z: 4 } });

        // inflate 按直径：每边各扩张一半
        assert.deepEqual(xyz6(box3Inflate(a, 2, 4, 6)), { min: { x: -2, y: -3, z: -4 }, max: { x: 2, y: 3, z: 4 } });
        assert.deepEqual(xyz6(box3InflatePoint(a, { x: 2, y: 4, z: 6 })), { min: { x: -2, y: -3, z: -4 }, max: { x: 2, y: 3, z: 4 } });

        assert.deepEqual(xyz6(box3Translate(a, { x: 1, y: 2, z: 3 })), { min: { x: 0, y: 1, z: 2 }, max: { x: 2, y: 3, z: 4 } });
        assert.deepEqual(xyz6(box3Offset(a, 1, 2, 3)), xyz6(box3Translate(a, { x: 1, y: 2, z: 3 })));
    });

    it('★ box3Intersection：不相交返回 null 且不改动 out；out 与 a 同盒也正确', () =>
    {
        const a = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
        const other = { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } };

        assert.deepEqual(xyz6(write(box3Intersection(a, other)!)), { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } });

        // 不相交：返回 null、out 保持原值、a 也不动
        const untouched = { min: { x: 9, y: 9, z: 9 }, max: { x: 9, y: 9, z: 9 } };
        const separated = { min: { x: 2, y: 0, z: 0 }, max: { x: 3, y: 1, z: 1 } };

        assert.equal(box3Intersection(a, separated, untouched), null);
        assert.deepEqual(xyz6(untouched), { min: { x: 9, y: 9, z: 9 }, max: { x: 9, y: 9, z: 9 } });

        // out 与 a 是同一个盒（即 class 的 intersection(this, aabb) 情形）
        const inPlace = box3Clone(a);

        assert.ok(box3Intersection(inPlace, other, inPlace) === inPlace);
        assert.deepEqual(xyz6(inPlace), { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } });
        assert.equal(box3Intersection(inPlace, separated, inPlace), null);
        assert.deepEqual(xyz6(inPlace), { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }, '不相交时不得被改动');

        // intersectionTo = copy + intersection，不改动自身
        const to = box3IntersectionTo(a, other);

        assert.deepEqual(xyz6(to!), { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } });
        assert.deepEqual(xyz6(a), { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } });
        assert.equal(box3IntersectionTo(a, separated), null);
    });

    it('★ box3Intersects 与 box3Overlaps 不是同一个判定（逐字保留原实现）', () =>
    {
        const a = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

        // 完全包含 / 部分重叠 / 只在一个角点相切 → 都为真
        assert.ok(box3Intersects(a, { min: { x: -0.5, y: -0.5, z: -0.5 }, max: { x: 0.5, y: 0.5, z: 0.5 } }));
        assert.ok(box3Intersects(a, { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } }));
        assert.ok(box3Intersects(a, { min: { x: 1, y: 1, z: 1 }, max: { x: 2, y: 2, z: 2 } }));
        // 完全分离 → 交集为空 → 假
        assert.ok(!box3Intersects(a, { min: { x: 1.5, y: 0, z: 0 }, max: { x: 2.5, y: 0.5, z: 0.5 } }));

        // overlaps 的语义不同：只在边界相切为真、单轴分离为假
        assert.ok(box3Overlaps(a, { min: { x: 1, y: -1, z: -1 }, max: { x: 2, y: 1, z: 1 } }));
        assert.ok(!box3Overlaps(a, { min: { x: 1.5, y: -1, z: -1 }, max: { x: 2, y: 1, z: 1 } }));
        assert.ok(box3Overlaps(a, a));

        // ★ 两者在这组数据上确实不同（若把 intersects 错改成 overlaps，第一条会变假）
        const far = { min: { x: 0, y: 0, z: 0 }, max: { x: 3, y: 3, z: 3 } };
        const thin = { min: { x: -5, y: 4, z: 4 }, max: { x: 5, y: 5, z: 5 } };

        assert.ok(!box3Intersects(far, thin));
        assert.ok(!box3Overlaps(far, thin));
    });

    it('clampPoint / distanceSquaredToPoint / randomPoint 的手算结果', () =>
    {
        const a = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

        assert.deepEqual(xyz(box3ClampPoint(a, { x: 5, y: -5, z: 0 })), { x: 1, y: -1, z: 0 });
        assert.deepEqual(xyz(box3ClampPoint(a, { x: 0.25, y: 0, z: -0.25 })), { x: 0.25, y: 0, z: -0.25 });

        // 盒内点为 0；盒外角点 (2,2,2) → 最近点 (1,1,1) → 距离平方 3
        assert.equal(box3DistanceSquaredToPoint(a, { x: 0, y: 0, z: 0 }), 0);
        near(box3DistanceSquaredToPoint(a, { x: 2, y: 2, z: 2 }), 3, 'distanceSquared');

        // 分量插值：alpha 为 (1,0,1) → 取 max.x / min.y / max.z
        assert.deepEqual(xyz(box3RandomPoint(a, { x: 1, y: 0, z: 1 })), { x: 1, y: -1, z: 1 });
        assert.deepEqual(xyz(box3RandomPoint(a, { x: 0.5, y: 0.5, z: 0.5 })), { x: 0, y: 0, z: 0 });
    });

    it('rayIntersection：六个轴向的入射距离与法线', () =>
    {
        const a = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

        // 空盒 / 起点在盒内
        assert.equal(box3RayIntersection(EMPTY, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), Number.MAX_VALUE);
        assert.equal(box3RayIntersection(a, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), 0);
        assert.equal(box3RayIntersection(a, { x: -1, y: -1, z: -1 }, { x: 0, y: 0, z: 1 }), 0);

        const cases: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }, { x: number; y: number; z: number }][] = [
            [{ x: 5, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }],
            [{ x: -5, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }],
            [{ x: 0, y: 5, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 1, z: 0 }],
            [{ x: 0, y: -5, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }],
            [{ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }],
            [{ x: 0, y: 0, z: -5 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }],
        ];

        for (const [position, direction, expectedNormal] of cases)
        {
            const normal = { x: -9, y: -9, z: -9 };

            assert.equal(box3RayIntersection(a, position, direction, normal), 4, `从 ${JSON.stringify(position)} 射入`);
            assert.deepEqual(xyz(normal), expectedNormal);
        }

        // 偏离中心但仍命中：入射距离由入射面决定（起点 x = 3 → 走到 x = 1 是 2）
        const offsetNormal = { x: 0, y: 0, z: 0 };

        assert.equal(box3RayIntersection(a, { x: 3, y: 0.5, z: 0 }, { x: -1, y: 0, z: 0 }, offsetNormal), 2);
        assert.deepEqual(xyz(offsetNormal), { x: 1, y: 0, z: 0 });

        // 擦过盒外 / 零方向：都返回 MAX_VALUE，且不写法线
        const untouchedNormal = { x: -9, y: -9, z: -9 };

        assert.equal(box3RayIntersection(a, { x: 5, y: 5, z: 0 }, { x: -1, y: 0, z: 0 }, untouchedNormal), Number.MAX_VALUE);
        assert.equal(box3RayIntersection(a, { x: 5, y: 5, z: 5 }, { x: 0, y: 0, z: 0 }, untouchedNormal), Number.MAX_VALUE);
        assert.deepEqual(xyz(untouchedNormal), { x: -9, y: -9, z: -9 }, '未命中不得写法线');

        // 不传法线也能用
        assert.equal(box3RayIntersection(a, { x: 5, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }), 4);
    });

    it('toString 输出 min / max 的文本形式', () =>
    {
        assert.equal(
            box3ToString({ min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 2, z: 3 } }),
            '[AABB] (min=<0, 0, 0>, max=<1, 2, 3>)'
        );
    });

    it('applyMatrix：平移 / 缩放 / 空盒 / 旋转后仍是「包住变换后角点」的轴对齐盒', () =>
    {
        const a = { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } };

        // 平移
        assert.deepEqual(xyz6(box3ApplyMatrix(a, mat4FromPosition(10, 20, 30))), {
            min: { x: 9, y: 18, z: 27 },
            max: { x: 11, y: 22, z: 33 },
        });

        // 按分量缩放
        assert.deepEqual(xyz6(box3ApplyMatrix(a, mat4FromScale(2, 3, 4))), {
            min: { x: -2, y: -6, z: -12 },
            max: { x: 2, y: 6, z: 12 },
        });

        // 空盒直接原样返回（不对 Infinity 做变换）
        assert.deepEqual(xyz6(box3ApplyMatrix(EMPTY, mat4FromPosition(1, 2, 3))), EMPTY);

        // 绕 z 轴转 90°：x / y 跨度互换（用近等断言：cos(π/2) 的浮点误差会到 1.0000000000000002）
        const square = { min: { x: -1, y: -2, z: -1 }, max: { x: 1, y: 2, z: 1 } };
        const rotated = box3ApplyMatrix(square, mat4FromAxisRotate(VEC3_Z_AXIS, Math.PI / 2));

        near(rotated.min.x, -2, 'rotated.min.x');
        near(rotated.min.y, -1, 'rotated.min.y');
        near(rotated.min.z, -1, 'rotated.min.z');
        near(rotated.max.x, 2, 'rotated.max.x');
        near(rotated.max.y, 1, 'rotated.max.y');
        near(rotated.max.z, 1, 'rotated.max.z');

        // ★ out 与 a 是同一个盒（class 的 applyMatrix 就是 out = this）：不得边读边写
        const inPlace = box3Clone(a);

        box3ApplyMatrix(inPlace, mat4FromPosition(10, 20, 30), inPlace);
        assert.deepEqual(xyz6(inPlace), { min: { x: 9, y: 18, z: 27 }, max: { x: 11, y: 22, z: 33 } });
    });

    it('就地语义（原「class 委托接线」用例的接替）：out 传自己与新建路径结果一致', () =>
    {
        // 阶段 C-e：`Box3` 的 class 已删除，「class 结果 == 纯函数结果」这条接线用例失去被测对象。
        // 这里保留它真正锁住的东西：**就地（out 传自己）与新建（缺省 out）结果逐位相同**，
        // 以及 `box3Intersection` / `box3IntersectionTo` 就地改写目标、`box3RayIntersection` 的法线输出。
        const pureBase = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
        const pureOther = { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } };

        const scaledNew = box3Scale(pureBase, { x: 2, y: 3, z: 4 });
        const inPlace = box3Clone(pureBase);

        box3Scale(inPlace, { x: 2, y: 3, z: 4 }, inPlace);
        assert.deepEqual(xyz6(inPlace), xyz6(scaledNew));

        const translatedNew = box3Translate(scaledNew, { x: 1, y: 2, z: 3 });

        box3Translate(inPlace, { x: 1, y: 2, z: 3 }, inPlace);
        assert.deepEqual(xyz6(inPlace), xyz6(translatedNew));

        const unionedNew = box3Union(translatedNew, pureOther);

        box3Union(inPlace, pureOther, inPlace);
        assert.deepEqual(xyz6(inPlace), xyz6(unionedNew));

        const emptiedNew = box3Empty(box3Clone(unionedNew));

        box3Empty(inPlace);
        assert.deepEqual(xyz6(inPlace), xyz6(emptiedNew));

        // 交集：结果就地写进传入的目标，且与新建路径逐位相同
        const intersectionTarget = box3Clone(pureBase);
        const intersectionResult = box3IntersectionTo(pureBase, pureOther, intersectionTarget);

        assert.equal(intersectionResult, intersectionTarget, 'intersectionTo 返回传入的 out');
        assert.deepEqual(xyz6(intersectionTarget), xyz6(box3Intersection(pureBase, pureOther)!));
        assert.ok(intersectionTarget !== pureBase, 'intersectionTo 不改动入参 a');

        // 射线求交：法线写进 out 参数
        const normal = { x: 0, y: 0, z: 0 };
        const rayHit = box3RayIntersection(pureBase, { x: 5, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, normal);

        assert.equal(rayHit, box3RayIntersection(pureBase, { x: 5, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }));
        assert.deepEqual(xyz(normal), { x: 1, y: 0, z: 0 });
    });
});
