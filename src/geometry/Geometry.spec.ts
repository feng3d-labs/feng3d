/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { logic, registerLogic } from '@feng3d/reactivity';
import './Geometry';
import type { Geometry, GeometryLogic } from './Geometry';

/**
 * Geometry.updateGeometry / buildGeometry override 回归测试。
 *
 * 背景：TerrainGeometry 通过 Object.assign(base, { buildGeometry() {...} })
 * 覆盖基类的 buildGeometry。一次工厂重构（78e39bfa）后 updateGeometry 错误地
 * 调用了闭包内 buildGeometry()（基类空实现），导致子类覆盖被绕过，
 * TerrainGeometry 顶点数据从未生成，渲染时 position 属性缺失。
 *
 * 本测试模拟该覆盖模式，断言 updateGeometry 会调用覆盖后的 buildGeometry。
 */
describe('Geometry.updateGeometry 调用覆盖后的 buildGeometry', () =>
{
    it('子类 Object.assign 覆盖 buildGeometry 后，updateGeometry 触发该覆盖实现', () =>
    {
        // 构造一个最小 Geometry，用 Object.assign 覆盖 buildGeometry
        interface TestGeometry extends Geometry
        {
            __type__: 'TestGeometry';
        }

        let buildCallCount = 0;
        function testGeometryLogic(geo: TestGeometry): GeometryLogic
        {
            const base = logic({ __type__: 'Geometry' } as Geometry) as GeometryLogic;

            // 基类 attributes 初始为空，需 setAttributes 注入 a_position 等
            base.setAttributes({
                a_position: { data: new Float32Array(), format: 'float32x3' },
                a_color: { data: new Float32Array(), format: 'float32x4' },
                a_uv: { data: new Float32Array(), format: 'float32x2' },
                a_normal: { data: new Float32Array(), format: 'float32x3' },
                a_tangent: { data: new Float32Array(), format: 'float32x3' },
            });

            // 模拟 TerrainGeometry 的覆盖模式
            return Object.assign(base, {
                buildGeometry(): void
                {
                    buildCallCount++;
                    // 写入 position 数据（模拟 TerrainGeometry 生成顶点）
                    base.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
                    base.indices = [0, 1, 2];
                },
            }) as GeometryLogic;
        }
        registerLogic('TestGeometry', testGeometryLogic);

        const geo = { __type__: 'TestGeometry' } as TestGeometry;
        const g = logic(geo) as GeometryLogic;

        // 初始：positions 为空
        expect(g.positions.length).toBe(0);

        // 触发 invalidateGeometry + updateGeometry（通过读 indices 或直接调用）
        // getIndices 内部调用 updateGeometry
        g.invalidateGeometry();
        const indices = g.indices;

        // 覆盖的 buildGeometry 应被调用一次
        expect(buildCallCount).toBe(1);
        // positions 应被填充
        expect(g.positions.length).toBe(9);
        expect(indices.length).toBe(3);
    });
});
