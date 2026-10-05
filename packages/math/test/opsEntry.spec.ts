import { describe, expect, it } from 'vitest';
import {
    mat4TransformPoint3,
    vec2Add,
    vec3Add,
    vec3DivideNumber,
    vec3NormalizeThickness,
    vec4Add,
} from '@feng3d/math';
import type { Color4Like, Vector2Like, Vector3Like, Vector4Like, WritableVector3Like } from '@feng3d/math';

/**
 * 包入口契约（issue #134 阶段 B 的前置）。
 *
 * 阶段 A 只把纯函数写进 `src/{color,geom,gradient}/*.ts`，`index.ts` 并未导出它们——B 阶段的外部消费方
 * 因此**拿不到**纯函数（`import { vec3Add } from '@feng3d/math'` 报 TS2305，
 * 运行期则是 `xxx is not a function`）。B1 补上 17 个纯函数模块的 `export *` 后，
 * 这里守住「入口可达」这条契约：值函数能导入并算对、形状类型能导入并直接吃字面量。
 */
describe('@feng3d/math 包入口的纯函数层', () =>
{
    it('Vector2/3/4 的纯函数可从包入口导入并工作', () =>
    {
        expect(vec2Add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
        expect(vec3Add({ x: 1, y: 2, z: 3 }, { x: 1, y: 1, z: 1 })).toEqual({ x: 2, y: 3, z: 4 });
        expect(vec4Add({ x: 1, y: 1, z: 1, w: 1 }, { x: 1, y: 1, z: 1, w: 1 })).toEqual({ x: 2, y: 2, z: 2, w: 2 });
    });

    it('除标量与归一化按 out 契约写回', () =>
    {
        expect(vec3DivideNumber({ x: 500, y: 600, z: 500 }, 500)).toEqual({ x: 1, y: 1.2, z: 1 });

        const out: WritableVector3Like = { x: 0, y: 0, z: 0 };
        expect(vec3NormalizeThickness({ x: 0, y: 3, z: 4 }, 1, out)).toBe(out);
        expect(out.x).toBe(0);
        expect(out.y).toBeCloseTo(0.6, 10);
        expect(out.z).toBeCloseTo(0.8, 10);
    });

    it('跨类型的纯函数（矩阵 × 向量）同样可从入口导入', () =>
    {
        const identity = { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };

        expect(mat4TransformPoint3(identity, { x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('形状类型可从入口导入，并接受纯数据字面量', () =>
    {
        const v2: Vector2Like = { x: 1, y: 2 };
        const v3: Vector3Like = { x: 1, y: 2, z: 3 };
        const v4: Vector4Like = { x: 1, y: 2, z: 3, w: 4 };
        const c4: Color4Like = { r: 1, g: 0.5, b: 0, a: 1 };

        expect([v2.x, v3.z, v4.w, c4.g]).toEqual([1, 3, 4, 0.5]);
    });
});
