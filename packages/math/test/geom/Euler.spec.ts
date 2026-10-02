import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../../src/enums/RotationOrder';
import type { Euler } from '../../src/geom/eulerOps';
import {
    eulerCopy,
    eulerEquals,
    eulerFromArray,
    eulerFromQuaternion,
    eulerFromRotationMatrix,
    eulerFromVector3,
    eulerRandom,
    eulerReorder,
    eulerSet,
    eulerToArray,
    eulerToVector3,
} from '../../src/geom/eulerOps';
import { mat4FromRotation, mat4GetRotation } from '../../src/geom/matrix4x4Ops';
import { quatEquals, quatFromEuler, quatRandom, quatSet } from '../../src/geom/quaternionOps';
import { vec3Equals, vec3Random } from '../../src/geom/vector3Ops';

import { assert, describe, it } from 'vitest';
const { deepEqual } = assert;

/**
 * 纯数据欧拉角：原 `new Euler(x, y, z, order)` 的字面量形态（issue #134 阶段 C-a 起 class 已删除）。
 *
 * 返回的是纯函数层的 `out` 目标形状（`WritableEulerLike`，**不带** `__type__` 判别字段）——
 * 与 `eulerRandom()` 等纯函数返回的字面量逐字段可比；带判别字段的数据声明形态见 `constructor` 用例。
 */
function eulerLike(x = 0, y = 0, z = 0, order: RotationOrder = mathUtil.DefaultRotationOrder)
{
    return { x, y, z, order };
}

describe('Euler', () =>
{
    it('constructor', () =>
    {
        // 数据声明形态：带 `readonly __type__: 'Euler'` 判别字段（方案 §5.9 的 D1 决策）
        const euler: Euler = { __type__: 'Euler', x: 0, y: 0, z: 0, order: mathUtil.DefaultRotationOrder };

        deepEqual(euler.x, 0);
        deepEqual(euler.y, 0);
        deepEqual(euler.z, 0);

        deepEqual(euler.order, mathUtil.DefaultRotationOrder);
    });

    it('random', () =>
    {
        const euler = eulerRandom();

        deepEqual(euler.x !== 0, true);
        deepEqual(euler.y !== 0, true);
        deepEqual(euler.z !== 0, true);

        deepEqual(0 <= euler.order && euler.order <= 5, true);
    });

    it('set', () =>
    {
        const euler = eulerLike();

        const eulerV = eulerRandom();

        eulerSet(eulerV.x, eulerV.y, eulerV.z, eulerV.order, euler);

        deepEqual(euler, eulerV);

        const oldOrder = euler.order;

        // order 缺省时不写 out.order（与 class 的 `set(x, y, z)` 一致）
        eulerSet(Math.random(), Math.random(), Math.random(), undefined, euler);
        deepEqual(oldOrder, euler.order);
    });

    it('clone', () =>
    {
        const euler = eulerRandom();
        const clone = eulerCopy(euler);

        deepEqual(euler, clone);
    });

    it('fromRotationMatrix', () =>
    {
        const matrix = mat4FromRotation(360 * Math.random(), 360 * Math.random(), 360 * Math.random());

        const euler = eulerRandom();

        eulerFromRotationMatrix(euler, matrix, euler.order, euler);

        const angles = mat4GetRotation(matrix, undefined, euler.order);

        deepEqual(vec3Equals(angles, euler), true);
    });

    it('fromQuaternion', () =>
    {
        const quaternion = quatRandom();

        const euler = eulerRandom();

        eulerFromQuaternion(euler, quaternion, euler.order, euler);

        const newQuaternion = quatSet();

        quatFromEuler(euler.x, euler.y, euler.z, euler.order, newQuaternion);

        deepEqual(quatEquals(quaternion, newQuaternion), true);
    });

    it('fromVector3', () =>
    {
        const vector3 = vec3Random();

        const euler = eulerRandom();

        const oldOrder = euler.order;

        eulerFromVector3(euler, vector3, undefined, euler);

        deepEqual(euler.x, vector3.x);
        deepEqual(euler.y, vector3.y);
        deepEqual(euler.z, vector3.z);
        deepEqual(oldOrder, euler.order);
    });

    it('reorder', () =>
    {
        const euler = eulerRandom();

        eulerReorder(euler, RotationOrder.XYZ, euler);

        const euler1 = eulerCopy(euler);

        eulerReorder(euler1, RotationOrder.ZXY, euler1);

        deepEqual(euler.order !== euler1.order, true);

        const quaternion = quatFromEuler(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = quatFromEuler(euler1.x, euler1.y, euler1.z, euler1.order);

        deepEqual(quatEquals(quaternion, quaternion1), true);
    });

    it('equals', () =>
    {
        const euler = eulerRandom();
        const euler1 = eulerCopy(euler);

        deepEqual(eulerEquals(euler, euler1), true);
    });

    it('fromArray', () =>
    {
        const array = [Math.random(), Math.random(), Math.random(), Math.random()];
        const euler = eulerFromArray(array);

        deepEqual(array[0], euler.x);
        deepEqual(array[1], euler.y);
        deepEqual(array[2], euler.z);
        deepEqual(array[3], euler.order);
    });

    it('toArray', () =>
    {
        const euler = eulerRandom();
        const array: number[] = [];

        eulerToArray(euler, array);

        deepEqual(array[0], euler.x);
        deepEqual(array[1], euler.y);
        deepEqual(array[2], euler.z);
        deepEqual(array[3], euler.order);
    });

    it('toVector3', () =>
    {
        const euler = eulerRandom();
        const vector3 = { x: 0, y: 0, z: 0 };

        eulerToVector3(euler, vector3);

        deepEqual(vector3.x, euler.x);
        deepEqual(vector3.y, euler.y);
        deepEqual(vector3.z, euler.z);
    });
});
