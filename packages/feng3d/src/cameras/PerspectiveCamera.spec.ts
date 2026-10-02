import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import '../core/Object3D';
import type { Object3D } from '../core/Object3D';
import './PerspectiveCamera';
import type { PerspectiveCamera, PerspectiveCameraLogic } from './PerspectiveCamera';

/**
 * PerspectiveCameraLogic 的投影链路单测。
 *
 * 为什么值得单测：投影矩阵 / 视锥 / project / unproject 是渲染与拾取的共同底座，
 * 但这条链路原先完全靠 e2e 视觉回归兜底——e2e 只能看出「画面变了」，
 * 分不清是 fov 算错、深度反投影错还是相机变换错。
 *
 * 全部断言基于实测值（先跑探针确认行为，再写死公式），不依赖 GPU 设备。
 */
describe('PerspectiveCameraLogic', () =>
{
    /** 造一个挂着透视相机的对象；返回相机 logic */
    function mount(camera: Record<string, unknown>): PerspectiveCameraLogic
    {
        const cam = { __type__: 'PerspectiveCamera', ...camera } as unknown as PerspectiveCamera;
        const object: Object3D = { __type__: 'Object3D', name: 'cam', components: [cam] };

        logic(object);

        return logic(cam) as PerspectiveCameraLogic;
    }

    it('投影矩阵由 fov / aspect / near / far 派生', () =>
    {
        const l = mount({ fov: 60, aspect: 1.5, near: 0.1, far: 100 });
        const m = l.projectionMatrix.elements;

        const tan = Math.tan((60 * Math.PI / 180) / 2);

        expect(m[0]).toBeCloseTo(1 / (1.5 * tan), 10);   // 1 / (aspect · tan(fov/2))
        expect(m[5]).toBeCloseTo(1 / tan, 10);           // 1 / tan(fov/2)
        expect(m[11]).toBe(-1);                          // 透视投影的 w = -z
        expect(m[15]).toBe(0);
        // WebGPU 约定（z→[0,1]，相机看 -Z）：m[10] = -far/(far-near)、m[14] = -far·near/(far-near)
        expect(m[10]).toBeCloseTo(-100 / (100 - 0.1), 10);
        expect(m[14]).toBeCloseTo(-100 * 0.1 / (100 - 0.1), 10);
    });

    it('缺省字段按默认值处理（fov 60 / aspect 1 / near 0.3 / far 1000）', () =>
    {
        const defaults = mount({}).projectionMatrix.elements;
        const explicit = mount({ fov: 60, aspect: 1, near: 0.3, far: 1000 }).projectionMatrix.elements;

        expect(defaults).toEqual(explicit);
    });

    it('修改 fov / aspect 后投影矩阵重算（响应式）', () =>
    {
        const cam = { __type__: 'PerspectiveCamera', fov: 60, aspect: 1.5, near: 0.1, far: 100 } as unknown as PerspectiveCamera;
        const object: Object3D = { __type__: 'Object3D', name: 'cam', components: [cam] };

        logic(object);

        const l = logic(cam) as PerspectiveCameraLogic;
        const before = l.projectionMatrix.elements[5];

        reactive(cam as { fov: number }).fov = 90;

        const after = l.projectionMatrix.elements[5];

        expect(before).toBeCloseTo(1 / Math.tan((60 * Math.PI / 180) / 2), 10);
        expect(after).toBeCloseTo(1 / Math.tan((90 * Math.PI / 180) / 2), 10);
        expect(after).not.toBeCloseTo(before, 3);
    });

    it('相机在原点时 viewProjection 等于 projectionMatrix', () =>
    {
        const l = mount({ fov: 60, aspect: 1.5, near: 0.1, far: 100 });

        // 逐元素比较：world2local 是单位矩阵，矩阵乘法只引入浮点误差
        l.viewProjection.elements.forEach((v, i) =>
        {
            expect(v).toBeCloseTo(l.projectionMatrix.elements[i], 10);
        });
    });

    it('视锥由 6 个平面组成', () =>
    {
        expect(mount({}).frustum.planes).toHaveLength(6);
    });

    it('project 把相机前方的点投到 NDC，unproject 用同一深度值可还原', () =>
    {
        const l = mount({ fov: 60, aspect: 1.5, near: 0.1, far: 100 });

        // 传纯数据字面量：project 的入参已放宽为 Vector3Like
        const p = { x: 1, y: 2, z: -5 };
        const ndc = l.project(p);

        // NDC 三轴都在 [-1, 1]（相机前方、视锥内的点）
        expect(Math.abs(ndc.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(ndc.y)).toBeLessThanOrEqual(1);
        expect(ndc.z).toBeGreaterThanOrEqual(0);

        // unproject 的第三个参数是「相机空间的 z」，不是 NDC 深度——
        // 用原始点的 z 才构成往返（这条语义容易误用，故用例名写明）
        const back = l.unproject(ndc.x, ndc.y, p.z);

        expect(back.x).toBeCloseTo(p.x, 6);
        expect(back.y).toBeCloseTo(p.y, 6);
        expect(back.z).toBeCloseTo(p.z, 6);
    });

    it('unproject 的输出目标可传普通 { x, y, z } 对象（原样返回同一对象）', () =>
    {
        const l = mount({ fov: 60, aspect: 1.5, near: 0.1, far: 100 });
        const out = { x: 0, y: 0, z: 0 };

        const back = l.unproject(0, 0, -5, out);

        // 传字面量当 out：返回的就是那一个字面量对象本身（新放宽的重载）
        expect(back).toBe(out);
        expect(out.x).toBeCloseTo(0, 6);
        expect(out.y).toBeCloseTo(0, 6);
        expect(out.z).toBeCloseTo(-5, 6);
    });

    it('getScaleByDepth 的方向参数可传普通 { x, y } 对象', () =>
    {
        const l = mount({ fov: 60, aspect: 1.5, near: 0.1, far: 100 });

        expect(l.getScaleByDepth(1, { x: 0, y: 1 })).toBeCloseTo(l.getScaleByDepth(1), 10);
    });

    it('getRay3D 在原点相机上给出朝 -z 的射线', () =>
    {
        const ray = mount({}).getRay3D(0, 0);

        expect(ray.origin.x).toBeCloseTo(0, 10);
        expect(ray.origin.y).toBeCloseTo(0, 10);
        expect(ray.origin.z).toBeCloseTo(0, 10);
        expect(ray.direction.x).toBeCloseTo(0, 10);
        expect(ray.direction.y).toBeCloseTo(0, 10);
        expect(ray.direction.z).toBeCloseTo(-1, 10);
    });

    it('uniforms 提供投影矩阵与相机矩阵等 7 项', () =>
    {
        const l = mount({ fov: 60, aspect: 1.5, near: 0.1, far: 100 });
        const u = l.uniforms;

        expect(Object.keys(u).sort()).toEqual([
            'u_cameraMatrix',
            'u_cameraPos',
            'u_projectionMatrix',
            'u_scaleByDepth',
            'u_skyBoxSize',
            'u_viewMatrix',
            'u_viewProjection',
        ]);
        expect(u.u_projectionMatrix?.elements).toEqual(l.projectionMatrix.elements);
        expect(u.u_cameraPos?.x).toBeCloseTo(0, 10);
    });
});
