import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import { WGPUVertexBufferLayout } from '@feng3d/webgpu';

import { standardSkinnedVertexWGSL, standardVertexWGSL } from '../../materials/standardVertexShader';
// 触发 registerLogic('CustomGeometry') 注册（否则 logic() 返回 null）
import '../../geometry/CustomGeometry';
import type { CustomGeometry } from '../../geometry/CustomGeometry';
import type { GeometryLogic } from '../../geometry/Geometry';
import type { VertexAttributes } from '@feng3d/webgpu';

/**
 * issue #337 第二批：两组骨骼（每顶点最多 8 根）的顶点缓冲布局离线验收。
 *
 * WebGPU 默认 `maxVertexBuffers = 8`，顶点缓冲按"属性数据对象"（同一个 TypedArray 引用）分组。
 * 这里用渲染路径同一份 {@link WGPUVertexBufferLayout} 实测：4 个蒙皮属性交错后只占 1 个缓冲，
 * 蒙皮管线共 6 个缓冲（标准材质 5 + 蒙皮 1）≤ 8——含 `JOINTS_1`/`WEIGHTS_1` 的几何不会再因
 * 缓冲数超限而 `CreateRenderPipeline` 失败。
 */

/** 造一个带蒙皮顶点数据的 CustomGeometry，返回真实顶点属性表 */
function buildVertices(withSecondGroup: boolean): VertexAttributes
{
    const geo = { __type__: 'CustomGeometry' } as CustomGeometry;
    const g = logic(geo) as GeometryLogic;

    reactive(geo).positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
    reactive(geo).a_skinIndices = [0, 1, 2, 3, 1, 2, 3, 0, 2, 3, 0, 1];
    reactive(geo).a_skinWeights = [1, 0, 0, 0, 0.5, 0.5, 0, 0, 0.25, 0.25, 0.5, 0];

    if (withSecondGroup)
    {
        // 每顶点最多 8 根骨骼：第二组补齐后两组权重和仍为 1
        reactive(geo).a_skinIndices1 = [4, 5, 6, 7, 5, 6, 7, 4, 6, 7, 4, 5];
        reactive(geo).a_skinWeights1 = [0, 0, 0, 0, 0.5, 0, 0, 0, 0.25, 0, 0.25, 0];
    }

    return g.vertices;
}

/** 把各顶点缓冲的 attributes 摊平成一条带缓冲下标的列表 */
function collectAttributes(buffers: readonly GPUVertexBufferLayout[]): { bufferIndex: number; shaderLocation: number; offset: number }[]
{
    const attributes: { bufferIndex: number; shaderLocation: number; offset: number }[] = [];
    buffers.forEach((buffer, bufferIndex) =>
    {
        for (const attribute of buffer.attributes)
        {
            attributes.push({ bufferIndex, shaderLocation: attribute.shaderLocation, offset: attribute.offset });
        }
    });

    return attributes;
}

describe('蒙皮顶点缓冲布局（issue #337 第二批，每顶点最多 8 根骨骼）', () =>
{
    it('两组骨骼（4 个蒙皮属性）交错后只占 1 个缓冲，蒙皮管线共 6 个缓冲 ≤ maxVertexBuffers 8', () =>
    {
        const vertices = buildVertices(true);
        const layout = WGPUVertexBufferLayout.getInstance({ wgsl: standardSkinnedVertexWGSL }, vertices);
        const buffers = layout.vertexBufferLayouts;

        // 不交错时是 9 个缓冲（5 + 4），会直接超过 WebGPU 默认上限 8
        expect(buffers).toHaveLength(6);
        expect(buffers.length).toBeLessThanOrEqual(8);

        const attributes = collectAttributes(buffers);

        // location 0–8 覆盖标准材质 5 个 + 蒙皮 4 个
        expect(attributes.map((a) => a.shaderLocation).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);

        const skinAttributes = attributes.filter((a) => a.shaderLocation >= 5);
        expect(skinAttributes.map((a) => a.shaderLocation).sort((a, b) => a - b)).toEqual([5, 6, 7, 8]);
        // 4 个蒙皮属性落在同一个顶点缓冲
        expect(new Set(skinAttributes.map((a) => a.bufferIndex)).size).toBe(1);

        const skinBufferIndex = skinAttributes[0].bufferIndex;
        expect(buffers[skinBufferIndex].arrayStride).toBe(64);
        expect(skinAttributes.map((a) => a.offset).sort((a, b) => a - b)).toEqual([0, 16, 32, 48]);
    });

    it('只用第一组骨骼（无第二组数据）时布局不变，第二组段为零（既有场景结果不变）', () =>
    {
        const vertices = buildVertices(false);
        const layout = WGPUVertexBufferLayout.getInstance({ wgsl: standardSkinnedVertexWGSL }, vertices);

        expect(layout.vertexBufferLayouts).toHaveLength(6);

        const interleaved = vertices.a_skinIndices!.data;
        // 第一组数据原样在交错缓冲头部
        expect(Array.from(interleaved).slice(0, 8)).toEqual([0, 1, 2, 3, 1, 0, 0, 0]);
        // 第二组缺失 → indices1 / weights1 两段全 0（权重 0 对 skinPosition 的加权无贡献）
        expect(Array.from(interleaved).filter((_, i) => i % 16 >= 8).every((v) => v === 0)).toBe(true);
    });

    it('非蒙皮标准材质布局不受影响（仍 5 个缓冲，无蒙皮属性）', () =>
    {
        const vertices = buildVertices(false);
        const layout = WGPUVertexBufferLayout.getInstance({ wgsl: standardVertexWGSL }, vertices);
        const buffers = layout.vertexBufferLayouts;

        expect(buffers).toHaveLength(5);
        expect(collectAttributes(buffers).map((a) => a.shaderLocation).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    });
});
