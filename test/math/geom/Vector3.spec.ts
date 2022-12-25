import { Vector3 } from '../../../src/math/geom/Vector3';

import { assert, describe, expect, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('Vector3', () =>
{
    it('creation', () =>
    {
        const v = new Vector3(1, 2, 3);
        equal(v.x, 1, 'Creating a vec3 should set the first parameter to the x value');
        equal(v.y, 2, 'Creating a vec3 should set the second parameter to the y value');
        equal(v.z, 3, 'Creating a vec3 should set the third parameter to the z value');
    });

    it('cross', () =>
    {
        let v = new Vector3(1, 2, 3);
        const u = new Vector3(4, 5, 6);
        v = v.crossTo(u);

        equal(v.x, -3, 'Calculating cross product x');
        equal(v.y, 6, 'Calculating cross product x');
        equal(v.z, -3, 'Calculating cross product x');
    });

    it('dot', () =>
    {
        let v = new Vector3(1, 2, 3);
        let u = new Vector3(4, 5, 6);
        let dot = v.dot(u);

        equal(dot, 4 + 10 + 18, 'Calculating dot product x');

        v = new Vector3(3, 2, 1);
        u = new Vector3(4, 5, 6);
        dot = v.dot(u);

        equal(dot, 12 + 10 + 6, 'Calculating dot product x');
    });

    it('set', () =>
    {
        const v = new Vector3(1, 2, 3);
        v.set(4, 5, 6);

        equal(v.x, 4, 'Setting values from x, y, z');
        equal(v.y, 5, 'Setting values from x, y, z');
        equal(v.z, 6, 'Setting values from x, y, z');
    });

    it('addTo', () =>
    {
        let v = new Vector3(1, 2, 3);
        const u = new Vector3(4, 5, 6);
        v = v.addTo(u);

        equal(v.x, 5, 'Adding a vector (x)');
        equal(v.y, 7, 'Adding a vector (y)');
        equal(v.z, 9, 'Adding a vector (z)');
    });

    it('almostEquals', () =>
    {
        ok(new Vector3(1, 0, 0).equals(new Vector3(1, 0, 0)));
    });

    it('isParallel', () =>
    {
        const v = new Vector3().random();
        const v1 = v.scaleNumberTo(Math.random() * 2 - 1);
        ok(v.isParallel(v1));
    });
});
