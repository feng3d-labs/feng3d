import { Box3 } from '../../../src/math/geom/Box3';
import { Triangle3 } from '../../../src/math/geom/Triangle3';
import { Vector3 } from '../../../src/math/geom/Vector3';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('Box3', () =>
{
    it('construct', () =>
    {
        new Box3();

        ok(true);
    });

    it('copy', () =>
    {
        const a = new Box3();
        const b = new Box3();
        a.max.set(1, 2, 3);
        b.copy(a);
        deepEqual(a, b);
    });

    it('clone', () =>
    {
        const a = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
        const b = a.clone();

        deepEqual(a, b);

        equal(a === b, false);
    });

    it('extend', () =>
    {
        let a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        let b = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
        a.union(b);
        deepEqual(a, b);

        a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        b = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
        b.union(a);
        deepEqual(b.min, new Vector3(-2, -2, -2));
        deepEqual(b.max, new Vector3(2, 2, 2));

        a = new Box3(new Vector3(-2, -1, -1), new Vector3(2, 1, 1));
        b = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        b.union(a);
        deepEqual(a.min, new Vector3(-2, -1, -1));
        deepEqual(a.max, new Vector3(2, 1, 1));
    });

    it('extend', () =>
    {
        const a = new Box3();
        const b = new Box3();

        // Same aabb
        a.min.set(-1, -1, 0);
        a.max.set(1, 1, 0);
        b.min.set(-1, -1, 0);
        b.max.set(1, 1, 0);
        ok(a.overlaps(b), 'should detect overlap');

        // Corner overlaps
        b.min.set(1, 1, 0);
        b.max.set(2, 2, 0);
        ok(a.overlaps(b), 'should detect corner overlap');

        // Separate
        b.min.set(1.1, 1.1, 0);
        ok(!a.overlaps(b), 'should detect separated');

        // fully inside
        b.min.set(-0.5, -0.5, 0);
        b.max.set(0.5, 0.5, 0);
        ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');
        b.min.set(-1.5, -1.5, 0);
        b.max.set(1.5, 1.5, 0);
        ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');

        // Translated
        b.min.set(-3, -0.5, 0);
        b.max.set(-2, 0.5, 0);
        ok(!a.overlaps(b), 'should detect translated');
    });

    it('contains', () =>
    {
        const a = new Box3();
        const b = new Box3();

        a.min.set(-1, -1, -1);
        a.max.set(1, 1, 1);
        b.min.set(-1, -1, -1);
        b.max.set(1, 1, 1);

        ok(a.contains(b));

        a.min.set(-2, -2, -2);
        a.max.set(2, 2, 2);

        ok(a.contains(b));

        b.min.set(-3, -3, -3);
        b.max.set(3, 3, 3);

        equal(a.contains(b), false);

        a.min.set(0, 0, 0);
        a.max.set(2, 2, 2);
        b.min.set(-1, -1, -1);
        b.max.set(1, 1, 1);

        equal(a.contains(b), false);
    });

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
