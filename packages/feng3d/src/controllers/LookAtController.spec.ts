import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { vec3Length } from '@feng3d/math';
import { LookAtController } from './LookAtController';

/**
 * LookAtController 的字段放宽验证（#134 B4）。
 *
 * 两个方向都要锁：入参收普通 `{ x, y, z }` 字面量；getter 仍返回 **`Vector3` 实例**
 * ——字段类型若跟着放宽，getter 的返回类型就会退化成 `Vector3Like`，
 * 消费方的 `.length` / `.cross()` 这类类成员访问会编译不过（P8c）。
 * `.length` 既是运行期断言（纯字面量没有 length），也是类型断言（tsc 会拦住退化）。
 */
describe('LookAtController 字段放宽', () =>
{
    it('upAxis 收字面量，getter 仍给出 Vector3 实例', () =>
    {
        const controller = new LookAtController();

        controller.upAxis = { x: 0, y: 0, z: 1 };

        expect(controller.upAxis.__type__).toBe('Vector3');
        expect(vec3Length(controller.upAxis)).toBeCloseTo(1, 10);
        expect(controller.upAxis.z).toBe(1);
    });

    it('lookAtPosition 收字面量，默认值为 { 0, 0, 0 }', () =>
    {
        const controller = new LookAtController();

        expect(controller.lookAtPosition.__type__).toBe('Vector3');
        expect(vec3Length(controller.lookAtPosition)).toBeCloseTo(0, 10);

        controller.lookAtPosition = { x: 3, y: 4, z: 0 };

        expect(controller.lookAtPosition.__type__).toBe('Vector3');
        expect(vec3Length(controller.lookAtPosition)).toBeCloseTo(5, 10);
    });

    it('传入的字面量在 setter 内被复制，之后再改那个对象不影响控制器', () =>
    {
        const controller = new LookAtController();
        const source = { x: 1, y: 2, z: 3 };

        controller.lookAtPosition = source;
        source.z = 99;

        expect(controller.lookAtPosition.z).toBe(3);
    });
});
