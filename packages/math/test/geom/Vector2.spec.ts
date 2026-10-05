import { assert, describe, it } from 'vitest';
import { vec2Cross, vec2Dot, vec2Random } from '../../src/geom/vector2';

const { equal } = assert;

/**
 * ★ 阶段 C-f：原文件测的是 `Vector2` 的实例方法 `dot` / `cross` / `random`
 * （文件标题当时就误写成 `Vector3`，一并改正）。class 删除后改为同义的纯函数用例。
 */
describe('Vector2', () =>
{
    it('creation', () =>
    {
        const v = { x: 1, y: 2 };

        equal(v.x, 1);
        equal(v.y, 2);
    });

    it('dot', () =>
    {
        {
            const v1 = vec2Random();
            const v2 = vec2Random();

            const result = vec2Dot(v1, v2);

            equal(result, v1.x * v2.x + v1.y * v2.y);
        }

        {
            const v1 = { x: 1, y: 0 };
            const v2 = { x: 1, y: 0 };

            equal(vec2Dot(v1, v2), 1);
        }

        {
            const v1 = { x: 1, y: 0 };
            const v2 = { x: 0, y: 1 };

            equal(vec2Dot(v1, v2), 0);
        }
    });

    it('cross', () =>
    {
        {
            const v1 = vec2Random();
            const v2 = vec2Random();

            const result = vec2Cross(v1, v2);

            equal(result, v1.x * v2.y - v1.y * v2.x);
        }

        {
            const v1 = { x: 1, y: 0 };
            const v2 = { x: 1, y: 0 };

            equal(vec2Cross(v1, v2), 0);
        }

        {
            const v1 = { x: 1, y: 0 };
            const v2 = { x: 0, y: 1 };

            equal(vec2Cross(v1, v2), 1);
        }
    });
});
