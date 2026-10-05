import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './Geometry';
import { interleaveSkinAttributes, type CustomGeometry } from './CustomGeometry';
import type { GeometryLogic } from './Geometry';

/**
 * CustomGeometry 顶点数据响应式测试。
 *
 * 重构后 GeometryLogic 顶点数据统一通过 attributes（子工厂重写 getter，computed 驱动）提供。
 * 外部通过 `reactive(geometry).positions = ...` 写入数据接口字段，
 * CustomGeometry 的 computed 桥接自动失效，attributes 反映最新值。
 */

/** 测试辅助：经 beforeRender 读取渲染数据（接口已不暴露 vertices/indices/draw getter） */
function readRenderData(lg: { beforeRender(ro: never): void }): { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> }
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> };
}


describe('CustomGeometry 顶点数据响应式', () =>
{
    it('通过 reactive 数据接口写入 positions/indices 后 attributes（computed）反映最新值', () =>
    {
        const geo = { __type__: 'CustomGeometry' } as CustomGeometry;
        const g = logic(geo) as GeometryLogic;

        // 初始：positions 为空（CustomGeometry 的 a_position computed 读 reactive(geometry).positions，初始 undefined → 空 Float32Array）
        expect(readRenderData(g).vertices.a_position.data.length).toBe(0);

        // 通过响应式数据接口写入顶点数据
        reactive(geo).positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
        reactive(geo).indices = [0, 1, 2];

        // computed 桥接后 attributes 应反映写入的数据
        expect(readRenderData(g).vertices.a_position.data.length).toBe(9);
        // indices 由子工厂 computed 覆盖（独立于 attributes）
        expect((g as unknown as { indices: number[] }).indices.length).toBe(3);
    });

    it('蒙皮顶点属性（a_skinIndices / a_skinWeights 等）进入顶点表并交错进同一缓冲（issue #337）', () =>
    {
        const geo = { __type__: 'CustomGeometry' } as CustomGeometry;
        const g = logic(geo) as GeometryLogic;

        reactive(geo).positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
        reactive(geo).a_skinIndices = [0, 1, 2, 3, 1, 2, 3, 0];
        reactive(geo).a_skinWeights = [1, 0, 0, 0, 0.5, 0.5, 0, 0];
        reactive(geo).a_skinIndices1 = [4, 4, 4, 4, 5, 5, 5, 5];
        reactive(geo).a_skinWeights1 = [0, 0, 0, 0, 0.25, 0.25, 0, 0];

        const vertices = readRenderData(g).vertices as Record<string, {
            data: ArrayLike<number>; format: string; offset?: number; arrayStride?: number;
        }>;

        expect(vertices.a_skinIndices.format).toBe('float32x4');
        // 4 个属性共享同一个交错 data（顶点缓冲按 data 引用分组，共享才能归并为 1 个缓冲）
        expect(vertices.a_skinWeights.data).toBe(vertices.a_skinIndices.data);
        expect(vertices.a_skinIndices1.data).toBe(vertices.a_skinIndices.data);
        expect(vertices.a_skinWeights1.data).toBe(vertices.a_skinIndices.data);

        // 交错布局：offset 0/16/32/48 字节，stride 64 字节（每顶点 4 个 vec4<f32>）
        expect(vertices.a_skinIndices.offset).toBe(0);
        expect(vertices.a_skinWeights.offset).toBe(16);
        expect(vertices.a_skinIndices1.offset).toBe(32);
        expect(vertices.a_skinWeights1.offset).toBe(48);
        expect(vertices.a_skinIndices.arrayStride).toBe(64);

        const data = Array.from(vertices.a_skinIndices.data);

        // 顶点 0：[indices0 | weights0 | indices1 | weights1]
        expect(data.slice(0, 16)).toEqual([0, 1, 2, 3, 1, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0]);
        // 顶点 1
        expect(data.slice(16, 32)).toEqual([1, 2, 3, 0, 0.5, 0.5, 0, 0, 5, 5, 5, 5, 0.25, 0.25, 0, 0]);
        // positions 有 3 个顶点、蒙皮只写了 2 个 → 第三顶点补零（权重 0 不影响位置）
        expect(data.slice(32)).toEqual(new Array(16).fill(0));
    });

    it('interleaveSkinAttributes：缺失组按位置顶点数补零，某组缺失不影响其它组（issue #337）', () =>
    {
        // 第一组 2 顶点、第二组缺失、位置 3 顶点 → 交错出 3 个顶点，第二组段全 0
        const out = interleaveSkinAttributes(
            new Float32Array([0, 1, 2, 3, 3, 2, 1, 0]),
            new Float32Array([1, 0, 0, 0, 0.5, 0.5, 0, 0]),
            new Float32Array(), new Float32Array(), 3);

        expect(out.length).toBe(3 * 16);
        expect(Array.from(out.slice(0, 16))).toEqual([0, 1, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(Array.from(out.slice(16, 32))).toEqual([3, 2, 1, 0, 0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(Array.from(out.slice(32))).toEqual(new Array(16).fill(0));
    });
});
