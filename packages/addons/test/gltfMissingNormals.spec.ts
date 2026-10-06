import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import './browser-stub';

import { parseGLB } from '../src/loaders/GLTFLoader';

/**
 * glTF **缺失 `NORMAL`** 时的法线生成（回归）。
 *
 * glTF 规范要求：primitive 未提供 `NORMAL` 时，客户端**必须**自行计算法线。
 * 本仓原先直接填 0，后果是光照完全失效——`Horse` / `Flamingo` / `Stork` / `Parrot` 四个 GLB 的属性
 * 只有 `POSITION, COLOR_0, TEXCOORD_0`（都没有 `NORMAL`），于是动物渲染成**均匀的深色剪影**：
 * 既没有立体感，morph 的形变也因此看不出来（被误判成「动画没播」）。
 *
 * 这里用真实资源断言三件事：法线非全零、逐顶点单位长度、且**朝外**（与三角形绕序一致）。
 */
describe('GLTFLoader 为缺失 NORMAL 的 primitive 生成法线', () =>
{
    const glbPath = new URL('../../../examples/resources/Horse.glb', import.meta.url);
    const fileBuffer = readFileSync(glbPath);
    const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));
    const geometry = result.primitives[0].geometry as unknown as {
        normals: number[]; positions: number[]; indices: number[];
    };

    it('法线非全零（原来这里全是 0）', () =>
    {
        const normals = geometry.normals;
        expect(normals.length).toBe(geometry.positions.length);
        let nonzero = 0;
        for (let i = 0; i < normals.length; i += 3)
        {
            if (Math.abs(normals[i]) + Math.abs(normals[i + 1]) + Math.abs(normals[i + 2]) > 1e-6) nonzero++;
        }
        // 绝大多数字号都应有有效法线（退化三角形除外）
        expect(nonzero / (normals.length / 3)).toBeGreaterThan(0.99);
    });

    it('每个法线都是单位长度且有限', () =>
    {
        const normals = geometry.normals;
        for (let i = 0; i < normals.length; i += 3)
        {
            const nx = normals[i]; const ny = normals[i + 1]; const nz = normals[i + 2];
            expect(Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz)).toBe(true);
            expect(Math.hypot(nx, ny, nz)).toBeCloseTo(1, 5);
        }
    });

    it('法线朝向与三角形绕序一致（背向镜头的那半不会反过来）', () =>
    {
        const { positions, indices, normals } = geometry;
        // 抽查若干三角形：其几何法线应与顶点法线**同向**（点积为正）
        let sameDirection = 0;
        let checked = 0;
        for (let t = 0; t + 2 < indices.length && checked < 200; t += 3)
        {
            const i0 = indices[t] * 3; const i1 = indices[t + 1] * 3; const i2 = indices[t + 2] * 3;
            const ax = positions[i1] - positions[i0];
            const ay = positions[i1 + 1] - positions[i0 + 1];
            const az = positions[i1 + 2] - positions[i0 + 2];
            const bx = positions[i2] - positions[i0];
            const by = positions[i2 + 1] - positions[i0 + 1];
            const bz = positions[i2 + 2] - positions[i0 + 2];
            const fx = ay * bz - az * by;
            const fy = az * bx - ax * bz;
            const fz = ax * by - ay * bx;
            const len = Math.hypot(fx, fy, fz);
            if (len < 1e-9) continue;
            const avgX = (normals[i0] + normals[i1] + normals[i2]) / 3;
            const avgY = (normals[i0 + 1] + normals[i1 + 1] + normals[i2 + 1]) / 3;
            const avgZ = (normals[i0 + 2] + normals[i1 + 2] + normals[i2 + 2]) / 3;
            checked++;
            if ((fx * avgX + fy * avgY + fz * avgZ) > 0) sameDirection++;
        }
        expect(checked).toBeGreaterThan(0);
        // 允许极少数不一致：顶点法线是相邻三角形法线的**面积加权平均**，在尖角/窄三角形处
        // 会被邻近的大面拉偏（实测 200 个抽查里有 1 个如此）。关键是绝大多数仍然同向——
        // 若整体朝向反了，这里会接近 0%。
        expect(sameDirection / checked).toBeGreaterThan(0.95);
    });
});
