import { describe, it, expect } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './SphereGeometry';
import type { SphereGeometry } from './SphereGeometry';
import type { GeometryLogic } from '../geometry/Geometry';
import { runReactiveTests } from '../test/reactiveGeometryTest';

function makeLogic(): [GeometryLogic, Record<string, unknown>]
{
    const geo = {
        __type__: 'SphereGeometry',
        radius: 5, segmentsW: 8, segmentsH: 6,
    } as SphereGeometry;
    const g = logic(geo) as GeometryLogic;

    return [g, reactive(geo) as unknown as Record<string, unknown>];
}

runReactiveTests('SphereGeometry', makeLogic, 'radius', 10, 'segmentsW', ['radius', 'segmentsW', 'segmentsH', 'yUp']);


/** 测试辅助：经 beforeRender 读取渲染数据（接口已不暴露 vertices/indices/draw getter） */
function readRenderData(lg: { beforeRender(ro: never): void }): { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> }
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> };
}


describe('SphereGeometry 基础验证', () =>
{
    it('segmentsW=8 segmentsH=6 有 (8+1)×(6+1)=63 顶点', () =>
    {
        const geo = { __type__: 'SphereGeometry', radius: 5, segmentsW: 8, segmentsH: 6 } as SphereGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(readRenderData(g).vertices['a_position'].data.length).toBe(63 * 3);
    });

    /**
     * 顶点色与法线有效性。
     *
     * 起因：场景文件迁移后默认场景里的 Sphere 渲染为黑色球体。`StandardMaterial` /
     * `ColorMaterial` 都会把顶点色乘进最终颜色（顶点色为 0 即渲染成黑），法线退化则光照为黑。
     * 本用例把「几何体数据问题」与「材质问题」分开。
     */
    it('顶点色全白、法线为单位向量且与位置同向', () =>
    {
        const geo = { __type__: 'SphereGeometry', radius: 5, segmentsW: 8, segmentsH: 6 } as SphereGeometry;
        const g = logic(geo) as GeometryLogic;
        const data = readRenderData(g);

        const positions = data.vertices['a_position'].data;
        const normals = data.vertices['a_normal'].data;
        const colors = data.vertices['a_color'].data;
        const vertexCount = positions.length / 3;

        expect(normals.length).toBe(positions.length);
        expect(colors.length).toBe(vertexCount * 4);

        for (let i = 0; i < colors.length; i++)
        {
            expect(colors[i]).toBe(1);
        }

        for (let i = 0; i < vertexCount; i++)
        {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const nx = normals[i * 3];
            const ny = normals[i * 3 + 1];
            const nz = normals[i * 3 + 2];

            // 法线必须是单位向量：接缝重复点曾写作 `n0 + n * 0.5`（长度 1.5），
            // 会让接缝一列光照偏亮、与相邻列出现可见色差。
            const normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz);
            expect(normalLength).toBeCloseTo(1, 3);

            const positionLength = Math.sqrt(x * x + y * y + z * z);
            if (positionLength > 1e-6)
            {
                expect((x * nx + y * ny + z * nz) / positionLength).toBeGreaterThan(0.5);
            }
        }
    });
});
