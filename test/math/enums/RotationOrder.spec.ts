import { deepEqual } from 'assert';
import { RotationOrder } from '../../../src/math/enums/RotationOrder';
import { mathUtil } from '../../../src/polyfill/MathUtil';

describe('RotationOrder', () =>
{
    it('初始值', () =>
    {
        deepEqual(RotationOrder.XYZ, 0);
        deepEqual(RotationOrder.ZXY, 1);
        deepEqual(RotationOrder.ZYX, 2);
        deepEqual(RotationOrder.YXZ, 3);
        deepEqual(RotationOrder.YZX, 4);
        deepEqual(RotationOrder.XZY, 5);

        //
        deepEqual(mathUtil.DefaultRotationOrder, RotationOrder.YXZ);
    });
});
