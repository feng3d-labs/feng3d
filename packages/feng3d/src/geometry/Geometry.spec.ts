/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { logic, reactive, registerLogic } from '@feng3d/reactivity';
import './Geometry';
import './VertexDataGeometry';
import { geometryLogic } from './Geometry';
import type { GeometryLogic } from './Geometry';
import type { VertexDataGeometry } from './VertexDataGeometry';

/**
 * 顶点数据响应式数据接口写入 + buildGeometry 覆盖回归测试。
 *
 * 重构后 GeometryLogic 顶点字段全部只读，外部通过 `reactive(geometry).positions = ...`
 * 写入数据接口字段，VertexDataGeometry 用 computed 桥接。本测试验证：
 * 1. 响应式数据接口写入后 getter 能读到
 * 2. 子工厂覆盖 buildGeometry 后 updateGeometry 会调用覆盖实现（TerrainGeometry 模式）
 */
describe('Geometry 顶点数据响应式写入', () =>
{
    it('通过 reactive 数据接口写入 positions/indices 后 attributes（computed）反映最新值', () =>
    {
        const geo = { __type__: 'VertexDataGeometry' } as VertexDataGeometry;
        const g = logic(geo) as GeometryLogic;

        // 初始：positions 为空，buildVertices 跳过空数据属性，故 a_position 不在 attributes
        expect(g.attributes.a_position?.data?.length ?? 0).toBe(0);

        // 通过响应式数据接口写入顶点数据
        reactive(geo).positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
        reactive(geo).indices = [0, 1, 2];

        // computed 桥接后 attributes（顶点数据变化触发 computed 失效）应反映写入的数据
        expect(g.attributes.a_position.data.length).toBe(9);
        // indices 不在 attributes（独立 computed 覆盖在实例上），需断言访问
        expect((g as unknown as { indices: number[] }).indices.length).toBe(3);
    });

    it('子工厂覆盖 buildGeometry 后，updateGeometry 触发该覆盖实现', () =>
    {
        // 直接用 geometryLogic 基座构造，覆盖 buildGeometry（模拟 TerrainGeometry 模式）。
        // 注意：基座 geometryLogic 本身不桥接数据接口字段（桥接由 VertexDataGeometry/TerrainGeometry
        // 子工厂的 computed 负责），本测试只验证 updateGeometry 会调用覆盖后的 buildGeometry。
        const geo = { __type__: 'VertexDataGeometry' } as VertexDataGeometry;
        const g = geometryLogic(geo);

        let buildCallCount = 0;
        // 覆盖 buildGeometry（TerrainGeometry 用 Object.defineProperty 覆盖）
        Object.defineProperty(g, 'buildGeometry', {
            value()
            {
                buildCallCount++;
            },
            writable: true,
            enumerable: true,
            configurable: true,
        });

        // 触发 invalidateGeometry + updateGeometry
        g.invalidateGeometry();
        g.updateGeometry();

        // 覆盖的 buildGeometry 应被调用一次
        expect(buildCallCount).toBe(1);

        // 再次 updateGeometry（未失效）不应重复调用
        g.updateGeometry();
        expect(buildCallCount).toBe(1);

        // 失效后再调应再次触发
        g.invalidateGeometry();
        g.updateGeometry();
        expect(buildCallCount).toBe(2);
    });
});
