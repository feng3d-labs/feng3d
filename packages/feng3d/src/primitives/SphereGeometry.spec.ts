/// <reference types="vitest" />
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

runReactiveTests('SphereGeometry', makeLogic, 'radius', 10, 'segmentsW');

describe('SphereGeometry 基础验证', () =>
{
    it('segmentsW=8 segmentsH=6 有 (8+1)×(6+1)=63 顶点', () =>
    {
        const geo = { __type__: 'SphereGeometry', radius: 5, segmentsW: 8, segmentsH: 6 } as SphereGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(g.vertices['a_position'].data.length).toBe(63 * 3);
    });
});
