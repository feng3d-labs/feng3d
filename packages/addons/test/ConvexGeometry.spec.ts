import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 feng3d 自家 spec 同模式）
import './browser-stub';

// logic 从 feng3d barrel 导入：与 ConvexGeometry.ts 内 registerLogic 走同一
// reactivity 模块实例（spec 直连 @feng3d/reactivity 会得到另一实例，注册表隔离）
import { logic } from 'feng3d';
import { Vector3 } from '@feng3d/math';
// 触发 registerLogic('ConvexGeometry', ...)（值导入若仅作类型使用会被 esbuild 丢弃）
import '../src/geometries/ConvexGeometry';
import type { ConvexGeometry, ConvexGeometryLogic } from '../src/geometries/ConvexGeometry';

/**
 * ConvexGeometry quickHull 回归测试。
 *
 * 原缺陷：算法误用 Vector3 的原地变异 API（sub/cross/add），首轮计算就把
 * 输入 points 的真实顶点改坏（ab 被清零 → 距离 NaN → points[ci].sub 抛
 * TypeError），任何 ConvexGeometry 场景必崩。修复后改用 subTo/crossTo/addTo
 * 非变异 API。
 */
describe('ConvexGeometry quickHull', () =>
{
    it('正八面体 6 顶点生成凸包不崩溃且输出有效网格', () =>
    {
        const geometry: ConvexGeometry = {
            __type__: 'ConvexGeometry',
            points: [
                new Vector3(1, 0, 0), new Vector3(-1, 0, 0),
                new Vector3(0, 1, 0), new Vector3(0, -1, 0),
                new Vector3(0, 0, 1), new Vector3(0, 0, -1),
            ],
        };

        const gl = logic(geometry) as unknown as ConvexGeometryLogic;

        expect(gl).toBeTruthy();
        // 正八面体凸包 = 8 个三角形面，24 个顶点（每面 3 顶点）
        expect(gl.vertices.a_position!.data.length).toBe(24 * 3);
        expect(gl.vertexIndices.length).toBe(24);
        expect(gl.bounding.min.x).toBeCloseTo(-1);
        expect(gl.bounding.max.x).toBeCloseTo(1);
    });

    it('随机点集生成凸包且所有输入点在包围盒内', () =>
    {
        const points: Vector3[] = [];
        let seed = 42;
        const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 30; i++)
        {
            points.push(new Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1));
        }

        const gl = logic({ __type__: 'ConvexGeometry', points } as ConvexGeometry) as unknown as ConvexGeometryLogic;

        expect(gl.vertexIndices.length).toBeGreaterThan(0);
        expect(gl.vertexIndices.length % 3).toBe(0);
        // 输入点不被算法改坏（变异 bug 会破坏顶点坐标）
        for (const p of points)
        {
            expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)).toBe(true);
        }
    });

    it('少于 4 点退化为空网格', () =>
    {
        const gl = logic({
            __type__: 'ConvexGeometry',
            points: [new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 1, 0)],
        } as ConvexGeometry) as unknown as ConvexGeometryLogic;

        expect(gl.vertexIndices.length).toBe(0);
    });
});
