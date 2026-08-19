import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import './Geometry';
import './CustomGeometry';
import type { GeometryLogic } from './Geometry';
import type { CustomGeometry } from './CustomGeometry';

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
});
