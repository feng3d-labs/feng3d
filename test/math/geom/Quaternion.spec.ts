import { Euler } from '../../../src/math/geom/Euler';
import { Matrix4x4 } from '../../../src/math/geom/Matrix4x4';
import { Quaternion } from '../../../src/math/geom/Quaternion';
import { Vector3 } from '../../../src/math/geom/Vector3';

import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual } = assert;

describe('Quaternion', () =>
{
    it('四元素正值与负值等价', () =>
    {
        const quaternion0 = new Quaternion().random();
        const quaternion1 = quaternion0.clone();
        quaternion1.x *= -1;
        quaternion1.y *= -1;
        quaternion1.z *= -1;
        quaternion1.w *= -1;

        const matrix0 = new Matrix4x4();
        matrix0.fromQuaternion(quaternion0);
        const matrix1 = new Matrix4x4();
        matrix1.fromQuaternion(quaternion1);

        deepEqual(matrix0, matrix1);
    });

    it('rotatePoint', () =>
    {
        const quat = new Quaternion().random();

        const v = new Vector3().random();

        const v1 = quat.rotatePoint(v);
        const v2 = quat.toMatrix().transformPoint3(v);

        ok(
            v1.equals(v2)
        );
    });

    it('inverse', () =>
    {
        const quat = new Quaternion().random();

        const v = new Vector3().random();

        const invQ = quat.inverseTo();

        const v1 = quat.rotatePoint(v);
        const v2 = invQ.rotatePoint(v1);

        ok(
            v.equals(v2)
        );
    });

    it('creation', () =>
    {
        const q = new Quaternion(1, 2, 3, 4);
        equal(q.x, 1, 'Creating should set the first parameter to the x value');
        equal(q.y, 2, 'Creating should set the second parameter to the y value');
        equal(q.z, 3, 'Creating should set the third parameter to the z value');
        equal(q.w, 4, 'Creating should set the third parameter to the z value');
    });

    it('fromMatrix', () =>
    {
        const euler = new Euler().random();
        const quaternion = new Quaternion();
        quaternion.fromEuler(euler.x, euler.y, euler.z, euler.order);

        //
        const matrix = new Matrix4x4();
        matrix.fromRotation(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = new Quaternion();
        quaternion1.fromMatrix(matrix);

        deepEqual(quaternion.equals(quaternion1), true);
    });

    it('fromEuler', () =>
    {
        const euler = new Euler().random();
        const quaternion = new Quaternion();
        quaternion.fromEuler(euler.x, euler.y, euler.z, euler.order);

        //
        const matrix = new Matrix4x4();
        matrix.fromRotation(euler.x, euler.y, euler.z, euler.order);
        const quaternion1 = new Quaternion();
        quaternion1.fromMatrix(matrix);

        deepEqual(quaternion.equals(quaternion1), true);
    });

    it('setFromVectors', () =>
    {
        const q = new Quaternion();

        {
            const vec30 = new Vector3().random().normalize();
            const vec31 = new Vector3().random().normalize();
            q.fromUnitVectors(vec30, vec31);

            const result = q.vmult(vec30);
            ok(result.equals(vec31));
        }

        {
            //
            const vec30 = new Vector3().random().normalize();
            const vec31 = new Vector3().random().normalize();
            vec30.negateTo(vec31);
            //
            q.fromUnitVectors(vec30, vec31);
            const result = q.vmult(vec30);
            //
            ok(result.equals(vec31));
        }
    });

    it('slerp', () =>
    {
        const qa = new Quaternion();
        const qb = new Quaternion();
        qa.slerpTo(qb, 0.5, qb);
        deepEqual(qa, qb);

        qa.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4);
        qb.fromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 4);
        qa.slerpTo(qb, 0.5, qb);
        deepEqual(qb, new Quaternion());
    });
});
