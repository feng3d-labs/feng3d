import { Box3 } from '../../../src/math/geom/Box3';
import { Triangle3 } from '../../../src/math/geom/Triangle3';
import { Vector3 } from '../../../src/math/geom/Vector3';

import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual } = assert;

describe('Box3', () =>
{
    it('intersectsTriangle', () =>
    {
        const aabb = new Box3().random();
        const triangle = new Triangle3().fromPoints(aabb.randomPoint(), aabb.randomPoint(), aabb.randomPoint());
        ok(
            aabb.intersectsTriangle(triangle)
        );

        const triangle1 = new Triangle3().fromPoints(aabb.randomPoint(), aabb.randomPoint().addNumber(5), aabb.randomPoint().addNumber(6));
        ok(
            aabb.intersectsTriangle(triangle1)
        );

        //
        const aabb2 = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        const triangle2 = new Triangle3(new Vector3(1.5, 0, 0), new Vector3(0, 1.5, 0), new Vector3(1.5, 1.5, 0));
        ok(
            aabb2.intersectsTriangle(triangle2)
        );
    });
});
