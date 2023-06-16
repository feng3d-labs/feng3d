import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../../../src/math/enums/RotationOrder';
import { Euler } from '../../../src/math/geom/Euler';
import { Matrix4x4 } from '../../../src/math/geom/Matrix4x4';
import { Quaternion } from '../../../src/math/geom/Quaternion';
import { Vector3 } from '../../../src/math/geom/Vector3';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('Euler', () =>
{
    it('constructor', () =>
    {
        const euler = new Euler();

        deepEqual(euler.x, 0);
        deepEqual(euler.y, 0);
        deepEqual(euler.z, 0);

        deepEqual(euler.order, mathUtil.DefaultRotationOrder);
    });

    it('random', () =>
    {
        const euler = new Euler().random();

        deepEqual(euler.x !== 0, true);
        deepEqual(euler.y !== 0, true);
        deepEqual(euler.z !== 0, true);

        deepEqual(0 <= euler.order && euler.order <= 5, true);
    });

    it('set', () =>
    {
        const euler = new Euler();

        const eulerV = new Euler().random();

        euler.set(eulerV.x, eulerV.y, eulerV.z, eulerV.order);

        deepEqual(euler, eulerV);

        const oldOrder = euler.order;
        euler.set(Math.random(), Math.random(), Math.random());
        deepEqual(oldOrder, euler.order);
    });

    it('clone', () =>
    {
        const euler = new Euler().random();
        const clone = euler.clone();
        deepEqual(euler, clone);
    });

    it('fromRotationMatrix', () =>
    {
        const matrix = new Matrix4x4().fromRotation(360 * Math.random(), 360 * Math.random(), 360 * Math.random());

        const euler = new Euler().random();
        euler.fromRotationMatrix(matrix, euler.order);

        const angles = matrix.getRotation(undefined, euler.order);

        deepEqual(angles.equals(euler), true);
    });

    it('fromQuaternion', () =>
    {
        const quaternion = new Quaternion().random();

        const euler = new Euler().random();
        euler.fromQuaternion(quaternion, euler.order);

        const newQuaternion = new Quaternion();
        newQuaternion.fromEuler(euler.x, euler.y, euler.z, euler.order);

        deepEqual(quaternion.equals(newQuaternion), true);
    });

    it('fromVector3', () =>
    {
        const vector3 = new Vector3().random();

        const euler = new Euler().random();

        const oldOrder = euler.order;

        euler.fromVector3(vector3);

        deepEqual(euler.x, vector3.x);
        deepEqual(euler.y, vector3.y);
        deepEqual(euler.z, vector3.z);
        deepEqual(oldOrder, euler.order);
    });

    it('reorder', () =>
    {
        const euler = new Euler().random();

        euler.reorder(RotationOrder.XYZ);

        const euler1 = euler.clone();
        euler1.reorder(RotationOrder.ZXY);

        deepEqual(euler.order !== euler1.order, true);

        const quaternion = new Quaternion().fromEuler(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = new Quaternion().fromEuler(euler1.x, euler1.y, euler1.z, euler1.order);

        deepEqual(quaternion.equals(quaternion1), true);
    });

    it('equals', () =>
    {
        const euler = new Euler().random();
        const euler1 = euler.clone();

        deepEqual(euler.equals(euler1), true);
    });

    it('fromArray', () =>
    {
        const array = [Math.random(), Math.random(), Math.random(), Math.random()];
        const euler = new Euler().fromArray(array);

        deepEqual(array[0], euler.x);
        deepEqual(array[1], euler.y);
        deepEqual(array[2], euler.z);
        deepEqual(array[3], euler.order);
    });

    it('fromArray', () =>
    {
        const euler = new Euler().random();
        const array: number[] = [];
        euler.toArray(array);

        deepEqual(array[0], euler.x);
        deepEqual(array[1], euler.y);
        deepEqual(array[2], euler.z);
        deepEqual(array[3], euler.order);
    });

    // it('toVector3', () =>
    // {
    //     const euler = new Euler().random();
    //     const vector3 = new Vector3();
    //     euler.toVector3(vector3);

    //     deepEqual(vector3.x, euler.x);
    //     deepEqual(vector3.y, euler.y);
    //     deepEqual(vector3.z, euler.z);
    // });
});
