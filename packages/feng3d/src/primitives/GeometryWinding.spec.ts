import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import type { Geometrys } from '../geometry/Geometry';
import type { GeometryLogic } from '../geometry/Geometry';

// 触发各几何体的 registerLogic 副作用
import './CubeGeometry';
import './PlaneGeometry';
import './SphereGeometry';
import './CylinderGeometry';
import './ConeGeometry';
import './TorusGeometry';
import './CapsuleGeometry';
import './QuadGeometry';

/** 测试辅助：经 beforeRender 读取渲染数据 */
function readRenderData(lg: { beforeRender(ro: never): void }): {
    vertices: Record<string, { data: ArrayLike<number> }>;
    indices: ArrayLike<number>;
}
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number> };
}

/**
 * 三角形绕序与顶点法线一致性（正面朝外）的通用检查。
 *
 * 起因：`SphereGeometry` 曾因绕序与法线相反（正面朝内）被管线 `cullFace: 'back'` 整片剔除，
 * 表现为「几何体完全不可见」，且数据层面（顶点数、法线、索引范围）全部正常，极难定位。
 * 这里把该判据推广到全部内置几何体：对每个三角形求几何法线（叉积），与三个顶点的法线之和
 * 点积必须为正；退化三角形（极点等，叉积为零）按面积跳过。
 *
 * 新加几何体时应纳入本用例，避免同类缺陷再次以「看不见」的形式出现。
 */
/**
 * `knownWindingIssue` 留作机制保留：若将来新增几何体出现同类不一致，可用它把该用例标记为
 * 预期失败（附待修说明），既不放过缺陷也不让 CI 变红；修好后 vitest 会提示移除标记。
 */
const CASES: { type: string, geometry: Geometrys, knownWindingIssue?: string }[] = [
    { type: 'CubeGeometry', geometry: { __type__: 'CubeGeometry' } as Geometrys },
    { type: 'PlaneGeometry', geometry: { __type__: 'PlaneGeometry', width: 2, height: 2 } as Geometrys },
    { type: 'SphereGeometry', geometry: { __type__: 'SphereGeometry', radius: 2 } as Geometrys },
    { type: 'CapsuleGeometry', geometry: { __type__: 'CapsuleGeometry' } as Geometrys },
    { type: 'QuadGeometry', geometry: { __type__: 'QuadGeometry' } as Geometrys },
    { type: 'CylinderGeometry', geometry: { __type__: 'CylinderGeometry', topRadius: 1, bottomRadius: 1, height: 2 } as Geometrys },
    { type: 'ConeGeometry', geometry: { __type__: 'ConeGeometry', bottomRadius: 1, height: 2 } as Geometrys },
    { type: 'TorusGeometry', geometry: { __type__: 'TorusGeometry', radius: 2, tubeRadius: 0.5 } as Geometrys },
];

describe('内置几何体绕序与法线一致性', () =>
{
    for (const { type, geometry, knownWindingIssue } of CASES)
    {
        const verify = () =>
        {
            const g = logic(geometry) as GeometryLogic;
            const data = readRenderData(g);

            const positions = data.vertices['a_position'].data;
            const normals = data.vertices['a_normal'].data;
            const indices = data.indices;
            const vertexCount = positions.length / 3;

            expect(vertexCount).toBeGreaterThan(0);
            expect(indices.length).toBeGreaterThan(0);
            expect(normals.length).toBe(positions.length);

            const p = (i: number, k: number) => positions[i * 3 + k];
            const n = (i: number, k: number) => normals[i * 3 + k];

            let checked = 0;
            for (let i = 0; i + 2 < indices.length; i += 3)
            {
                const [i0, i1, i2] = [indices[i], indices[i + 1], indices[i + 2]];
                const e1 = [p(i1, 0) - p(i0, 0), p(i1, 1) - p(i0, 1), p(i1, 2) - p(i0, 2)];
                const e2 = [p(i2, 0) - p(i0, 0), p(i2, 1) - p(i0, 1), p(i2, 2) - p(i0, 2)];
                const face = [
                    e1[1] * e2[2] - e1[2] * e2[1],
                    e1[2] * e2[0] - e1[0] * e2[2],
                    e1[0] * e2[1] - e1[1] * e2[0],
                ];
                const faceLength = Math.sqrt(face[0] ** 2 + face[1] ** 2 + face[2] ** 2);

                // 退化三角形（极点 / 封口处的重复点）没有面积，跳过
                if (faceLength < 1e-6) continue;

                const normalSum = [
                    n(i0, 0) + n(i1, 0) + n(i2, 0),
                    n(i0, 1) + n(i1, 1) + n(i2, 1),
                    n(i0, 2) + n(i1, 2) + n(i2, 2),
                ];
                const dot = face[0] * normalSum[0] + face[1] * normalSum[1] + face[2] * normalSum[2];

                expect(dot, `三角形 #${i / 3}（顶点 ${i0}/${i1}/${i2}）绕序与法线相反`).toBeGreaterThan(0);
                checked++;
            }
            expect(checked).toBeGreaterThan(0);
        };

        if (knownWindingIssue)
        {
            it.fails(`${type}：三角形绕序与顶点法线一致（已知缺陷待修：${knownWindingIssue}）`, verify);
        }
        else
        {
            it(`${type}：三角形绕序与顶点法线一致`, verify);
        }
    }
});
