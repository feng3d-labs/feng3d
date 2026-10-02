import { mathUtil } from '@feng3d/polyfill';
import { Line3 } from '../../src/geom/Line3';
import { mat3Set } from '../../src/geom/matrix3x3Ops';
import { Matrix3x3 } from '../../src/geom/Matrix3x3';
import { Matrix4x4 } from '../../src/geom/Matrix4x4';
import { mat4TransformPoint3, mat4TransformVector3, mat4TransformVector4 } from '../../src/geom/matrix4x4Ops';
import { Plane } from '../../src/geom/Plane';
import { planeFromPoints } from '../../src/geom/planeOps';
import { Quaternion } from '../../src/geom/Quaternion';
import { quatVmult } from '../../src/geom/quaternionOps';
import {
    tri3ClosestPointWithPoint,
    tri3ContainsPoint,
    tri3DistanceSquaredWithPoint,
    tri3DistanceWithPoint,
    tri3FromPoints,
    tri3OnWithPoint,
} from '../../src/geom/triangle3Ops';
import { Vector2 } from '../../src/geom/Vector2';
import { Vector3 } from '../../src/geom/Vector3';
import type { Vector3Like } from '../../src/geom/Vector3';
import { Vector4 } from '../../src/geom/Vector4';
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
 * 2. `Line3.applyMatri4x4`；
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
            const v4 = new Vector4(0, 0, 0, 9);

            vec3ToVec4(new Vector3(1, 2, 3), v4);

            assert.deepEqual(xyzw(v4), { x: 1, y: 2, z: 3, w: 9 });
        });

        it('★ 转换函数结果写进传入的 out（身份断言，方案 §10.1 P8f）', () =>
        {
            const out2 = new Vector2();
            const out3 = new Vector3();
            const out4 = new Vector4();

            assert.equal(vec3ToVec2(new Vector3(1, 2, 3), out2), out2);
            assert.equal(vec2ToVec3(new Vector2(1, 2), 3, out3), out3);
            assert.equal(vec3ToVec4(new Vector3(1, 2, 3), out4), out4);
        });

        it('转换函数不修改入参', () =>
        {
            const v2 = { x: 1, y: 2 };
            const v3 = new Vector3(3, 4, 5);

            vec2ToVec3(v2, 9);
            vec3ToVec2(v3);
            vec3ToVec4(v3);

            assert.deepEqual(xy(v2), { x: 1, y: 2 });
            assert.deepEqual(xyz(v3), { x: 3, y: 4, z: 5 });
        });

        it('静态工厂仍是 Vector3 实例，实例方法就地返回 this', () =>
        {
            const v = Vector3.fromVector2(new Vector2(4, 5), 6);

            assert.ok(v instanceof Vector3, 'fromVector2 必须返回 Vector3 实例（不能返回纯字面量）');
            assert.deepEqual(xyz(v), { x: 4, y: 5, z: 6 });

            const target = new Vector3();
            const v2 = { x: 7, y: 8 };

            assert.equal(target.fromVector2(v2, 9), target);
            assert.deepEqual(xyz(target), { x: 7, y: 8, z: 9 });
        });

        it('接线：class 的三个转换方法与纯函数结果一致', () =>
        {
            const v2 = new Vector2(4, 5);
            const v3 = new Vector3(7, 8, 9);
            const toVector2Result = new Vector2();
            const toVector4Result = new Vector4();

            v3.toVector2(toVector2Result);
            v3.toVector4(toVector4Result);

            assert.deepEqual(xyz(Vector3.fromVector2(v2, 6)), xyz(vec2ToVec3(v2, 6)));
            assert.deepEqual(xy(toVector2Result), xy(vec3ToVec2(v3)));
            assert.deepEqual(xyzw(toVector4Result), xyzw(vec3ToVec4(v3)));
        });
    });

    describe('Vector3 ↔ Matrix3x3 / Quaternion / Matrix4x4', () =>
    {
        it('crossmat 的九个元素与手算一致（反对称矩阵）', () =>
        {
            const m = new Matrix3x3();

            const result = new Vector3(1, 2, 3).crossmat(m);

            // (1,2,3) 的叉乘矩阵：
            // [ 0, -3,  2]
            // [ 3,  0, -1]
            // [-2,  1,  0]
            assert.equal(result, m, 'crossmat 必须写入并返回传入的矩阵（身份保持）');
            assert.deepEqual([...m.elements], [0, -3, 2, 3, 0, -1, -2, 1, 0]);
        });

        it('applyQuaternion：绕 Z 轴 90° 把 (1,0,0) 转成 (0,1,0)', () =>
        {
            const q = new Quaternion(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            const v = new Vector3(1, 0, 0);

            const result = v.applyQuaternion(q);

            assert.equal(result, v, 'applyQuaternion 是就地运算，返回 this');
            assert.ok(mathUtil.equals(v.x, 0, 1e-12), `x 应为 0，实际 ${v.x}`);
            assert.ok(mathUtil.equals(v.y, 1, 1e-12), `y 应为 1，实际 ${v.y}`);
            assert.ok(mathUtil.equals(v.z, 0, 1e-12), `z 应为 0，实际 ${v.z}`);
        });

        it('applyMatrix4x4 用点变换（含平移）：(1,2,3) 平移 (10,20,30) 得 (11,22,33)', () =>
        {
            const mat = Matrix4x4.fromPosition(10, 20, 30);
            const v = new Vector3(1, 2, 3);

            const result = v.applyMatrix4x4(mat);

            assert.equal(result, v, 'applyMatrix4x4 是就地运算，返回 this');
            assert.deepEqual(xyz(v), { x: 11, y: 22, z: 33 });
        });

        it('接线：crossmat / applyQuaternion / applyMatrix4x4 与纯函数结果一致', () =>
        {
            const a = new Vector3(1, 2, 3);
            const mat = Matrix4x4.fromPosition(10, 20, 30);
            const q = new Quaternion(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            const crossmatResult = new Matrix3x3();

            a.crossmat(crossmatResult);

            const expectedCrossmat = new Matrix3x3();

            mat3Set([0, -a.z, a.y, a.z, 0, -a.x, -a.y, a.x, 0], expectedCrossmat);

            assert.deepEqual([...crossmatResult.elements], [...expectedCrossmat.elements]);
            assert.deepEqual(xyz(a.clone().applyQuaternion(q)), xyz(quatVmult(q, a)));
            assert.deepEqual(xyz(a.clone().applyMatrix4x4(mat)), xyz(mat4TransformPoint3(mat, a)));
        });
    });

    describe('Vector4.applyMatrix4x4', () =>
    {
        it('平移矩阵按 w 分量作用于四维向量（手算）', () =>
        {
            const v = new Vector4(1, 2, 3, 4);
            const mat = Matrix4x4.fromPosition(10, 20, 30);

            const result = v.applyMatrix4x4(mat);

            assert.equal(result, v, 'applyMatrix4x4 是就地运算，返回 this');
            // x' = 1·1 + 2·0 + 3·0 + 4·10 = 41，y' = 2 + 4·20 = 82，z' = 3 + 4·30 = 123，w' = 4·1 = 4
            assert.deepEqual(xyzw(v), { x: 41, y: 82, z: 123, w: 4 });
        });

        it('接线：与 mat4TransformVector4 结果一致', () =>
        {
            const a = new Vector4(1, 2, 3, 4);
            const mat = Matrix4x4.fromPosition(10, 20, 30);

            assert.deepEqual(xyzw(a.clone().applyMatrix4x4(mat)), xyzw(mat4TransformVector4(mat, a)));
        });
    });

    describe('Line3.applyMatri4x4', () =>
    {
        it('平移矩阵只改 origin，direction 不变（手算）', () =>
        {
            const line = new Line3(new Vector3(5, 6, 7), new Vector3(1, 0, 0));
            const mat = Matrix4x4.fromPosition(10, 20, 30);

            const result = line.applyMatri4x4(mat);

            assert.equal(result, line, 'applyMatri4x4 是就地运算，返回 this');
            assert.deepEqual(xyz(line.origin), { x: 15, y: 26, z: 37 });
            assert.deepEqual(xyz(line.direction), { x: 1, y: 0, z: 0 });
        });

        it('缩放矩阵按点变换 origin、按向量变换 direction（手算）', () =>
        {
            const line = new Line3(new Vector3(2, 3, 4), new Vector3(1, 0, 0));
            const mat = new Matrix4x4().fromScale(2, 3, 4);

            line.applyMatri4x4(mat);

            assert.deepEqual(xyz(line.origin), { x: 4, y: 9, z: 16 });
            assert.deepEqual(xyz(line.direction), { x: 2, y: 0, z: 0 });
        });

        it('接线：与 mat4TransformPoint3 / mat4TransformVector3 的组合一致', () =>
        {
            const origin = new Vector3(5, 6, 7);
            const direction = new Vector3(1, 0, 0);
            const mat = Matrix4x4.fromPosition(10, 20, 30);
            const line = new Line3(origin.clone(), direction.clone());

            line.applyMatri4x4(mat);

            assert.deepEqual(xyz(line.origin), xyz(mat4TransformPoint3(mat, origin)));
            assert.deepEqual(xyz(line.direction), xyz(mat4TransformVector3(mat, direction)));
        });
    });

    describe('Triangle3 的平面 / 最近点 / 距离', () =>
    {
        // 直角三角形 (0,0,0) / (4,0,0) / (0,3,0)，落在 z = 0 平面上
        const makeTriangle = () => tri3FromPoints(new Vector3(0, 0, 0), new Vector3(4, 0, 0), new Vector3(0, 3, 0));

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
            const out = new Vector3();
            const tri = makeTriangle();

            assert.equal(tri3ClosestPointWithPoint(tri, { x: 1, y: 1, z: 5 }, out), out);
            assert.deepEqual(xyz(out), { x: 1, y: 1, z: 0 });
        });

        it('★ 缺省 out 与显式 out 结果一致（C-c：class 删除后由纯函数自身锁行为）', () =>
        {
            const tri = makeTriangle();
            const point = new Vector3(10, 0, 0);
            const out = new Vector3();

            tri3ClosestPointWithPoint(tri, point, out);

            assert.deepEqual(xyz(out), xyz(tri3ClosestPointWithPoint(tri, point)));
            assert.equal(tri3DistanceWithPoint(tri, point), vec3Distance(tri3ClosestPointWithPoint(tri, point), point));
            assert.equal(tri3DistanceSquaredWithPoint(tri, point), vec3DistanceSquared(tri3ClosestPointWithPoint(tri, point), point));
        });

        it('getPlane3d 委托 planeFromPoints：写入并返回 pout（手算平面 z = 0）', () =>
        {
            const tri = makeTriangle();
            const pout = new Plane();

            const result = planeFromPoints(tri.p0, tri.p1, tri.p2, pout);

            assert.equal(result, pout, 'planeFromPoints 必须写入并返回传入的 Plane（身份保持）');
            assert.equal(pout.a, 0);
            assert.equal(pout.b, 0);
            assert.equal(pout.c, 1);
            assert.equal(pout.d, 0);
        });

        it('tri3ContainsPoint（原 static containsPoint）与 tri3OnWithPoint 一致', () =>
        {
            const p0 = new Vector3(0, 0, 0);
            const p1 = new Vector3(4, 0, 0);
            const p2 = new Vector3(0, 3, 0);

            assert.equal(
                tri3ContainsPoint(p0, p1, p2, new Vector3(1, 1, 0)),
                tri3OnWithPoint({ p0, p1, p2 }, { x: 1, y: 1, z: 0 })
            );
            assert.ok(tri3ContainsPoint(p0, p1, p2, new Vector3(1, 1, 0)));
            assert.ok(!tri3ContainsPoint(p0, p1, p2, new Vector3(3, 3, 0)), '三角形外应为 false');
        });
    });
});
