import { mathUtil } from '@feng3d/polyfill';
import type { Line3 } from '../../src/geom/line3Ops';
import { line3FromPosAndDir } from '../../src/geom/line3Ops';
import { mat3Identity, mat3Set } from '../../src/geom/matrix3x3Ops';
import {
    mat4FromPosition,
    mat4FromScale,
    mat4TransformPoint3,
    mat4TransformRay,
    mat4TransformVector3,
    mat4TransformVector4,
} from '../../src/geom/matrix4x4Ops';
import type { Plane } from '../../src/geom/planeOps';
import { planeFromPoints } from '../../src/geom/planeOps';
import { quatSet, quatVmult } from '../../src/geom/quaternionOps';
import {
    tri3ClosestPointWithPoint,
    tri3ContainsPoint,
    tri3DistanceSquaredWithPoint,
    tri3DistanceWithPoint,
    tri3FromPoints,
    tri3OnWithPoint,
} from '../../src/geom/triangle3Ops';
import type { Vector3Like } from '../../src/geom/vector3Ops';
import type { Vector4Like } from '../../src/geom/vector4Ops';
import { vec2ToVec3, vec3Distance, vec3DistanceSquared, vec3ToVec2, vec3ToVec4 } from '../../src/geom/vector3Ops';

import { assert, describe, it } from 'vitest';

/**
 * 取 xyz 三个分量（不要用 `{ ...vector3Instance }`：class 上有可枚举的 `__class__` 字段，
 * 展开会多一个键，与纯字面量 `deepEqual` 必然不等——方案 §10.1 P4）。
 */
function xyz(v: Vector3Like): { x: number; y: number; z: number }
{
    return { x: v.x, y: v.y, z: v.z };
}

/** 取 xy 两个分量。 */
function xy(v: { x: number; y: number }): { x: number; y: number }
{
    return { x: v.x, y: v.y };
}

/** 取 xyzw 四个分量。 */
function xyzw(v: Vector4Like): { x: number; y: number; z: number; w: number }
{
    return { x: v.x, y: v.y, z: v.z, w: v.w };
}

/**
 * issue #134 **阶段 A3（跨类型委托收口）**的契约测试。
 *
 * 覆盖本批改动的四个位置：
 *
 * 1. `Vector3` 的 6 个跨类型方法（`fromVector2` / `toVector2` / `toVector4` / `crossmat` /
 *    `applyQuaternion` / `applyMatrix4x4`）；
 * 2. `Line3.applyMatri4x4`（阶段 C-d：class 已删除，等价形态是 `mat4TransformRay`）；
 * 3. `Triangle3.getPlane3d` / `closestPointWithPoint` / `distanceWithPoint` / `distanceSquaredWithPoint` /
 *    `static containsPoint`；
 * 4. 新纯函数 `vec2ToVec3` / `vec3ToVec2` / `vec3ToVec4` / `tri3ClosestPointWithPoint` 系列。
 *
 * 分工与既有的 `*Ops.spec.ts` 一致（方案 §10.1 P3）：
 *
 * - **数值类**：期望值手算后硬编码，能发现纯函数实现错误；
 * - **接线类**：对比 class 与纯函数，只用来发现委托时的参数顺序 / `out` 传错。
 */
describe('#134 阶段 A3 跨类型委托', () =>
{
    describe('Vector3 ↔ Vector2 / Vector4', () =>
    {
        it('vec2ToVec3 / vec3ToVec2 / vec3ToVec4 的分量与手算一致', () =>
        {
            assert.deepEqual(xyz(vec2ToVec3({ x: 3, y: 4 }, 5)), { x: 3, y: 4, z: 5 });
            assert.deepEqual(xy(vec3ToVec2({ x: 7, y: 8, z: 9 })), { x: 7, y: 8 });
            assert.deepEqual(xyzw(vec3ToVec4({ x: 1, y: 2, z: 3 })), { x: 1, y: 2, z: 3, w: 0 });
        });

        it('★ vec3ToVec4 不写 w：保留 out 原有值（与改造前 Vector3.toVector4 一致）', () =>
        {
            const v4 = { x: 0, y: 0, z: 0, w: 9 };

            vec3ToVec4({ x: 1, y: 2, z: 3 }, v4);

            assert.deepEqual(xyzw(v4), { x: 1, y: 2, z: 3, w: 9 });
        });

        it('★ 转换函数结果写进传入的 out（身份断言，方案 §10.1 P8f）', () =>
        {
            const out2 = { x: 0, y: 0 };
            const out3 = { x: 0, y: 0, z: 0 };
            const out4 = { x: 0, y: 0, z: 0, w: 0 };

            assert.equal(vec3ToVec2({ x: 1, y: 2, z: 3 }, out2), out2);
            assert.equal(vec2ToVec3({ x: 1, y: 2 }, 3, out3), out3);
            assert.equal(vec3ToVec4({ x: 1, y: 2, z: 3 }, out4), out4);
        });

        it('转换函数不修改入参', () =>
        {
            const v2 = { x: 1, y: 2 };
            const v3 = { x: 3, y: 4, z: 5 };

            vec2ToVec3(v2, 9);
            vec3ToVec2(v3);
            vec3ToVec4(v3);

            assert.deepEqual(xy(v2), { x: 1, y: 2 });
            assert.deepEqual(xyz(v3), { x: 3, y: 4, z: 5 });
        });

        it('★ vec2ToVec3 写入并返回传入的 out（身份断言）', () =>
        {
            const target = { x: 0, y: 0, z: 0 };
            const v2 = { x: 7, y: 8 };

            assert.equal(vec2ToVec3(v2, 9, target), target);
            assert.deepEqual(xyz(target), { x: 7, y: 8, z: 9 });

            // 缺省 out 新建普通字面量（纯函数层不产判别字段）
            const fresh = vec2ToVec3({ x: 4, y: 5 }, 6);

            assert.deepEqual(xyz(fresh), { x: 4, y: 5, z: 6 });
            assert.equal(Object.getPrototypeOf(fresh), Object.prototype);
        });

        it('★ 三个转换函数的「缺省 out」与「显式 out」结果一致', () =>
        {
            const v2 = { x: 4, y: 5 };
            const v3 = { x: 7, y: 8, z: 9 };
            const toVector2Result = { x: 0, y: 0 };
            const toVector4Result = { x: 0, y: 0, z: 0, w: 0 };

            vec3ToVec2(v3, toVector2Result);
            vec3ToVec4(v3, toVector4Result);

            assert.deepEqual(xyz(vec2ToVec3(v2, 6)), xyz(vec2ToVec3({ x: 4, y: 5 }, 6, { x: 0, y: 0, z: 0 })));
            assert.deepEqual(xy(toVector2Result), xy(vec3ToVec2(v3)));
            assert.deepEqual(xyzw(toVector4Result), xyzw(vec3ToVec4(v3)));
        });
    });

    describe('Vector3 ↔ Matrix3x3 / Quaternion / Matrix4x4', () =>
    {
        it('crossmat 的等价纯函数 mat3Set：九个元素与手算一致（反对称矩阵）', () =>
        {
            const m = mat3Identity();
            const a = { x: 1, y: 2, z: 3 };

            // 原 `Vector3.crossmat(out)` 的纯函数形式就是 mat3Set（同一个实现）
            const result = mat3Set([0, -a.z, a.y,
                a.z, 0, -a.x,
                -a.y, a.x, 0], m);

            // (1,2,3) 的叉乘矩阵：
            // [ 0, -3,  2]
            // [ 3,  0, -1]
            // [-2,  1,  0]
            assert.equal(result, m, '必须写入并返回传入的矩阵（身份保持）');
            assert.deepEqual([...m.elements], [0, -3, 2, 3, 0, -1, -2, 1, 0]);
        });

        it('quatVmult：绕 Z 轴 90° 把 (1,0,0) 转成 (0,1,0)（out 传自己即就地）', () =>
        {
            const q = quatSet(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            const v = { x: 1, y: 0, z: 0 };

            const result = quatVmult(q, v, v);

            assert.equal(result, v, 'out 传自己即就地运算，返回 out');
            assert.ok(mathUtil.equals(v.x, 0, 1e-12), `x 应为 0，实际 ${v.x}`);
            assert.ok(mathUtil.equals(v.y, 1, 1e-12), `y 应为 1，实际 ${v.y}`);
            assert.ok(mathUtil.equals(v.z, 0, 1e-12), `z 应为 0，实际 ${v.z}`);
        });

        it('mat4TransformPoint3 用点变换（含平移）：(1,2,3) 平移 (10,20,30) 得 (11,22,33)', () =>
        {
            const mat = mat4FromPosition(10, 20, 30);
            const v = { x: 1, y: 2, z: 3 };

            const result = mat4TransformPoint3(mat, v, v);

            assert.equal(result, v, 'out 传自己即就地运算，返回 out');
            assert.deepEqual(xyz(v), { x: 11, y: 22, z: 33 });
        });

        it('接线：crossmat / quatVmult / mat4TransformPoint3 的「就地」与「新建」结果一致', () =>
        {
            const a = { x: 1, y: 2, z: 3 };
            const mat = mat4FromPosition(10, 20, 30);
            const q = quatSet(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            const crossmatResult = mat3Identity();

            mat3Set([0, -a.z, a.y, a.z, 0, -a.x, -a.y, a.x, 0], crossmatResult);

            const expectedCrossmat = mat3Identity();

            mat3Set([0, -a.z, a.y, a.z, 0, -a.x, -a.y, a.x, 0], expectedCrossmat);

            assert.deepEqual([...crossmatResult.elements], [...expectedCrossmat.elements]);
            assert.deepEqual(xyz(quatVmult(q, a)), xyz(quatVmult(q, a, { x: 0, y: 0, z: 0 })));
            assert.deepEqual(xyz(mat4TransformPoint3(mat, a)), xyz(mat4TransformPoint3(mat, a, { x: 0, y: 0, z: 0 })));
        });
    });

    describe('mat4TransformVector4（原 Vector4.applyMatrix4x4）', () =>
    {
        it('平移矩阵按 w 分量作用于四维向量（手算）', () =>
        {
            const v = { x: 1, y: 2, z: 3, w: 4 };
            const mat = mat4FromPosition(10, 20, 30);

            const result = mat4TransformVector4(mat, v, v);

            assert.equal(result, v, 'out 传自己即就地运算，返回 out');
            // x' = 1·1 + 2·0 + 3·0 + 4·10 = 41，y' = 2 + 4·20 = 82，z' = 3 + 4·30 = 123，w' = 4·1 = 4
            assert.deepEqual(xyzw(v), { x: 41, y: 82, z: 123, w: 4 });
        });

        it('接线：就地与新建两种 out 结果一致', () =>
        {
            const a = { x: 1, y: 2, z: 3, w: 4 };
            const mat = mat4FromPosition(10, 20, 30);

            assert.deepEqual(xyzw(mat4TransformVector4(mat, a)), xyzw(mat4TransformVector4(mat, a, { x: 0, y: 0, z: 0, w: 0 })));
        });
    });

    describe('mat4TransformRay（原 Line3.applyMatri4x4，阶段 C-d 起 class 已删除）', () =>
    {
        it('平移矩阵只改 origin，direction 不变（手算）', () =>
        {
            const line: Line3 = { __type__: 'Line3', origin: { x: 5, y: 6, z: 7 }, direction: { x: 1, y: 0, z: 0 } };
            const mat = mat4FromPosition(10, 20, 30);

            const result = mat4TransformRay(mat, line, line);

            assert.equal(result, line, 'out 传自己即就地运算，返回 out');
            assert.deepEqual(xyz(line.origin), { x: 15, y: 26, z: 37 });
            assert.deepEqual(xyz(line.direction), { x: 1, y: 0, z: 0 });
        });

        it('缩放矩阵按点变换 origin、按向量变换 direction（手算）', () =>
        {
            const line: Line3 = { __type__: 'Line3', origin: { x: 2, y: 3, z: 4 }, direction: { x: 1, y: 0, z: 0 } };
            const mat = mat4FromScale(2, 3, 4);

            mat4TransformRay(mat, line, line);

            assert.deepEqual(xyz(line.origin), { x: 4, y: 9, z: 16 });
            assert.deepEqual(xyz(line.direction), { x: 2, y: 0, z: 0 });
        });

        it('接线：与 mat4TransformPoint3 / mat4TransformVector3 的组合一致', () =>
        {
            const origin = { x: 5, y: 6, z: 7 };
            const direction = { x: 1, y: 0, z: 0 };
            const mat = mat4FromPosition(10, 20, 30);
            const line = line3FromPosAndDir(origin, direction);

            mat4TransformRay(mat, line, line);

            assert.deepEqual(xyz(line.origin), xyz(mat4TransformPoint3(mat, origin)));
            assert.deepEqual(xyz(line.direction), xyz(mat4TransformVector3(mat, direction)));
        });
    });

    describe('Triangle3 的平面 / 最近点 / 距离', () =>
    {
        // 直角三角形 (0,0,0) / (4,0,0) / (0,3,0)，落在 z = 0 平面上
        const makeTriangle = () => tri3FromPoints({ x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, { x: 0, y: 3, z: 0 });

        it('tri3ClosestPointWithPoint 与手算一致', () =>
        {
            const tri = makeTriangle();

            // 投影 (1,1,0) 落在三角形内（重心坐标 0.4167 / 0.25 / 0.3333 全为正）
            assert.deepEqual(xyz(tri3ClosestPointWithPoint(tri, { x: 1, y: 1, z: 5 })), { x: 1, y: 1, z: 0 });
            // 投影 (10,0,0) 落在三角形外 → 三条边最近点里最近的是顶点 (4,0,0)
            assert.deepEqual(xyz(tri3ClosestPointWithPoint(tri, { x: 10, y: 0, z: 0 })), { x: 4, y: 0, z: 0 });
            // 顶点本身
            assert.deepEqual(xyz(tri3ClosestPointWithPoint(tri, { x: 0, y: 3, z: 0 })), { x: 0, y: 3, z: 0 });
        });

        it('tri3DistanceWithPoint / tri3DistanceSquaredWithPoint 与手算一致', () =>
        {
            const tri = makeTriangle();

            assert.equal(tri3DistanceWithPoint(tri, { x: 1, y: 1, z: 5 }), 5);
            assert.equal(tri3DistanceSquaredWithPoint(tri, { x: 1, y: 1, z: 5 }), 25);
            // 到最近顶点 (4,0,0) 的距离为 |10 − 4| = 6
            assert.equal(tri3DistanceWithPoint(tri, { x: 10, y: 0, z: 0 }), 6);
            assert.equal(tri3DistanceSquaredWithPoint(tri, { x: 10, y: 0, z: 0 }), 36);
        });

        it('★ 最近点 / 距离函数结果写进传入的 out（身份断言）', () =>
        {
            const out = { x: 0, y: 0, z: 0 };
            const tri = makeTriangle();

            assert.equal(tri3ClosestPointWithPoint(tri, { x: 1, y: 1, z: 5 }, out), out);
            assert.deepEqual(xyz(out), { x: 1, y: 1, z: 0 });
        });

        it('★ 缺省 out 与显式 out 结果一致（C-c：class 删除后由纯函数自身锁行为）', () =>
        {
            const tri = makeTriangle();
            const point = { x: 10, y: 0, z: 0 };
            const out = { x: 0, y: 0, z: 0 };

            tri3ClosestPointWithPoint(tri, point, out);

            assert.deepEqual(xyz(out), xyz(tri3ClosestPointWithPoint(tri, point)));
            assert.equal(tri3DistanceWithPoint(tri, point), vec3Distance(tri3ClosestPointWithPoint(tri, point), point));
            assert.equal(tri3DistanceSquaredWithPoint(tri, point), vec3DistanceSquared(tri3ClosestPointWithPoint(tri, point), point));
        });

        it('getPlane3d 委托 planeFromPoints：写入并返回 pout（手算平面 z = 0）', () =>
        {
            const tri = makeTriangle();
            const pout: Plane = { __type__: 'Plane', a: 0, b: 1, c: 0, d: 0 };

            const result = planeFromPoints(tri.p0, tri.p1, tri.p2, pout);

            assert.equal(result, pout, 'planeFromPoints 必须写入并返回传入的 Plane（身份保持）');
            assert.equal(pout.a, 0);
            assert.equal(pout.b, 0);
            assert.equal(pout.c, 1);
            assert.equal(pout.d, 0);
        });

        it('tri3ContainsPoint（原 static containsPoint）与 tri3OnWithPoint 一致', () =>
        {
            const p0 = { x: 0, y: 0, z: 0 };
            const p1 = { x: 4, y: 0, z: 0 };
            const p2 = { x: 0, y: 3, z: 0 };

            assert.equal(
                tri3ContainsPoint(p0, p1, p2, { x: 1, y: 1, z: 0 }),
                tri3OnWithPoint({ p0, p1, p2 }, { x: 1, y: 1, z: 0 })
            );
            assert.ok(tri3ContainsPoint(p0, p1, p2, { x: 1, y: 1, z: 0 }));
            assert.ok(!tri3ContainsPoint(p0, p1, p2, { x: 3, y: 3, z: 0 }), '三角形外应为 false');
        });
    });
});
