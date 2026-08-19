import { describe, it, expect } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './PlaneGeometry';
import type { PlaneGeometry } from './PlaneGeometry';
import type { GeometryLogic } from '../geometry/Geometry';
import { runReactiveTests } from '../test/reactiveGeometryTest';

function makeLogic(): [GeometryLogic, Record<string, unknown>]
{
    const geo = {
        __type__: 'PlaneGeometry',
        width: 10, height: 10, segmentsW: 1, segmentsH: 1,
    } as PlaneGeometry;
    const g = logic(geo) as GeometryLogic;

    return [g, reactive(geo) as unknown as Record<string, unknown>];
}

runReactiveTests('PlaneGeometry', makeLogic, 'width', 20, 'segmentsW', ['width', 'height', 'segmentsW', 'segmentsH', 'yUp']);


/** 测试辅助：经 beforeRender 读取渲染数据（接口已不暴露 vertices/indices/draw getter） */
function readRenderData(lg: { beforeRender(ro: never): void }): { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> }
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> };
}


describe('PlaneGeometry 基础验证', () =>
{
    it('默认 1×1 分段平面有 4 顶点 2 三角形', () =>
    {
        const geo = { __type__: 'PlaneGeometry', width: 10, height: 10, segmentsW: 1, segmentsH: 1 } as PlaneGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(readRenderData(g).vertices['a_position'].data.length).toBe(4 * 3);
        expect((g as unknown as { vertexIndices: number[] }).vertexIndices.length).toBe(6);
    });
});
