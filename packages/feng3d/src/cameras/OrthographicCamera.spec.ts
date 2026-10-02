import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import '../core/Object3D';
import type { Object3D } from '../core/Object3D';
import './OrthographicCamera';
import type { OrthographicCamera, OrthographicCameraLogic } from './OrthographicCamera';

/**
 * OrthographicCameraLogic 的投影链路单测（阴影、UI、2D 渲染都走它）。
 *
 * 与透视相机共用 CameraLogic 的 viewProjection / frustum / uniforms，
 * 差异只在投影矩阵（无透视除法）与 project/unproject。
 */
describe('OrthographicCameraLogic', () =>
{
    function mount(camera: Record<string, unknown>): OrthographicCameraLogic
    {
        const cam = { __type__: 'OrthographicCamera', ...camera } as unknown as OrthographicCamera;
        const object: Object3D = { __type__: 'Object3D', name: 'cam', components: [cam] };

        logic(object);

        return logic(cam) as OrthographicCameraLogic;
    }

    it('投影矩阵由 left / right / top / bottom / near / far 派生', () =>
    {
        const m = mount({ left: -2, right: 2, top: 1, bottom: -1, near: 0.1, far: 100 }).projectionMatrix.elements;

        expect(m[0]).toBeCloseTo(2 / (2 - (-2)), 10);    // 2 / (right - left)
        expect(m[5]).toBeCloseTo(2 / (1 - (-1)), 10);    // 2 / (top - bottom)
        expect(m[11]).toBe(0);                           // 正交投影没有 w = -z
        expect(m[15]).toBe(1);
        // WebGPU 约定（z→[0,1]）：m[10] = -1/(far-near)、m[14] = -near/(far-near)
        expect(m[10]).toBeCloseTo(-1 / (100 - 0.1), 10);
        expect(m[14]).toBeCloseTo(-0.1 / (100 - 0.1), 10);
    });

    it('缺省字段按默认值处理（left/right/top/bottom = ±1、near 0.3、far 1000）', () =>
    {
        const defaults = mount({}).projectionMatrix.elements;
        const explicit = mount({ left: -1, right: 1, top: 1, bottom: -1, near: 0.3, far: 1000 }).projectionMatrix.elements;

        expect(defaults).toEqual(explicit);
    });

    it('修改边界后投影矩阵重算（响应式）', () =>
    {
        const cam = { __type__: 'OrthographicCamera', left: -2, right: 2, top: 1, bottom: -1 } as unknown as OrthographicCamera;
        const object: Object3D = { __type__: 'Object3D', name: 'cam', components: [cam] };

        logic(object);

        const l = logic(cam) as OrthographicCameraLogic;

        expect(l.projectionMatrix.elements[0]).toBeCloseTo(0.5, 10);

        reactive(cam as { left: number }).left = -4;

        expect(l.projectionMatrix.elements[0]).toBeCloseTo(2 / (2 - (-4)), 10);
    });

    it('project / unproject 在正交投影下互为逆变换（x、y、z 都对得上）', () =>
    {
        const l = mount({ left: -2, right: 2, top: 1, bottom: -1, near: 0.1, far: 100 });

        // 传纯数据字面量：project 的入参已放宽为 Vector3Like
        const p = { x: 1, y: 0.5, z: -5 };
        const ndc = l.project(p);

        // 正交：NDC 的 x/y 就是「点相对边界」的线性映射
        expect(ndc.x).toBeCloseTo(1 / 2, 10);
        expect(ndc.y).toBeCloseTo(0.5 / 1, 10);

        const back = l.unproject(ndc.x, ndc.y, p.z);

        expect(back.x).toBeCloseTo(p.x, 6);
        expect(back.y).toBeCloseTo(p.y, 6);
        expect(back.z).toBeCloseTo(p.z, 6);
    });

    it('unproject 的输出目标可传普通 { x, y, z } 对象（原样返回同一对象）', () =>
    {
        const l = mount({ left: -2, right: 2, top: 1, bottom: -1, near: 0.1, far: 100 });
        const out = { x: 0, y: 0, z: 0 };

        const back = l.unproject(0.5, 0.25, -5, out);

        // 传字面量当 out：返回的就是那一个字面量对象本身（新放宽的重载）
        expect(back).toBe(out);
        expect(out.x).toBeCloseTo(1, 6);      // NDC 0.5 → 世界 x = 0.5 · right(2)
        expect(out.z).toBeCloseTo(-5, 6);
    });

    it('相机在原点时 viewProjection 等于 projectionMatrix，视锥 6 个平面', () =>
    {
        const l = mount({});

        // 逐元素比较：world2local 是单位矩阵，矩阵乘法只引入浮点误差
        l.viewProjection.elements.forEach((v, i) =>
        {
            expect(v).toBeCloseTo(l.projectionMatrix.elements[i], 10);
        });
        expect(l.frustum.planes).toHaveLength(6);
    });
});
