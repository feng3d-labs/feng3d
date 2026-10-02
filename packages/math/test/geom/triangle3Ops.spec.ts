import { assert, afterEach, describe, it, vi } from 'vitest';
import { Triangle3 } from '../../src/geom/Triangle3';
import { Vector3 } from '../../src/geom/Vector3';
import {
    tri3Area,
    tri3BlendWithPoint,
    tri3Copy,
    tri3FromPoints,
    tri3FromPositions,
    tri3GetBarycenter,
    tri3GetBarycentricCoordinates,
    tri3GetCircumcenter,
    tri3GetInnercenter,
    tri3GetNormal,
    tri3GetOrthocenter,
    tri3GetPoint,
    tri3GetPoints,
    tri3GetSegments,
    tri3OnWithPoint,
    tri3Random,
    tri3RandomPoint,
    tri3Rasterize,
    tri3RasterizeCustom,
    tri3ScaleVector3,
    tri3Translate,
} from '../../src/geom/triangle3Ops';

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-12, `${msg ?? ''} 期望 ${b} 实际 ${a}`);
const xyz = (v: { x: number; y: number; z: number }) => ({ x: v.x, y: v.y, z: v.z });
/** 每次新建，避免把共享夹具当 `out` 传进去（那会就地改写它，牵连后续用例）。 */
const tri = () => ({ p0: { x: 0, y: 0, z: 0 }, p1: { x: 1, y: 0, z: 0 }, p2: { x: 0, y: 1, z: 0 } });

/**
 * `triangle3Ops` 纯函数层的**契约测试**（issue #134 阶段 A2k）。
 *
 * 期望值全部**手算硬编码**（P3：拿已委托同一函数的 class 当基准是无效测试）；
 * 文末另有一条「class 结果 == 纯函数结果」的**接线**用例，只负责确认委托确实接上了。
 *
 * 统一用 `(0,0,0) / (1,0,0) / (0,1,0)` 这个直角三角形（右手系里法线 +Z）：
 * 外心 = 斜边中点 `(0.5,0.5,0)`、垂心 = 直角顶点 `(0,0,0)`、面积 = `0.5`；
 * 内心权重挂在**对边**上（p0 ↔ p1p2 = √2），故 = `(1, √2, 1) / (2 + √2)`。
 *
 * 另有两条**防误译**用例，都是实施时真踩到的坑：
 * - `blendWithPoint` 的 `area0 / area` 必须用**归一化之前**的模长；
 * - `random` / `randomPoint` 消耗 `Math.random` 的次数与顺序必须与原实现一致（P5）。
 */
describe('triangle3Ops 纯函数层（#134 A2k）', () =>
{
    afterEach(() =>
    {
        vi.restoreAllMocks();
    });

    it('运算不修改入参', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 1, y: 2, z: 3 }, p2: { x: 4, y: 5, z: 6 } };
        const p = { x: 0.25, y: 0.5, z: 0.25 };

        tri3GetNormal(a);
        tri3GetBarycenter(a);
        tri3GetCircumcenter(a);
        tri3GetInnercenter(a);
        tri3GetOrthocenter(a);
        tri3GetPoint(a, p);
        tri3GetBarycentricCoordinates(a, p);
        tri3OnWithPoint(a, p);
        tri3BlendWithPoint(a, p);
        tri3Area(a);
        tri3Rasterize(a);
        tri3Translate(a, { x: 1, y: 1, z: 1 });
        tri3ScaleVector3(a, { x: 2, y: 2, z: 2 });
        tri3Copy(a);
        tri3RasterizeCustom(a);
        tri3GetPoints(a);
        tri3GetSegments(a);

        assert.deepEqual(a, { p0: { x: 0, y: 0, z: 0 }, p1: { x: 1, y: 2, z: 3 }, p2: { x: 4, y: 5, z: 6 } }, '入参三角形被修改了');
        assert.deepEqual(p, { x: 0.25, y: 0.5, z: 0.25 }, '入参点被修改了');
    });

    it('fromPoints 取值语义（复制分量），不是原实现的引用赋值', () =>
    {
        const p0 = { x: 1, y: 2, z: 3 };
        const out = tri3FromPoints(p0, { x: 4, y: 5, z: 6 }, { x: 7, y: 8, z: 9 });

        assert.deepEqual(xyz(out.p0), { x: 1, y: 2, z: 3 });
        assert.deepEqual(xyz(out.p1), { x: 4, y: 5, z: 6 });
        assert.deepEqual(xyz(out.p2), { x: 7, y: 8, z: 9 });

        p0.x = 99;

        assert.equal(out.p0.x, 1, '应是复制而非引用');
    });

    it('fromPositions 取 positions 的三组分量，且三个顶点是新建的', () =>
    {
        const out = tri3FromPositions([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        assert.deepEqual(xyz(out.p0), { x: 1, y: 2, z: 3 });
        assert.deepEqual(xyz(out.p1), { x: 4, y: 5, z: 6 });
        assert.deepEqual(xyz(out.p2), { x: 7, y: 8, z: 9 });

        // 缺省 out 先建三个零向量，再被 fromPositions 替换成新对象（与 `new Vector3()` 的默认一致，P6）
        const empty = tri3FromPositions([1, 2, 3, 4, 5, 6, 7, 8, 9], new Triangle3());

        assert.deepEqual(xyz(empty.p0), { x: 1, y: 2, z: 3 });
    });

    it('★ random 的 Math.random 调用次数与顺序与原实现一致（3 顶点 × 3 分量）', () =>
    {
        const values = [10, 20, 30, 40, 50, 60, 70, 80, 90];

        vi.spyOn(Math, 'random').mockImplementation(() => (values.shift() as number) / 100);

        const out = tri3Random(); // size 缺省 1

        assert.deepEqual(xyz(out.p0), { x: 0.1, y: 0.2, z: 0.3 });
        assert.deepEqual(xyz(out.p1), { x: 0.4, y: 0.5, z: 0.6 });
        assert.deepEqual(xyz(out.p2), { x: 0.7, y: 0.8, z: 0.9 });
        assert.equal(values.length, 0, '应恰好消耗 9 次 Math.random');
    });

    it('★ randomPoint 恰好调用 2 次 Math.random，且 a → b 的顺序不变', () =>
    {
        const values = [0.25, 0.5];

        vi.spyOn(Math, 'random').mockImplementation(() => values.shift() as number);

        const out = tri3RandomPoint(tri());

        // a = 0.25，b = 0.5 * (1 - 0.25) = 0.375，c = 1 - 0.25 - 0.375 = 0.375
        // 点 = p0 * a + p1 * b + p2 * c = (0.375, 0.375, 0)
        assert.deepEqual(xyz(out), { x: 0.375, y: 0.375, z: 0 });
        assert.equal(values.length, 0, '应恰好消耗 2 次 Math.random');
    });

    it('getPoints / getSegments 的结构与手算一致', () =>
    {
        const points = tri3GetPoints(tri());

        assert.equal(points.length, 3);
        assert.deepEqual(xyz(points[0]), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(points[2]), { x: 0, y: 1, z: 0 });

        const segments = tri3GetSegments(tri());
        const len = (s: { p0: { x: number; y: number; z: number }, p1: { x: number; y: number; z: number } }) => Math.hypot(s.p1.x - s.p0.x, s.p1.y - s.p0.y, s.p1.z - s.p0.z);

        assert.equal(segments.length, 3);
        near(len(segments[0]), 1, 'p0p1');
        near(len(segments[1]), Math.SQRT2, 'p1p2');
        near(len(segments[2]), 1, 'p2p0');
    });

    it('getNormal 对应 normalize()（长度平方判定），不是 Normalize()（kEpsilon）', () =>
    {
        // (1,0,0) - (0,0,0) = +X，(0,1,0) - (1,0,0) = (-1,1,0)，叉乘 = +Z
        // 注意 y 分量是 `-0`（`(0 * 1) - (0 * -1)`），`deepEqual` 区分 `+0` / `-0`，所以照实写
        assert.deepEqual(xyz(tri3GetNormal(tri())), { x: 0, y: -0, z: 1 });

        // 退化边界：边长为 1e-7（小于 VEC3_EPSILON = 1e-5）
        // normalize() 因「长度平方 > 0」仍会归一化出 (0,0,1)；
        // 若误用 Normalize() 会因 kEpsilon 判零而返回零向量 —— 这一条就是防这个误译。
        const tiny = tri3GetNormal({ p0: { x: 1e-7, y: 0, z: 0 }, p1: { x: 2e-7, y: 0, z: 0 }, p2: { x: 0, y: 1e-7, z: 0 } });

        assert.deepEqual(xyz(tiny), { x: 0, y: -0, z: 1 }, '退化边界下应走 normalize() 分支');
    });

    it('重心 / 外心 / 内心 / 垂心 与手算一致', () =>
    {
        // 重心 = (p0 + p1 + p2) * (1/3)
        assert.deepEqual(xyz(tri3GetBarycenter(tri())), { x: 1 / 3, y: 1 / 3, z: 0 });

        // 外心：直角三角形斜边中点
        assert.deepEqual(xyz(tri3GetCircumcenter(tri())), { x: 0.5, y: 0.5, z: 0 });

        // 内心：权重挂在**对边**上——p0 ↔ p1p2 = √2、p1 ↔ p2p0 = 1、p2 ↔ p0p1 = 1，
        // 所以 = (p0·√2 + p1·1 + p2·1) / (2 + √2) = (1, 1, 0) / (2 + √2) = (0.2929…, 0.2929…, 0)
        const k = 1 / (2 + Math.SQRT2);
        const inner = tri3GetInnercenter(tri());

        near(inner.x, k, '内心 x');
        near(inner.y, k, '内心 y');
        near(inner.z, 0, '内心 z');

        // 垂心：直角顶点
        assert.deepEqual(xyz(tri3GetOrthocenter(tri())), { x: 0, y: 0, z: 0 });
    });

    it('外心 / 内心的定义性质（用独立判据交叉验证，不依赖 class）', () =>
    {
        const a = { p0: { x: 0, y: 0, z: 0 }, p1: { x: 4, y: 0, z: 0 }, p2: { x: 1, y: 3, z: 0 } };
        const dist = (u: { x: number; y: number; z: number }, v: { x: number; y: number; z: number }) => Math.hypot(u.x - v.x, u.y - v.y, u.z - v.z);
        const circumcenter = tri3GetCircumcenter(a);

        near(dist(circumcenter, a.p0), dist(circumcenter, a.p1), '外心到 p0 / p1 等距');
        near(dist(circumcenter, a.p0), dist(circumcenter, a.p2), '外心到 p0 / p2 等距');

        // 平面内点到直线距离（叉积模长 / 边长）
        const lineDistance = (p: { x: number; y: number; z: number }, u: { x: number; y: number; z: number }, v: { x: number; y: number; z: number }) =>
        {
            const dx = v.x - u.x;
            const dy = v.y - u.y;

            return Math.abs(((p.x - u.x) * dy) - ((p.y - u.y) * dx)) / Math.hypot(dx, dy);
        };
        const innercenter = tri3GetInnercenter(a);

        near(lineDistance(innercenter, a.p0, a.p1), lineDistance(innercenter, a.p0, a.p2), '内心到边 p0p1 / p0p2 等距');
        near(lineDistance(innercenter, a.p0, a.p1), lineDistance(innercenter, a.p1, a.p2), '内心到边 p0p1 / p1p2 等距');
    });

    it('getPoint 是重心坐标加权和，且 out 与权重别名时也不自污染', () =>
    {
        assert.deepEqual(xyz(tri3GetPoint(tri(), { x: 0.25, y: 0.25, z: 0.5 })), { x: 0.25, y: 0.5, z: 0 });

        // out 就是权重对象本身：先把三个权重取进局部变量，结果必须仍是 (0.25, 0.5, 0)
        const weights = { x: 0.25, y: 0.25, z: 0.5 };

        tri3GetPoint(tri(), weights, weights);

        assert.deepEqual(xyz(weights), { x: 0.25, y: 0.5, z: 0 });
    });

    it('getBarycentricCoordinates 与 getPoint 互逆（三个投影轴分支都覆盖）', () =>
    {
        // 主轴分别是 X / Y / Z 的三个直角三角形，各取一个内部点
        const triangles = [
            { p0: { x: 0, y: 0, z: 0 }, p1: { x: 4, y: 0, z: 0 }, p2: { x: 0, y: 0, z: 4 } }, // 法线 ±Y
            { p0: { x: 0, y: 0, z: 0 }, p1: { x: 4, y: 0, z: 0 }, p2: { x: 0, y: 4, z: 0 } }, // 法线 ±Z
            { p0: { x: 0, y: 0, z: 0 }, p1: { x: 0, y: 4, z: 0 }, p2: { x: 0, y: 0, z: 4 } }, // 法线 ±X
        ];

        triangles.forEach((t, i) =>
        {
            const bp = { x: 0.25, y: 0.25, z: 0.5 };
            const back = tri3GetBarycentricCoordinates(t, tri3GetPoint(t, bp));

            near(back.x, 0.25, `第 ${i} 个三角形重心坐标 x`);
            near(back.y, 0.25, `第 ${i} 个三角形重心坐标 y`);
            near(back.z, 0.5, `第 ${i} 个三角形重心坐标 z`);
        });

        // 顶点与斜边中点（x 是 `-0`，见上文 getNormal 的说明）
        assert.deepEqual(xyz(tri3GetBarycentricCoordinates(tri(), { x: 0, y: 0, z: 0 })), { x: 1, y: 0, z: 0 });
        assert.deepEqual(xyz(tri3GetBarycentricCoordinates(tri(), { x: 0.5, y: 0.5, z: 0 })), { x: -0, y: 0.5, z: 0.5 });
    });

    it('onWithPoint：面积内 / 面积外 / 平面外', () =>
    {
        assert.ok(tri3OnWithPoint(tri(), { x: 0.25, y: 0.25, z: 0 }), '内部点');
        assert.ok(tri3OnWithPoint(tri(), { x: 0, y: 0, z: 0 }), '顶点');
        assert.ok(tri3OnWithPoint(tri(), { x: 0.5, y: 0.5, z: 0 }), '斜边中点');
        assert.ok(!tri3OnWithPoint(tri(), { x: 1, y: 1, z: 0 }), '平面内但在三角形外');
        assert.ok(!tri3OnWithPoint(tri(), { x: 0.25, y: 0.25, z: 0.5 }), '不在平面上');
        assert.ok(tri3OnWithPoint(tri(), { x: -0.0005, y: 0, z: 0 }, 0.01), '外扩精度下的边界外侧点');
    });

    it('area 与手算一致', () =>
    {
        near(tri3Area(tri()), 0.5, 'area(直角边 1/1)');
        near(tri3Area({ p0: { x: 0, y: 0, z: 0 }, p1: { x: 4, y: 0, z: 0 }, p2: { x: 1, y: 3, z: 0 } }), 6, 'area(底 4 高 3)');
    });

    it('★ blendWithPoint 用归一化之前的模长做面积比（防误译回归）', () =>
    {
        // p 在内部时三个子三角形面积比 = (0.5, 0.25, 0.25)：这正是原实现的输出。
        // 若把 area0 / area1 / area2 算成**归一化之后**的模长（恒为 1），结果会变成 (1, 1, 1)——
        // 本文件第一版就是这么错的（归一化后 length 必然为 1，面积比信息全丢）。
        assert.deepEqual(xyz(tri3BlendWithPoint(tri(), { x: 0.25, y: 0.25, z: 0 })), { x: 0.5, y: 0.25, z: 0.25 });

        // 三个顶点上：对应分量为 1
        near(tri3BlendWithPoint(tri(), { x: 0, y: 0, z: 0 }).x, 1, '顶点 p0 对应分量');
        near(tri3BlendWithPoint(tri(), { x: 1, y: 0, z: 0 }).y, 1, '顶点 p1 对应分量');
        near(tri3BlendWithPoint(tri(), { x: 0, y: 1, z: 0 }).z, 1, '顶点 p2 对应分量');
    });

    it('rasterize 取 min/max 的整数格点（Math.min / Math.max 语义）', () =>
    {
        // x 外层、y 中层、z 内层 → (0,0,0) → (0,1,0) → (1,0,0)
        assert.deepEqual(tri3Rasterize(tri()), [0, 0, 0, 0, 1, 0, 1, 0, 0]);

        // 整数格点三角形 (0,0,0)/(3,0,0)/(0,3,0)：采样点是**逐点判据**（onWithPoint(…, 0.5)），
        // 精度 0.5 会把重心坐标落在 [-0.5, 1.5] 的点也算进来，所以不止「x + y ≤ 3」那一块，
        // 还含 (1,3,0)、(2,2,0)、(3,1,0)——它们到 p2 / 斜边的距离不足 0.5。
        assert.deepEqual(tri3Rasterize({ p0: { x: 0, y: 0, z: 0 }, p1: { x: 3, y: 0, z: 0 }, p2: { x: 0, y: 3, z: 0 } }), [
            0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0,
            1, 0, 0, 1, 1, 0, 1, 2, 0, 1, 3, 0,
            2, 0, 0, 2, 1, 0, 2, 2, 0,
            3, 0, 0, 3, 1, 0,
        ]);

        // 浮点顶点先各自取整定 min / max：round(0.4) = 0、round(2.6) = 3，所以包围盒与上面的整数
        // 三角形相同。**但采样点仍在 z = 0 平面上**，而本三角形在 z = 0 平面上，判据才成立——
        // 若把顶点整体挪到 z = 0.4（包围盒不变，采样平面却差 0.4）会一个点都采不到，
        // `rasterize` 是「先按包围盒取整扫点、再逐点做 onWithPoint」的两段式，这是它的固有行为。
        const big = { p0: { x: 0.4, y: 0.4, z: 0 }, p1: { x: 2.6, y: 0.4, z: 0 }, p2: { x: 0.4, y: 2.6, z: 0 } };

        assert.deepEqual(tri3Rasterize(big), tri3Rasterize({ p0: { x: 0, y: 0, z: 0 }, p1: { x: 3, y: 0, z: 0 }, p2: { x: 0, y: 3, z: 0 } }));

        // 顶点整体移到 z = 0.4（包围盒取整后仍是 (0,0,0)-(3,3,0)，但采样点全在 z = 0）：
        // 平面判据全部落空 → 空结果
        assert.deepEqual(tri3Rasterize({ p0: { x: 0.4, y: 0.4, z: 0.4 }, p1: { x: 2.6, y: 0.4, z: 0.4 }, p2: { x: 0.4, y: 2.6, z: 0.4 } }), []);
    });

    it('translate / scale 逐顶点作用，out 传自己即就地运算', () =>
    {
        const a = { p0: { x: 1, y: 2, z: 3 }, p1: { x: 4, y: 5, z: 6 }, p2: { x: 7, y: 8, z: 9 } };
        const moved = tri3Translate(a, { x: 1, y: 1, z: 1 });

        assert.deepEqual([xyz(moved.p0), xyz(moved.p1), xyz(moved.p2)], [{ x: 2, y: 3, z: 4 }, { x: 5, y: 6, z: 7 }, { x: 8, y: 9, z: 10 }]);
        assert.deepEqual(a, { p0: { x: 1, y: 2, z: 3 }, p1: { x: 4, y: 5, z: 6 }, p2: { x: 7, y: 8, z: 9 } }, '入参不该被改');

        // out 与入参同一个对象（就地）：+1 再 -1 应回到原值
        const inplace = { p0: { x: 1, y: 2, z: 3 }, p1: { x: 4, y: 5, z: 6 }, p2: { x: 7, y: 8, z: 9 } };

        tri3Translate(inplace, { x: 1, y: 1, z: 1 }, inplace);
        assert.deepEqual(inplace, { p0: { x: 2, y: 3, z: 4 }, p1: { x: 5, y: 6, z: 7 }, p2: { x: 8, y: 9, z: 10 } }, '就地平移 +1');

        tri3Translate(inplace, { x: -1, y: -1, z: -1 }, inplace);
        assert.deepEqual(inplace, a, '就地平移 -1 后应回到原值');

        const scaled = { p0: { x: 1, y: 2, z: 3 }, p1: { x: 4, y: 5, z: 6 }, p2: { x: 7, y: 8, z: 9 } };

        tri3ScaleVector3(scaled, { x: 2, y: 3, z: 4 }, scaled);
        assert.deepEqual(scaled, { p0: { x: 2, y: 6, z: 12 }, p1: { x: 8, y: 15, z: 24 }, p2: { x: 14, y: 24, z: 36 } });
    });

    it('copy 复制三个顶点', () =>
    {
        const a = { p0: { x: 1, y: 2, z: 3 }, p1: { x: 4, y: 5, z: 6 }, p2: { x: 7, y: 8, z: 9 } };
        const out = tri3Copy(a);

        assert.deepEqual(out, a);
        assert.notEqual(out.p0, a.p0, '应是新对象');
    });

    it('rasterizeCustom 按 voxelSize / origin 变换后再栅格化', () =>
    {
        // voxelSize = (2,2,2)、origin = (0,0,0)：先把三角形缩到 1/2，格点只有 (0,0,0) 落在三角形上
        // （(0.5,0,0) 落在边中点，其重心坐标 z = 0，被 `< 0 - 精度` 判为在三角形外，于是被排除）
        assert.deepEqual(tri3RasterizeCustom(tri(), { x: 2, y: 2, z: 2 }, { x: 0, y: 0, z: 0 }), [
            { xi: 0, yi: 0, zi: 0, xv: 0, yv: 0, zv: 0 },
        ]);

        // voxelSize / origin 都缺省时，(1,1,1) 与 (0,0,0) 是恒等变换，结果必须与 rasterize 等价
        const ps = tri3Rasterize(tri());
        const expected = [0, 1, 2].map((i) => ({
            xi: ps[i * 3], yi: ps[i * 3 + 1], zi: ps[i * 3 + 2],
            xv: ps[i * 3], yv: ps[i * 3 + 1], zv: ps[i * 3 + 2],
        }));

        assert.deepEqual(tri3RasterizeCustom(tri()), expected);
    });

    it('class 委托的接线正确（class 结果 == 纯函数结果）', () =>
    {
        const t = new Triangle3(new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 1, 0));
        const d = tri();

        assert.deepEqual(xyz(t.getNormal()), xyz(tri3GetNormal(d)));
        assert.deepEqual(xyz(t.getBarycenter()), xyz(tri3GetBarycenter(d)));
        assert.deepEqual(xyz(t.getCircumcenter()), xyz(tri3GetCircumcenter(d)));
        assert.deepEqual(xyz(t.getInnercenter()), xyz(tri3GetInnercenter(d)));
        assert.deepEqual(xyz(t.getOrthocenter()), xyz(tri3GetOrthocenter(d)));
        assert.deepEqual(xyz(t.getPoint(new Vector3(0.25, 0.25, 0.5))), xyz(tri3GetPoint(d, { x: 0.25, y: 0.25, z: 0.5 })));
        assert.deepEqual(xyz(t.getBarycentricCoordinates(new Vector3(0.25, 0.25, 0))), xyz(tri3GetBarycentricCoordinates(d, { x: 0.25, y: 0.25, z: 0 })));
        assert.deepEqual(xyz(t.blendWithPoint(new Vector3(0.25, 0.25, 0))), xyz(tri3BlendWithPoint(d, { x: 0.25, y: 0.25, z: 0 })));
        assert.equal(t.area(), tri3Area(d));
        assert.deepEqual(t.rasterize(), tri3Rasterize(d));
        assert.equal(t.onWithPoint(new Vector3(0.25, 0.25, 0)), tri3OnWithPoint(d, { x: 0.25, y: 0.25, z: 0 }));
        assert.deepEqual(t.rasterizeCustom(), tri3RasterizeCustom(d));

        const moved = t.clone().translateVector3(new Vector3(1, 1, 1));
        const movedOps = tri3Translate(d, { x: 1, y: 1, z: 1 });

        assert.deepEqual([xyz(moved.p0), xyz(moved.p1), xyz(moved.p2)], [xyz(movedOps.p0), xyz(movedOps.p1), xyz(movedOps.p2)]);

        const scaled = t.clone().scaleVector3(new Vector3(2, 3, 4));
        const scaledOps = tri3ScaleVector3(d, { x: 2, y: 3, z: 4 });

        assert.deepEqual([xyz(scaled.p0), xyz(scaled.p1), xyz(scaled.p2)], [xyz(scaledOps.p0), xyz(scaledOps.p1), xyz(scaledOps.p2)]);

        const copied = new Triangle3().copy(t);

        assert.deepEqual(xyz(copied.p0), xyz(tri3Copy(d).p0));
        assert.deepEqual(xyz(t.clone().p2), xyz(tri3Copy(d).p2));
        assert.deepEqual(t.getPoints().map((p) => xyz(p)), tri3GetPoints(d).map((p) => xyz(p)));
        assert.deepEqual(t.getSegments().map((s) => [xyz(s.p0), xyz(s.p1)]), tri3GetSegments(d).map((s) => [xyz(s.p0), xyz(s.p1)]));

        const fromPos = new Triangle3().fromPositions([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const fromPosOps = tri3FromPositions([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        assert.deepEqual([xyz(fromPos.p0), xyz(fromPos.p1), xyz(fromPos.p2)], [xyz(fromPosOps.p0), xyz(fromPosOps.p1), xyz(fromPosOps.p2)]);

        const fromPts = new Triangle3().fromPoints(new Vector3(1, 2, 3), new Vector3(4, 5, 6), new Vector3(7, 8, 9));
        const fromPtsOps = tri3FromPoints({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }, { x: 7, y: 8, z: 9 });

        assert.deepEqual([xyz(fromPts.p0), xyz(fromPts.p1), xyz(fromPts.p2)], [xyz(fromPtsOps.p0), xyz(fromPtsOps.p1), xyz(fromPtsOps.p2)]);
    });
});
