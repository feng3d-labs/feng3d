import { equals } from '../../src/mathUtils';
import { RotationOrder } from '../../src/enums/RotationOrder';
import {
    mat4Append,
    mat4AppendRotation,
    mat4AppendScale,
    mat4AppendTranslation,
    mat4Copy,
    mat4Determinant,
    mat4Equals,
    mat4FromArray,
    mat4FromAxisRotate,
    mat4FromPosition,
    mat4FromRotation,
    mat4FromScale,
    mat4FromTRS,
    mat4FromVectorPosition,
    mat4FromVectorScale,
    mat4GetScale,
    mat4Identity,
    mat4Invert,
    mat4PrependRotation,
    mat4PrependScale,
    mat4PrependScale1,
    mat4SetOrtho,
    mat4SetPerspective,
    mat4SetPerspectiveFromFOV,
    mat4SetPosition,
    mat4SetRotation,
    mat4SetScale,
    mat4ToTRS,
    mat4TransformPoint3,
    mat4TransformVector3,
    mat4TransformVector4,
    mat4TransformRotation,
    mat4MultiplyPoint,
    mat4MultiplyPoint3x4,
    mat4MultiplyVector,
    type Matrix4x4Like,
    type WritableMatrix4x4Like,
} from '../../src/geom/matrix4x4Ops';
import type { Vector3Like } from '../../src/geom/vector3Ops';
import { VEC3_X_AXIS, VEC3_Y_AXIS, VEC3_Z_AXIS, vec3Add, vec3Equals, vec3From, vec3Length, vec3Multiply, vec3Random, vec3ScaleNumber, vec3Sub } from '../../src/geom/vector3Ops';
import { vec4Copy, vec4Equals, vec4Random, vec4ScaleNumber } from '../../src/geom/vector4Ops';

import { assert, describe, it } from 'vitest';

const { equal } = assert;

/**
 * issue #134 阶段 C-e：`Matrix4x4` 的 class 已删除，本文件由 class 行为用例改写为
 * **同义纯函数用例**，断言逐条保留。两处需要说明：
 *
 * 1. 原 `new Matrix4x4().append(a).append(b)…` 链用 {@link appended} /
 *    {@link appendedRotations} 两个小工具表达（都是「单位矩阵上依次左乘」，与原链逐字等价）；
 * 2. **删掉一条白盒用例**：原「appendScale 直接改写 elements（不构造缩放矩阵）」用
 *    `vi.spyOn(Matrix4x4, 'fromScale')` 统计分配次数——class 删除后没有可 spy 的对象。
 *    它的**可观察契约**（appendScale 与「左乘一个缩放矩阵」逐元素等价）由前一条用例覆盖。
 */

/**
 * `mat4TransformVector4` 的 out 恒为 `Vector4` 实例：原用例要对结果调 `equals` / `scaleNumber`，
 * 而纯函数缺省 out 的**静态类型**是 `WritableVector4Like`（没有实例方法）。
 */
function tv4(m: Matrix4x4Like, v: Vector4Like): Vector4
{
    const out = { x: 0, y: 0, z: 0, w: 0 };

    mat4TransformVector4(m, v, out);

    return out;
}

/** `mat4TransformPoint3` 的 out 恒为 `Vector3` 实例（原用例要对结果调 `equals` / `subTo`）。 */
function transformedPoint3(m: Matrix4x4Like, v: Vector3Like): Vector3
{
    const out = { x: 0, y: 0, z: 0 };

    mat4TransformPoint3(m, v, out);

    return out;
}

/** `mat4TransformVector3` 的 out 恒为 `Vector3` 实例（同上，`.length` 要用）。 */
function transformedVector3(m: Matrix4x4Like, v: Vector3Like): Vector3
{
    const out = { x: 0, y: 0, z: 0 };

    mat4TransformVector3(m, v, out);

    return out;
}

/** 原 `new Matrix4x4().append(a).append(b)…`：单位矩阵上依次左乘。 */
function appended(...lhsList: Matrix4x4Like[]): WritableMatrix4x4Like
{
    const out = mat4Identity();

    for (const lhs of lhsList) mat4Append(out, lhs, out);

    return out;
}

/** 原 `new Matrix4x4().appendRotation(axis, angle)…` 链：单位矩阵上依次左乘绕轴旋转。 */
function appendedRotations(...pairs: readonly [Vector3Like, number][]): WritableMatrix4x4Like
{
    const out = mat4Identity();

    for (const [axis, angle] of pairs) mat4AppendRotation(out, axis, angle, undefined, out);

    return out;
}

describe('Matrix4x4', () =>
{
    it('invert', () =>
    {
        const mat = mat4FromTRS(vec3Random(), vec3Random(), vec3Random());
        const iMat = mat4Invert(mat);

        assert.ok(
            mat4Equals(mat4Append(mat4Copy(iMat), mat), mat4Identity())
        );

        const v = vec4Random();
        const v0 = vec4Copy(v);

        mat4TransformVector4(mat, v0, v0);
        mat4TransformVector4(iMat, v0, v0);
        assert.ok(
            vec4Equals(v, v0)
        );
    });

    it('decompose,recompose', () =>
    {
        const vs = [vec3Random(), vec3Random(), vec3Random()];
        vec3From(1, 1, 1, vs[2]);
        const mat = mat4FromTRS(vs[0], vs[1], vs[2]);
        const vs0 = mat4ToTRS(mat);

        assert.ok(vec3Equals(vs[0], vs0[0]));
        assert.ok(vec3Equals(vs[1], vs0[1]));
        assert.ok(vec3Equals(vs[2], vs0[2]));

        const t = mat4FromPosition(vs[0].x, vs[0].y, vs[0].z);
        const r = mat4FromRotation(vs[1].x, vs[1].y, vs[1].z);
        const s = mat4FromScale(vs[2].x, vs[2].y, vs[2].z);
        const mat0 = appended(s, r, t);

        assert.ok(mat4Equals(mat, mat0));

        const mat1 = mat4FromTRS(vs[0], vs[1], vs[2]);
        assert.ok(mat4Equals(mat, mat1));
    });

    it('！！！！', () =>
    {
        const mat0 = mat4FromTRS(vec3Random(), vec3Random(360), vec3Random());
        const mat1 = mat4FromTRS(vec3Random(), vec3Random(360), vec3Random());

        const mat2 = mat4Append(mat0, mat1, mat0);
        const vs = mat4ToTRS(mat2);
        const mat3 = mat4FromTRS(vs[0], vs[1], vs[2]);

        // !!!!
        assert.ok(
            !mat4Equals(mat2, mat3)
        );
    });

    it('setOrtho， 测试正交矩阵可逆性', () =>
    {
        // 生成随机正交矩阵
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = mat4SetOrtho(left, right, top, bottom, near, far);
        assert.ok(mat4Determinant(mat) !== 0);

        const invertMat = mat4Invert(mat);
        const v = vec4Random();
        const v1 = tv4(invertMat, tv4(mat, v));
        assert.ok(vec4Equals(v, v1));
    });

    it('setOrtho，测试可视空间的8个顶点是否被正确投影', () =>
    {
        // 生成随机正交矩阵
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = mat4SetOrtho(left, right, top, bottom, near, far);

        // 测试可视空间的8个顶点是否被正确投影
        // WebGPU 约定（z→[0,1]，相机看 -Z）：视锥体顶点 z 为 -near/-far（相机前方 -Z），near→0/far→1
        const lbn = { x: left, y: bottom, z: -near, w: 1 };
        let tv = tv4(mat, lbn);
        assert.ok(vec4Equals({ x: -1, y: -1, z: 0, w: 1  }, tv));

        const lbf = { x: left, y: bottom, z: -far, w: 1 };
        tv = tv4(mat, lbf);
        assert.ok(vec4Equals({ x: -1, y: -1, z: 1, w: 1  }, tv));

        const ltn = { x: left, y: top, z: -near, w: 1 };
        tv = tv4(mat, ltn);
        assert.ok(vec4Equals({ x: -1, y: 1, z: 0, w: 1  }, tv));

        const ltf = { x: left, y: top, z: -far, w: 1 };
        tv = tv4(mat, ltf);
        assert.ok(vec4Equals({ x: -1, y: 1, z: 1, w: 1  }, tv));

        const rbn = { x: right, y: bottom, z: -near, w: 1 };
        tv = tv4(mat, rbn);
        assert.ok(vec4Equals({ x: 1, y: -1, z: 0, w: 1  }, tv));

        const rbf = { x: right, y: bottom, z: -far, w: 1 };
        tv = tv4(mat, rbf);
        assert.ok(vec4Equals({ x: 1, y: -1, z: 1, w: 1  }, tv));

        const rtn = { x: right, y: top, z: -near, w: 1 };
        tv = tv4(mat, rtn);
        assert.ok(vec4Equals({ x: 1, y: 1, z: 0, w: 1  }, tv));

        const rtf = { x: right, y: top, z: -far, w: 1 };
        tv = tv4(mat, rtf);
        assert.ok(vec4Equals({ x: 1, y: 1, z: 1, w: 1  }, tv));
    });

    it('setPerspectiveFromFOV，测试透视矩阵可逆性', () =>
    {
        const fov = Math.random() * Math.PI * 2;
        const aspect = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = mat4SetPerspectiveFromFOV(fov, aspect, near, far);
        assert.ok(mat4Determinant(mat) !== 0);

        const invertMat = mat4Invert(mat);
        const v = vec4Random();
        const v1 = tv4(invertMat, tv4(mat, v));

        assert.ok(vec4Equals(v, v1));
    });

    it('setPerspectiveFromFOV，测试可视空间的8个顶点是否被正确投影', () =>
    {
        const fov = Math.random() * 360;
        const aspect = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = mat4SetPerspectiveFromFOV(fov, aspect, near, far);

        const tan = Math.tan(fov * Math.PI / 360);
        // 测试可视空间的8个顶点是否被正确投影
        // WebGPU 约定（z→[0,1]，相机看 -Z）：视锥体顶点 z 为 -near/-far（相机前方 -Z），
        // w = -z（m[11]=-1），齐次除法后 z 近→0/远→1
        const lbn = { x: -tan * near * aspect, y: -tan * near, z: -near, w: 1 };
        let tv = tv4(mat, lbn);
        equal(tv.w, -lbn.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: -1, z: 0, w: 1  }, tv));

        const lbf = { x: -tan * far * aspect, y: -tan * far, z: -far, w: 1 };
        tv = tv4(mat, lbf);
        equal(tv.w, -lbf.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: -1, z: 1, w: 1  }, tv));

        const ltn = { x: -tan * near * aspect, y: tan * near, z: -near, w: 1 };
        tv = tv4(mat, ltn);
        equal(tv.w, -ltn.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: 1, z: 0, w: 1  }, tv));

        const ltf = { x: -tan * far * aspect, y: tan * far, z: -far, w: 1 };
        tv = tv4(mat, ltf);
        equal(tv.w, -ltf.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: 1, z: 1, w: 1  }, tv));

        const rbn = { x: tan * near * aspect, y: -tan * near, z: -near, w: 1 };
        tv = tv4(mat, rbn);
        equal(tv.w, -rbn.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: -1, z: 0, w: 1  }, tv));

        const rbf = { x: tan * far * aspect, y: -tan * far, z: -far, w: 1 };
        tv = tv4(mat, rbf);
        equal(tv.w, -rbf.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: -1, z: 1, w: 1  }, tv));

        const rtn = { x: tan * near * aspect, y: tan * near, z: -near, w: 1 };
        tv = tv4(mat, rtn);
        equal(tv.w, -rtn.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: 1, z: 0, w: 1  }, tv));

        const rtf = { x: tan * far * aspect, y: tan * far, z: -far, w: 1 };
        tv = tv4(mat, rtf);
        equal(tv.w, -rtf.z);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: 1, z: 1, w: 1  }, tv));
    });

    it('setPerspective，测试透视矩阵可逆性', () =>
    {
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = mat4SetPerspective(left, right, top, bottom, near, far);
        assert.ok(mat4Determinant(mat) !== 0);

        const invertMat = mat4Invert(mat);
        const v = vec4Random();
        const v1 = tv4(invertMat, tv4(mat, v));

        assert.ok(vec4Equals(v, v1));
    });

    it('setPerspective,测试可视空间的8个顶点是否被正确投影', () =>
    {
        const left = Math.random();
        const right = Math.random();
        const top = Math.random();
        const bottom = Math.random();
        const near = Math.random();
        const far = Math.random();
        //
        const mat = mat4SetPerspective(left, right, top, bottom, near, far);

        const tan = (top - bottom) / 2 / near;
        const aspect = (right - left) / (top - bottom);
        // 测试可视空间的8个顶点是否被正确投影（WebGPU 约定 z→[0,1]，视锥体顶点 z 为 -near/-far）
        const lbn = { x: -tan * near * aspect, y: -tan * near, z: -near, w: 1 };
        let tv = tv4(mat, lbn);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: -1, z: 0, w: 1  }, tv));

        const lbf = { x: -tan * far * aspect, y: -tan * far, z: -far, w: 1 };
        tv = tv4(mat, lbf);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: -1, z: 1, w: 1  }, tv));

        const ltn = { x: -tan * near * aspect, y: tan * near, z: -near, w: 1 };
        tv = tv4(mat, ltn);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: 1, z: 0, w: 1  }, tv));

        const ltf = { x: -tan * far * aspect, y: tan * far, z: -far, w: 1 };
        tv = tv4(mat, ltf);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: -1, y: 1, z: 1, w: 1  }, tv));

        const rbn = { x: tan * near * aspect, y: -tan * near, z: -near, w: 1 };
        tv = tv4(mat, rbn);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: -1, z: 0, w: 1  }, tv));

        const rbf = { x: tan * far * aspect, y: -tan * far, z: -far, w: 1 };
        tv = tv4(mat, rbf);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: -1, z: 1, w: 1  }, tv));

        const rtn = { x: tan * near * aspect, y: tan * near, z: -near, w: 1 };
        tv = tv4(mat, rtn);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: 1, z: 0, w: 1  }, tv));

        const rtf = { x: tan * far * aspect, y: tan * far, z: -far, w: 1 };
        tv = tv4(mat, rtf);
        vec4ScaleNumber(tv, 1 / tv.w, tv);
        assert.ok(vec4Equals({ x: 1, y: 1, z: 1, w: 1  }, tv));
    });

    it('fromRotation', () =>
    {
        const r = vec3Random(360, true);

        //
        let mat = mat4FromRotation(r.x, r.y, r.z, RotationOrder.ZYX);
        let mat0 = appendedRotations([VEC3_X_AXIS, r.x], [VEC3_Y_AXIS, r.y], [VEC3_Z_AXIS, r.z]);
        assert.ok(mat4Equals(mat, mat0));

        //
        mat = mat4FromRotation(r.x, r.y, r.z, RotationOrder.YZX);
        mat0 = appendedRotations([VEC3_X_AXIS, r.x], [VEC3_Z_AXIS, r.z], [VEC3_Y_AXIS, r.y]);
        assert.ok(mat4Equals(mat, mat0));

        //
        mat = mat4FromRotation(r.x, r.y, r.z, RotationOrder.ZXY);
        mat0 = appendedRotations([VEC3_Y_AXIS, r.y], [VEC3_X_AXIS, r.x], [VEC3_Z_AXIS, r.z]);
        assert.ok(mat4Equals(mat, mat0));

        mat = mat4FromRotation(r.x, r.y, r.z, RotationOrder.XZY);
        mat0 = appendedRotations([VEC3_Y_AXIS, r.y], [VEC3_Z_AXIS, r.z], [VEC3_X_AXIS, r.x]);
        assert.ok(mat4Equals(mat, mat0));

        //
        mat = mat4FromRotation(r.x, r.y, r.z, RotationOrder.YXZ);
        mat0 = appendedRotations([VEC3_Z_AXIS, r.z], [VEC3_X_AXIS, r.x], [VEC3_Y_AXIS, r.y]);
        assert.ok(mat4Equals(mat, mat0));

        //
        mat = mat4FromRotation(r.x, r.y, r.z, RotationOrder.XYZ);
        mat0 = appendedRotations([VEC3_Z_AXIS, r.z], [VEC3_Y_AXIS, r.y], [VEC3_X_AXIS, r.x]);
        assert.ok(mat4Equals(mat, mat0));
    });

    it('prependScale', () =>
    {
        const vs = [vec3Random(), vec3Random(), vec3Random()];
        const mat = mat4FromTRS(vs[0], vs[1], vs[2]);

        const s = vec3Random();

        const mat0 = mat4PrependScale(mat, s.x, s.y, s.z);
        const mat1 = mat4PrependScale1(mat, s.x, s.y, s.z);

        assert.ok(mat4Equals(mat1, mat0));
    });

    it('appendTranslation', () =>
    {
        const translationVec3 = { x: Math.random(), y: Math.random(), z: Math.random() };
        const translationMat4 = mat4FromPosition(translationVec3.x, translationVec3.y, translationVec3.z);

        const randomMat4 = mat4FromArray([
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
        ]);

        const result0 = mat4Append(mat4Copy(randomMat4), translationMat4);
        const result1 = mat4AppendTranslation(mat4Copy(randomMat4), translationVec3.x, translationVec3.y, translationVec3.z);

        assert.ok(mat4Equals(result0, result1));

        //
        const randomTRSMat4 = mat4FromTRS(
            { x: Math.random(), y: Math.random(), z: Math.random() },
            { x: Math.random(), y: Math.random(), z: Math.random() },
            { x: Math.random() + 0.5, y: Math.random() + 0.5, z: Math.random() + 0.5 },
        );

        const result2 = mat4Append(mat4Copy(randomTRSMat4), translationMat4);

        const v0 = vec3Add({ x: randomTRSMat4.elements[12], y: randomTRSMat4.elements[13], z: randomTRSMat4.elements[14] }, translationVec3);
        const v = { x: result2.elements[12], y: result2.elements[13], z: result2.elements[14] };

        assert.ok(vec3Equals(v0, v));
    });

    it('appendScale', () =>
    {
        const randomMat4 = mat4FromArray([
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
        ]);
        const s = vec3Random();

        const result0 = mat4Append(mat4Copy(randomMat4), mat4FromScale(s.x, s.y, s.z));
        const result1 = mat4Copy(randomMat4);
        mat4AppendScale(result1, s.x, s.y, s.z, undefined, result1);

        // 直接改写 elements 必须与「乘一个缩放矩阵」完全等价
        assert.ok(mat4Equals(result0, result1));

        // 只影响前 3 行：第 3 行（m[3] / m[7] / m[11] / m[15]）保持不变
        assert.deepEqual(
            [result1.elements[3], result1.elements[7], result1.elements[11], result1.elements[15]],
            [randomMat4.elements[3], randomMat4.elements[7], randomMat4.elements[11], randomMat4.elements[15]],
        );
    });

    it('appendScale 支持锚点缩放（锚点是不动点）', () =>
    {
        const pivot = { x: 1, y: 2, z: 3 };
        const mat = mat4AppendScale(mat4Identity(), 2, 3, 4, pivot);

        // 锚点自身在缩放后位置不变
        const moved = transformedPoint3(mat, pivot);

        assert.ok(vec3Equals(moved, pivot));

        // 其它点按相对锚点的偏移被缩放
        const scaled = transformedPoint3(mat, { x: 2, y: 2, z: 3 });

        assert.ok(vec3Equals(scaled, { x: 3, y: 2, z: 3 }));
    });

    it('appendScale 锚点为原点时与不传锚点等价', () =>
    {
        const vs = [vec3Random(), vec3Random(), vec3Random()];
        const mat0 = mat4FromTRS(vs[0], vs[1], vs[2]);
        const mat1 = mat4FromTRS(vs[0], vs[1], vs[2]);

        mat4AppendScale(mat0, 2, 3, 4, undefined, mat0);
        mat4AppendScale(mat1, 2, 3, 4, { x: 0, y: 0, z: 0 }, mat1);

        assert.ok(mat4Equals(mat0, mat1));
    });

    it('快速计算向量变换后的长度', () =>
    {
        const p0 = vec3ScaleNumber(vec3Random(), 100);
        const p1 = vec3ScaleNumber(vec3Random(), 100);

        const vs = [vec3Random(), vec3Random(), vec3Random()];
        const mat = mat4FromTRS(vs[0], vs[1], vs[2]);

        // 0 两点求长度
        const p0t1 = transformedPoint3(mat, p0);
        const p1t1 = transformedPoint3(mat, p1);
        const length0 = vec3Length(vec3Sub(p1t1, p0t1));

        // 1 向量求长度
        let p01 = vec3Sub(p1, p0);
        const p01t1 = transformedVector3(mat, p01);
        const length1 = vec3Length(p01t1);

        // 2 快速计算向量变换后的长度（缩放求长度）
        p01 = vec3Sub(p1, p0);
        const s = { x: 0, y: 0, z: 0 };
        mat4GetScale(mat, s);
        const p01t2 = vec3Multiply(p01, s);
        const length2 = vec3Length(p01t2);

        assert.ok(equals(length0, length1) && equals(length0, length2));
    });

    it('★★ 纯入参接受字面量，结果与 Vector3 实例一致（#134 B3 / C-e）', () =>
    {
        const p = { x: 1, y: 2, z: 3 };
        const r = { x: 0.1, y: 0.2, z: 0.3 };
        const s = { x: 2, y: 3, z: 4 };
        const axis = { x: 0.6, y: 0.8, z: 0 };
        const pLike = { x: 1, y: 2, z: 3 };
        const rLike = { x: 0.1, y: 0.2, z: 0.3 };
        const sLike = { x: 2, y: 3, z: 4 };
        const axisLike = { x: 0.6, y: 0.8, z: 0 };
        const pivotLike = { x: 1, y: 2, z: 3 };

        // 阶段 C-e：`Matrix4x4` 的 class 已删除，本用例改为**直接验证纯函数**——
        // 原来比较「静态方法 / 实例方法」两条路径，两条路径现在都归到同一个纯函数
        const fromClass = mat4FromTRS(p, r, s);

        assert.ok(mat4Equals(mat4FromTRS(pLike, rLike, sLike), fromClass));
        assert.ok(mat4Equals(mat4FromAxisRotate(axisLike, 0.5), mat4FromAxisRotate(axis, 0.5)));

        // setPosition / setRotation / setScale 的入参放宽：字面量与实例逐位一致
        const bySettersLike = mat4SetScale(mat4SetRotation(mat4SetPosition(mat4Copy(fromClass), pLike), rLike), sLike);
        const bySettersClass = mat4SetScale(mat4SetRotation(mat4SetPosition(mat4Copy(fromClass), p), r), s);

        assert.ok(mat4Equals(bySettersLike, bySettersClass));

        // appendRotation / appendScale 的锚点、prependRotation 的轴
        const appendedClass = mat4AppendScale(mat4AppendRotation(mat4Copy(fromClass), axis, 0.5, p), 2, 3, 4, p);
        const appendedLike = mat4AppendScale(mat4AppendRotation(mat4Copy(fromClass), axisLike, 0.5, pivotLike), 2, 3, 4, pivotLike);

        assert.ok(mat4Equals(appendedLike, appendedClass));
        assert.ok(mat4Equals(mat4PrependRotation(mat4Identity(), axisLike, 0.5), mat4PrependRotation(mat4Identity(), axis, 0.5)));

        // 变换类 API：只有 vin 放宽；缺省 out 现在是**纯数据字面量**（class 已删除），
        // 值必须与显式传 Vector3 时逐位一致
        const inputs: readonly { api: string; run: (v: Vector3Like) => Vector3Like }[] = [
            { api: 'mat4TransformPoint3', run: (v) => mat4TransformPoint3(fromClass, v) },
            { api: 'mat4TransformVector3', run: (v) => mat4TransformVector3(fromClass, v) },
            { api: 'mat4TransformRotation', run: (v) => mat4TransformRotation(fromClass, v) },
            { api: 'mat4MultiplyPoint', run: (v) => mat4MultiplyPoint(fromClass, v) },
            { api: 'mat4MultiplyPoint3x4', run: (v) => mat4MultiplyPoint3x4(fromClass, v) },
            { api: 'mat4MultiplyVector', run: (v) => mat4MultiplyVector(fromClass, v) },
            { api: 'mat4GetScale', run: () => mat4GetScale(fromClass) },
        ];
        for (const { api, run } of inputs)
        {
            const out = run({ x: 5, y: 6, z: 7 });

            assert.equal(Object.getPrototypeOf(out), Object.prototype, `${api} 缺省 out 必须是纯数据字面量`);
            assert.ok(vec3Equals(out, run({ x: 5, y: 6, z: 7 })), `${api} 字面量与 Vector3 实例结果一致`);
        }

        // 静态 Scale / Translate
        assert.ok(mat4Equals(mat4FromVectorScale(sLike), mat4FromScale(s.x, s.y, s.z)));
        assert.ok(mat4Equals(mat4FromVectorPosition(pLike), mat4FromPosition(p.x, p.y, p.z)));
    });

    it('★ setRotation 沿用调用方的旋转序（#134 后续清理批修的「重组写死默认序」）', () =>
    {
        // 旧实现：分解用 `order`、重组写死 XYZ —— order = XZY 时静默丢失，回读的欧拉角与传入不符。
        const base = mat4FromTRS({ x: 1, y: 2, z: 3 }, { x: 0.1, y: 0.2, z: 0.3 }, { x: 2, y: 3, z: 4 }, RotationOrder.XZY);
        const target = { x: 0.4, y: -0.5, z: 0.6 };
        const bySet = mat4SetRotation(base, target, RotationOrder.XZY);
        const p = { x: 0, y: 0, z: 0 };
        const r = { x: 0, y: 0, z: 0 };
        const s = { x: 0, y: 0, z: 0 };

        mat4ToTRS(bySet, p, r, s, RotationOrder.XZY);

        assert.ok(vec3Equals(p, { x: 1, y: 2, z: 3 }, 1e-9), '位移应保持不变');
        assert.ok(vec3Equals(s, { x: 2, y: 3, z: 4 }, 1e-9), '缩放应保持不变');
        assert.ok(vec3Equals(r, target, 1e-9), `欧拉角应等于传入值：期望 ${JSON.stringify(target)}，实际 ${JSON.stringify(r)}`);

        // 旧行为对照（重组写死 XYZ）：同一组数据回读**不**等于 target——证明本用例能抓住回归
        const legacy = mat4FromTRS({ x: 1, y: 2, z: 3 }, target, { x: 2, y: 3, z: 4 }, RotationOrder.XYZ);
        const legacyR = { x: 0, y: 0, z: 0 };

        mat4ToTRS(legacy, { x: 0, y: 0, z: 0 }, legacyR, { x: 0, y: 0, z: 0 }, RotationOrder.XZY);
        assert.ok(!vec3Equals(legacyR, target, 1e-6), '旧行为应当与 target 不等，否则本用例发现不了回归');
    });
});