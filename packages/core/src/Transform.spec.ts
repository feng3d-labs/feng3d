import { describe, expect, it } from 'vitest';
import { Transform } from './Transform';
import { effect, reactive } from '@feng3d/reactivity';

describe('Transform', () =>
{
    describe('默认值', () =>
    {
        it('position 默认应为 (0, 0, 0)', () =>
        {
            const transform = new Transform();
            expect(transform.position).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('rotation 默认应为 (0, 0, 0)', () =>
        {
            const transform = new Transform();
            expect(transform.rotation).toEqual({ x: 0, y: 0, z: 0 });
        });
    });

    describe('position 响应式', () =>
    {
        it('position.x 变化应触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_position = reactive(transform.position);

            let callCount = 0;
            let lastX = 0;

            effect(() =>
            {
                callCount++;
                lastX = r_position.x;
            });

            // 初始调用
            expect(callCount).toBe(1);
            expect(lastX).toBe(0);

            // 修改 x
            r_position.x = 5;

            // 应触发 effect
            expect(callCount).toBe(2);
            expect(lastX).toBe(5);
        });

        it('position.y 变化应触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_position = reactive(transform.position);

            let callCount = 0;
            let lastY = 0;

            effect(() =>
            {
                callCount++;
                lastY = r_position.y;
            });

            expect(callCount).toBe(1);

            r_position.y = 10;

            expect(callCount).toBe(2);
            expect(lastY).toBe(10);
        });

        it('position.z 变化应触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_position = reactive(transform.position);

            let callCount = 0;
            let lastZ = 0;

            effect(() =>
            {
                callCount++;
                lastZ = r_position.z;
            });

            expect(callCount).toBe(1);

            r_position.z = 15;

            expect(callCount).toBe(2);
            expect(lastZ).toBe(15);
        });

        it('position 多个属性变化应多次触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_position = reactive(transform.position);

            const positions: { x: number, y: number, z: number }[] = [];

            effect(() =>
            {
                positions.push({ x: r_position.x, y: r_position.y, z: r_position.z });
            });

            // 初始
            expect(positions).toHaveLength(1);
            expect(positions[0]).toEqual({ x: 0, y: 0, z: 0 });

            // 修改 x
            r_position.x = 1;
            expect(positions).toHaveLength(2);
            expect(positions[1]).toEqual({ x: 1, y: 0, z: 0 });

            // 修改 y
            r_position.y = 2;
            expect(positions).toHaveLength(3);
            expect(positions[2]).toEqual({ x: 1, y: 2, z: 0 });

            // 修改 z
            r_position.z = 3;
            expect(positions).toHaveLength(4);
            expect(positions[3]).toEqual({ x: 1, y: 2, z: 3 });
        });
    });

    describe('rotation 响应式', () =>
    {
        it('rotation.x 变化应触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_rotation = reactive(transform.rotation);

            let callCount = 0;
            let lastX = 0;

            effect(() =>
            {
                callCount++;
                lastX = r_rotation.x;
            });

            expect(callCount).toBe(1);

            r_rotation.x = Math.PI / 4;

            expect(callCount).toBe(2);
            expect(lastX).toBe(Math.PI / 4);
        });

        it('rotation.y 变化应触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_rotation = reactive(transform.rotation);

            let callCount = 0;
            let lastY = 0;

            effect(() =>
            {
                callCount++;
                lastY = r_rotation.y;
            });

            expect(callCount).toBe(1);

            r_rotation.y = Math.PI / 2;

            expect(callCount).toBe(2);
            expect(lastY).toBe(Math.PI / 2);
        });

        it('rotation.z 变化应触发响应式更新', () =>
        {
            const transform = new Transform();
            const r_rotation = reactive(transform.rotation);

            let callCount = 0;
            let lastZ = 0;

            effect(() =>
            {
                callCount++;
                lastZ = r_rotation.z;
            });

            expect(callCount).toBe(1);

            r_rotation.z = Math.PI;

            expect(callCount).toBe(2);
            expect(lastZ).toBe(Math.PI);
        });
    });
});
