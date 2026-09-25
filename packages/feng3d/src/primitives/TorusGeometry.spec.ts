import { describe, it, expect } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './TorusGeometry';
import type { TorusGeometry } from './TorusGeometry';
import type { GeometryLogic } from '../geometry/Geometry';
import { runReactiveTests } from '../test/reactiveGeometryTest';

function makeLogic(): [GeometryLogic, Record<string, unknown>]
{
    const geo = {
        __type__: 'TorusGeometry',
        radius: 3, tubeRadius: 1, segmentsR: 8, segmentsT: 6,
    } as TorusGeometry;
    const g = logic(geo) as GeometryLogic;

    return [g, reactive(geo) as unknown as Record<string, unknown>];
}

runReactiveTests('TorusGeometry', makeLogic, 'radius', 6, 'segmentsR', ['radius', 'tubeRadius', 'segmentsR', 'segmentsT', 'yUp']);


/** 测试辅助：经 beforeRender 读取渲染数据（接口已不暴露 vertices/indices/draw getter） */
function readRenderData(lg: { beforeRender(ro: never): void }): { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> }
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> };
}


describe('TorusGeometry 基础验证', () =>
{
    it('segmentsR=8 segmentsT=6 有 (8+1)×(6+1)=63 顶点', () =>
    {
        const geo = {
            __type__: 'TorusGeometry', radius: 3, tubeRadius: 1, segmentsR: 8, segmentsT: 6,
        } as TorusGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(readRenderData(g).vertices['a_position'].data.length).toBe(63 * 3);
    });
});
