/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import './QuadGeometry';
import type { QuadGeometry } from './QuadGeometry';
import type { GeometryLogic } from '../geometry/Geometry';

describe('QuadGeometry 基础验证', () =>
{
    it('固定 4 顶点 2 三角形', () =>
    {
        const geo = { __type__: 'QuadGeometry' } as QuadGeometry;
        const g = logic(geo) as GeometryLogic;

        expect(g.vertices['a_position'].data.length).toBe(4 * 3);
        expect((g as unknown as { vertexIndices: number[] }).vertexIndices.length).toBe(6);
    });
});

// QuadGeometry 无构造参数（固定 4 顶点），无响应式参数变化，故无精细化响应式测试。
