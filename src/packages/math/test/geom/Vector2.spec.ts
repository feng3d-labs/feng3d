import { equal } from 'assert';
import { Vector2 } from '../../src';

describe('Vector3', () =>
{
    it('creation', () =>
    {
        const v = new Vector2(1, 2);
        equal(v.x, 1);
        equal(v.y, 2);
    });

    it('dot', () =>
    {
        {
            const v1 = new Vector2().random();
            const v2 = new Vector2().random();

            const result = v1.dot(v2);

            equal(result, v1.x * v2.x + v1.y * v2.y);
        }

        {
            const v1 = new Vector2(1, 0);
            const v2 = new Vector2(1, 0);

            equal(v1.dot(v2), 1);
        }

        {
            const v1 = new Vector2(1, 0);
            const v2 = new Vector2(0, 1);

            equal(v1.dot(v2), 0);
        }
    });

    it('cross', () =>
    {
        {
            const v1 = new Vector2().random();
            const v2 = new Vector2().random();

            const result = v1.cross(v2);

            equal(result, v1.x * v2.y - v1.y * v2.x);
        }

        {
            const v1 = new Vector2(1, 0);
            const v2 = new Vector2(1, 0);

            equal(v1.cross(v2), 0);
        }

        {
            const v1 = new Vector2(1, 0);
            const v2 = new Vector2(0, 1);

            equal(v1.cross(v2), 1);
        }
    });
});
