/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';

// 触发 registerLogic('CubeGeometry', cubeGeometryLogic)
import './CubeGeometry';
import type { CubeGeometry } from './CubeGeometry';
import type { GeometryLogic } from '../geometry/Geometry';

/**
 * 构造一个 2x2x2 立方体 GeometryLogic。
 */
function makeCube(): GeometryLogic
{
    const geo = {
        __type__: 'CubeGeometry',
        width: 2,
        height: 2,
        depth: 2,
        segmentsW: 1,
        segmentsH: 1,
        segmentsD: 1,
        tile6: false,
    } as CubeGeometry;

    return logic(geo) as GeometryLogic;
}

/**
 * 从 GeometryLogic.attributes 取顶点数据（Float32Array 作为 number[] 索引访问）。
 * indices 不在 attributes（独立 computed 覆盖在实例上），用断言访问。
 */
function getAttr(g: GeometryLogic, name: string): number[]
{
    return g.attributes[name].data as unknown as number[];
}

function getIndices(g: GeometryLogic): number[]
{
    return (g as unknown as { indices: number[] }).indices;
}

/**
 * CubeGeometry UV 方向单元测试。
 *
 * 背景：feng3d 纹理上传不 flipY（copyExternalImageToTexture 默认 false），
 * 因此 UV.v=0 对应图像**顶部**。这与 three.js（flipY=true，UV.v=0 对应图像底部）相反。
 *
 * 本测试针对 +Z 面（相机看向 -Z 时的正面）验证：
 * - 顶点 y=+h/2（顶部）→ UV.v=0（图像顶部）
 * - 顶点 y=-h/2（底部）→ UV.v=1（图像底部）
 *
 * 这样可避免依赖浏览器视觉测试，纯函数断言。
 */
describe('CubeGeometry UV 方向（feng3d 无 flipY）', () =>
{
    it('+Z 面：顶部顶点 UV.v=0，底部顶点 UV.v=1', () =>
    {
        const g = makeCube();
        const positions = getAttr(g, 'a_position');
        const uvs = getAttr(g, 'a_uv');

        // 6 面 × 4 顶点 = 24 顶点；face order: +X,-X,+Y,-Y,+Z,-Z
        // +Z 是第 5 个面（索引 4），起始顶点偏移 = 4*4 = 16
        const zFaceStart = 16;
        // +Z 面 getFaces: u=0(x), v=1(y), w=2(z), udir=1, vdir=-1, depthHalf=+1
        for (let i = 0; i < 4; i++)
        {
            const vi = (zFaceStart + i) * 3;
            const uvI = (zFaceStart + i) * 2;
            const px = positions[vi];
            const py = positions[vi + 1];
            const pz = positions[vi + 2];
            const v = uvs[uvI + 1];

            // +Z 面 z 坐标都 = +1
            expect(pz).toBe(1);
            // 顶部顶点（y=+1）→ UV.v=0；底部（y=-1）→ UV.v=1
            if (py > 0)
            {
                expect(v).toBe(0);
            }
            else
            {
                expect(v).toBe(1);
            }
        }
    });

    it('+Z 面 UV.u：左顶点 u=0，右顶点 u=1', () =>
    {
        const g = makeCube();
        const positions = getAttr(g, 'a_position');
        const uvs = getAttr(g, 'a_uv');
        const zFaceStart = 16;
        for (let i = 0; i < 4; i++)
        {
            const vi = (zFaceStart + i) * 3;
            const uvI = (zFaceStart + i) * 2;
            const px = positions[vi];
            const u = uvs[uvI];
            // 左顶点（x=-1）→ u=0；右顶点（x=+1）→ u=1
            if (px < 0)
            {
                expect(u).toBe(0);
            }
            else
            {
                expect(u).toBe(1);
            }
        }
    });

    it('+Y 面（顶面）：法线朝 +Y（向外）', () =>
    {
        const g = makeCube();
        const normals = getAttr(g, 'a_normal');
        // +Y 是第 3 个面（索引 2），起始顶点偏移 = 2*4 = 8
        const yFaceStart = 8;
        for (let i = 0; i < 4; i++)
        {
            const ni = (yFaceStart + i) * 3;
            // +Y 面外法线应朝 +Y：(0, +1, 0)
            expect([normals[ni], normals[ni + 1], normals[ni + 2]]).toEqual([0, 1, 0]);
        }
    });

    it('+Z 面：法线朝 +Z（向外）', () =>
    {
        const g = makeCube();
        const normals = getAttr(g, 'a_normal');
        const zFaceStart = 16;
        for (let i = 0; i < 4; i++)
        {
            const ni = (zFaceStart + i) * 3;
            expect([normals[ni], normals[ni + 1], normals[ni + 2]]).toEqual([0, 0, 1]);
        }
    });

    it('索引环绕：从 +Z 看 +Z 面为 CCW（叉积 z>0）', () =>
    {
        const g = makeCube();
        const indices = getIndices(g);
        const positions = getAttr(g, 'a_position');
        // +Z 面起始 vertex offset = 16；两个三角形位于 indices[24..29]
        const tris = [
            [indices[24], indices[25], indices[26]],
            [indices[27], indices[28], indices[29]],
        ];

        function crossZ(a: number, b: number, c: number): number
        {
            const ax = positions[a * 3], ay = positions[a * 3 + 1];
            const bx = positions[b * 3], by = positions[b * 3 + 1];
            const cx = positions[c * 3], cy = positions[c * 3 + 1];
            const abx = bx - ax, aby = by - ay;
            const acx = cx - ax, acy = cy - ay;

            return abx * acy - aby * acx;
        }

        for (const t of tris)
        {
            // 从 +Z 看（眼睛在 +Z，看向 -Z），CCW 应使叉积 z>0
            expect(crossZ(t[0], t[1], t[2])).toBeGreaterThan(0);
        }
    });

    it('所有 6 面外法线都朝外（depthHalf 符号匹配面方向）', () =>
    {
        const g = makeCube();
        const normals = getAttr(g, 'a_normal');
        const positions = getAttr(g, 'a_position');
        // 每面 4 顶点
        for (let face = 0; face < 6; face++)
        {
            for (let i = 0; i < 4; i++)
            {
                const vi = (face * 4 + i) * 3;
                const px = positions[vi];
                const py = positions[vi + 1];
                const pz = positions[vi + 2];
                const nx = normals[vi];
                const ny = normals[vi + 1];
                const nz = normals[vi + 2];
                // 法线·位置 应 > 0（外法线与顶点位置同向）
                const dot = nx * px + ny * py + nz * pz;
                expect(dot).toBeGreaterThan(0);
            }
        }
    });

    it('-Z 面：顶点 z=-1，法线朝 -Z', () =>
    {
        const g = makeCube();
        const positions = getAttr(g, 'a_position');
        const normals = getAttr(g, 'a_normal');
        const uvs = getAttr(g, 'a_uv');
        // -Z 是第 6 个面（索引 5），起始顶点偏移 = 5*4 = 20
        const negZStart = 20;
        for (let i = 0; i < 4; i++)
        {
            const vi = (negZStart + i) * 3;
            expect(positions[vi + 2]).toBe(-1); // z = -1
            // 法线 = (0, 0, -1)
            expect([normals[vi], normals[vi + 1], normals[vi + 2]]).toEqual([0, 0, -1]);
        }
        // -Z 面从相机看（眼睛在 +Z 看不到，但旋转 180° 后能看到）
        // 验证 UV：顶部顶点（y=+1）→ v=0
        for (let i = 0; i < 4; i++)
        {
            const vi = (negZStart + i) * 3;
            const uvI = (negZStart + i) * 2;
            const py = positions[vi + 1];
            const v = uvs[uvI + 1];
            if (py > 0) expect(v).toBe(0);
            else expect(v).toBe(1);
        }
    });
});
