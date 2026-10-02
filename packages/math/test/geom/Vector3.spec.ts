import { assert, describe, it } from 'vitest';
import { vec3Add, vec3Cross, vec3Dot, vec3Equals, vec3From, vec3IsParallel, vec3Random, vec3ScaleNumber } from '../../src/geom/vector3Ops';

const { equal } = assert;

/**
 * ★ 阶段 C-f：本文件原先是 `Vector3` 的 class 规格（`new` + 实例方法）。
 * class 删除后改写为**同义纯函数用例**，断言逐条保留（只换写法）。
 */
describe('Vector3', () =>
{
    it('creation', () =>
    {
        const v = vec3From(1, 2, 3);

        equal(v.x, 1, 'Creating a vec3 should set the first parameter to the x value');
        equal(v.y, 2, 'Creating a vec3 should set the second parameter to the y value');
        equal(v.z, 3, 'Creating a vec3 should set the third parameter to the z value');
    });

    it('cross', () =>
    {
        const v = vec3Cross({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });

        equal(v.x, -3, 'Calculating cross product x');
        equal(v.y, 6, 'Calculating cross product x');
        equal(v.z, -3, 'Calculating cross product x');
    });

    it('dot', () =>
    {
        const v = { x: 1, y: 2, z: 3 };
        const u = { x: 4, y: 5, z: 6 };
        let dot = vec3Dot(v, u);

        equal(dot, 4 + 10 + 18, 'Calculating dot product x');

        const v2 = { x: 3, y: 2, z: 1 };

        dot = vec3Dot(v2, u);

        equal(dot, 12 + 10 + 6, 'Calculating dot product x');
    });

    it('set', () =>
    {
        const v = { x: 1, y: 2, z: 3 };

        vec3From(4, 5, 6, v);

        equal(v.x, 4, 'Setting values from x, y, z');
        equal(v.y, 5, 'Setting values from x, y, z');
        equal(v.z, 6, 'Setting values from x, y, z');
    });

    it('addTo', () =>
    {
        const v = vec3Add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });

        equal(v.x, 5, 'Adding a vector (x)');
        equal(v.y, 7, 'Adding a vector (y)');
        equal(v.z, 9, 'Adding a vector (z)');
    });

    it('almostEquals', () =>
    {
        assert.ok(vec3Equals({ x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }));
    });

    it('isParallel', () =>
    {
        const v = vec3Random();
        const v1 = vec3ScaleNumber(v, Math.random() * 2 - 1);

        assert.ok(vec3IsParallel(v, v1));
    });
});
