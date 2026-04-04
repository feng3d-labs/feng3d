import { mathUtil } from '../../polyfill/MathUtil';
import { RotationOrder } from '../enums/RotationOrder';
import { Euler } from './Euler';
import { Matrix4x4 } from './Matrix4x4';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

import { assert, describe, it } from 'vitest';

describe('Euler', () =>
{
    it('constructor', () =>
    {
        const euler = new Euler();

        assert.deepEqual(euler.x, 0);
        assert.deepEqual(euler.y, 0);
        assert.deepEqual(euler.z, 0);

        assert.deepEqual(euler.order, mathUtil.DefaultRotationOrder);
    });

    it('random', () =>
    {
        const euler = new Euler().random();

        assert.deepEqual(euler.x !== 0, true);
        assert.deepEqual(euler.y !== 0, true);
        assert.deepEqual(euler.z !== 0, true);

        assert.deepEqual(0 <= euler.order && euler.order <= 5, true);
    });

    it('set', () =>
    {
        const euler = new Euler();

        const eulerV = new Euler().random();

        euler.set(eulerV.x, eulerV.y, eulerV.z, eulerV.order);

        assert.deepEqual(euler, eulerV);

        const oldOrder = euler.order;
        euler.set(Math.random(), Math.random(), Math.random());
        assert.deepEqual(oldOrder, euler.order);
    });

    it('clone', () =>
    {
        const euler = new Euler().random();
        const clone = euler.clone();
        assert.deepEqual(euler, clone);
    });

    it('fromRotationMatrix', () =>
    {
        const matrix = new Matrix4x4().fromRotation(360 * Math.random(), 360 * Math.random(), 360 * Math.random());

        const euler = new Euler().random();
        euler.fromRotationMatrix(matrix, euler.order);

        const angles = matrix.getRotation(undefined, euler.order);

        assert.deepEqual(angles.equals(euler), true);
    });

    it('fromQuaternion', () =>
    {
        const quaternion = new Quaternion().random();

        const euler = new Euler().random();
        euler.fromQuaternion(quaternion, euler.order);

        const newQuaternion = new Quaternion();
        newQuaternion.fromEuler(euler.x, euler.y, euler.z, euler.order);

        assert.deepEqual(quaternion.equals(newQuaternion), true);
    });

    it('fromVector3', () =>
    {
        const vector3 = new Vector3().random();

        const euler = new Euler().random();

        const oldOrder = euler.order;

        euler.fromVector3(vector3);

        assert.deepEqual(euler.x, vector3.x);
        assert.deepEqual(euler.y, vector3.y);
        assert.deepEqual(euler.z, vector3.z);
        assert.deepEqual(oldOrder, euler.order);
    });

    it('reorder', () =>
    {
        const euler = new Euler().random();

        euler.reorder(RotationOrder.XYZ);

        const euler1 = euler.clone();
        euler1.reorder(RotationOrder.ZXY);

        assert.deepEqual(euler.order !== euler1.order, true);

        const quaternion = new Quaternion().fromEuler(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = new Quaternion().fromEuler(euler1.x, euler1.y, euler1.z, euler1.order);

        assert.deepEqual(quaternion.equals(quaternion1), true);
    });

    it('equals', () =>
    {
        const euler = new Euler().random();
        const euler1 = euler.clone();

        assert.deepEqual(euler.equals(euler1), true);
    });

    it('fromArray', () =>
    {
        const array = [Math.random(), Math.random(), Math.random(), Math.random()];
        const euler = new Euler().fromArray(array);

        assert.deepEqual(array[0], euler.x);
        assert.deepEqual(array[1], euler.y);
        assert.deepEqual(array[2], euler.z);
        assert.deepEqual(array[3], euler.order);
    });

    it('fromArray', () =>
    {
        const euler = new Euler().random();
        const array: number[] = [];
        euler.toArray(array);

        assert.deepEqual(array[0], euler.x);
        assert.deepEqual(array[1], euler.y);
        assert.deepEqual(array[2], euler.z);
        assert.deepEqual(array[3], euler.order);
    });

    // it('toVector3', () =>
    // {
    //     const euler = new Euler().random();
    //     const vector3 = new Vector3();
    //     euler.toVector3(vector3);

    //     assert.deepEqual(vector3.x, euler.x);
    //     assert.deepEqual(vector3.y, euler.y);
    //     assert.deepEqual(vector3.z, euler.z);
    // });
});
