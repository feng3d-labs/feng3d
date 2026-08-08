/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './CylinderGeometry';
import type { CylinderGeometry } from './CylinderGeometry';
import type { GeometryLogic } from '../geometry/Geometry';
import { runReactiveTests } from '../test/reactiveGeometryTest';

function makeLogic(): [GeometryLogic, Record<string, unknown>]
{
    const geo = {
        __type__: 'CylinderGeometry',
        topRadius: 2, bottomRadius: 2, height: 5, segmentsW: 8, segmentsH: 1,
    } as CylinderGeometry;
    const g = logic(geo) as GeometryLogic;

    return [g, reactive(geo) as unknown as Record<string, unknown>];
}

runReactiveTests('CylinderGeometry', makeLogic, 'height', 10, 'segmentsW', ['topRadius', 'bottomRadius', 'height', 'segmentsW', 'segmentsH', 'yUp']);

describe('CylinderGeometry 基础验证', () =>
{
    it('segmentsW=8 有顶点', () =>
    {
        const geo = {
            __type__: 'CylinderGeometry',
            topRadius: 2, bottomRadius: 2, height: 5, segmentsW: 8, segmentsH: 1,
        } as CylinderGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(g.vertices['a_position'].data.length).toBeGreaterThan(0);
    });
});
