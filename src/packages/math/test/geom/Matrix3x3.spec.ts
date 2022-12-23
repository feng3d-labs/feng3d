import { deepEqual, equal, ok } from 'assert';
import { Matrix3x3, Quaternion, Vector3 } from '../../src';

describe('Matrix3x3', () =>
{
    it('identity', () =>
    {
        const m = new Matrix3x3();

        m.identity();

        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                equal(m.getElement(r, c), (r === c) ? 1 : 0, `cellule ( row : ${r} column : ${c} )  should be ${c === r ? '1' : '0'}`);
            }
        }
    });

    it('vmult', () =>
    {
        const v = new Vector3(2, 3, 7);
        const m = new Matrix3x3();

        /*
          set the matrix to
          | 1 2 3 |
          | 4 5 6 |
          | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            { m.setElement(r, c, 1 + r * 3 + c); }
        }
        const t = m.vmult(v);

        ok(t.x === 29 && t.y === 65 && t.z === 101, `Expected (29,65,101), got (${t.toString()}), while multiplying m=${m.toString()} with ${v.toString()}`);
    });

    it('mmult', () =>
    {
        const m1 = new Matrix3x3();
        const m2 = new Matrix3x3();

        /* set the matrix to
            | 1 2 3 |
            | 4 5 6 |
            | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            { m1.setElement(r, c, 1 + r * 3 + c); }
        }

        /* set the matrix to
         | 5 2 4 |
         | 4 5 1 |
         | 1 8 0 |
        */
        m2.setElement(0, 0, 5);
        m2.setElement(0, 1, 2);
        m2.setElement(0, 2, 4);
        m2.setElement(1, 0, 4);
        m2.setElement(1, 1, 5);
        m2.setElement(1, 2, 1);
        m2.setElement(2, 0, 1);
        m2.setElement(2, 1, 8);
        m2.setElement(2, 2, 0);

        const m3 = m1.mmult(m2);

        ok(m3.getElement(0, 0) === 16
            && m3.getElement(0, 1) === 36
            && m3.getElement(0, 2) === 6
            && m3.getElement(1, 0) === 46
            && m3.getElement(1, 1) === 81
            && m3.getElement(1, 2) === 21
            && m3.getElement(2, 0) === 76
            && m3.getElement(2, 1) === 126
            && m3.getElement(2, 2) === 36, 'calculating multiplication with another matrix');
    });

    it('solve', () =>
    {
        const m = new Matrix3x3();
        const v = new Vector3(2, 3, 7);

        /* set the matrix to
        | 5 2 4 |
        | 4 5 1 |
        | 1 8 0 |
        */
        m.setElement(0, 0, 5);
        m.setElement(0, 1, 2);
        m.setElement(0, 2, 4);
        m.setElement(1, 0, 4);
        m.setElement(1, 1, 5);
        m.setElement(1, 2, 1);
        m.setElement(2, 0, 1);
        m.setElement(2, 1, 8);
        m.setElement(2, 2, 0);

        const t = m.solve(v);

        const vv = m.vmult(t);

        ok(vv.equals(v, 0.00001), 'solving Ax = b');

        const m1 = new Matrix3x3();

        /* set the matrix to
         | 1 2 3 |
         | 4 5 6 |
         | 7 8 9 |
         */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                m1.setElement(r, c, 1 + r * 3 + c);
            }
        }

        let error = false;

        try
        {
            m1.solve(v);
        }
        catch (e)
        {
            error = true;
        }

        ok(error, 'should rise an error if the system has no solutions');
    });

    it('reverse', () =>
    {
        const m = new Matrix3x3();

        /* set the matrix to
        | 5 2 4 |
        | 4 5 1 |
        | 1 8 0 |
        */
        m.setElement(0, 0, 5);
        m.setElement(0, 1, 2);
        m.setElement(0, 2, 4);
        m.setElement(1, 0, 4);
        m.setElement(1, 1, 5);
        m.setElement(1, 2, 1);
        m.setElement(2, 0, 1);
        m.setElement(2, 1, 8);
        m.setElement(2, 2, 0);

        const m2 = m.reverseTo();

        const m3 = m2.mmult(m);

        let success = true;
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                success = success && (Math.abs(m3.getElement(r, c) - (c === r ? 1 : 0)) < 0.00001);
            }
        }

        ok(success, 'inversing');

        const m1 = new Matrix3x3();

        /* set the matrix to
        | 1 2 3 |
        | 4 5 6 |
        | 7 8 9 |
        */
        for (let c = 0; c < 3; c++)
        {
            for (let r = 0; r < 3; r++)
            {
                m1.setElement(r, c, 1 + r * 3 + c);
            }
        }

        let error = false;

        try
        {
            m1.reverseTo();
        }
        catch (e)
        {
            error = true;
        }

        ok(error, 'should rise an error if the matrix is not inersible');
    });

    it('transpose', () =>
    {
        const M = new Matrix3x3([1, 2, 3,
            4, 5, 6,
            7, 8, 9]);
        const Mt = M.transposeTo();
        deepEqual(Mt.elements, [1, 4, 7,
            2, 5, 8,
            3, 6, 9]);
    });

    it('scale', () =>
    {
        const M = new Matrix3x3([1, 1, 1,
            1, 1, 1,
            1, 1, 1]);
        const Mt = M.scale(new Vector3(1, 2, 3));
        deepEqual(Mt.elements, [1, 2, 3,
            1, 2, 3,
            1, 2, 3]);
    });

    it('setRotationFromQuaternion', () =>
    {
        const M = new Matrix3x3();
        const q = new Quaternion();
        const original = new Vector3(1, 2, 3);

        // Test zero rotation
        M.setRotationFromQuaternion(q);
        const v = M.vmult(original);
        ok(v.equals(original));

        // Test rotation along x axis
        q.fromEuler(0.222, 0.123, 1.234);
        M.setRotationFromQuaternion(q);
        const Mv = M.vmult(original);
        const qv = q.rotatePoint(original);

        ok(Mv.equals(qv));
    });
});
