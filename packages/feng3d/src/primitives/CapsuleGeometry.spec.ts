/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './CapsuleGeometry';
import type { CapsuleGeometry } from './CapsuleGeometry';
import type { GeometryLogic } from '../geometry/Geometry';
import { runReactiveTests } from '../test/reactiveGeometryTest';

function makeLogic(): [GeometryLogic, Record<string, unknown>]
{
    const geo = {
        __type__: 'CapsuleGeometry',
        radius: 1, height: 4, segmentsW: 8, segmentsH: 4,
    } as CapsuleGeometry;
    const g = logic(geo) as GeometryLogic;

    return [g, reactive(geo) as unknown as Record<string, unknown>];
}

runReactiveTests('CapsuleGeometry', makeLogic, 'radius', 2, 'segmentsW', ['radius', 'height', 'segmentsW', 'segmentsH', 'yUp']);


/** 测试辅助：经 beforeRender 读取渲染数据（接口已不暴露 vertices/indices/draw getter） */
function readRenderData(lg: { beforeRender(ro: never): void }): { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> }
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> };
}


describe('CapsuleGeometry 基础验证', () =>
{
    it('有顶点', () =>
    {
        const geo = {
            __type__: 'CapsuleGeometry', radius: 1, height: 4, segmentsW: 8, segmentsH: 4,
        } as CapsuleGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(readRenderData(g).vertices['a_position'].data.length).toBeGreaterThan(0);
    });
});
