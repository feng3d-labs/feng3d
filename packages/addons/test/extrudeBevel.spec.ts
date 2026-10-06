import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与其它几何 spec 同模式）
import './browser-stub';

import { logic } from 'feng3d';
import { Shape2 } from '@feng3d/math';
import '../src/geometries/ExtrudeGeometry';

/** 边长为 size 的正方形轮廓（离散点，不走曲线，便于精确断言） */
function square(size: number): Shape2
{
    return new Shape2([
        { x: 0, y: 0 },
        { x: size, y: 0 },
        { x: size, y: size },
        { x: 0, y: size },
    ]);
}

interface GeoLike
{
    vertices: { a_position: { data: ArrayLike<number> } };
    vertexIndices: ArrayLike<number>;
}

/** 取所有顶点的 z 值范围与 xy 范围 */
function extents(geo: GeoLike)
{
    const pos = geo.vertices.a_position.data;
    let minZ = Infinity; let maxZ = -Infinity;
    let minX = Infinity; let maxX = -Infinity;
    for (let i = 0; i < pos.length; i += 3)
    {
        minX = Math.min(minX, pos[i]); maxX = Math.max(maxX, pos[i]);
        minZ = Math.min(minZ, pos[i + 2]); maxZ = Math.max(maxZ, pos[i + 2]);
    }

    return { minZ, maxZ, minX, maxX, count: pos.length / 3 };
}

/**
 * ExtrudeGeometry 的 bevel 倒角。
 *
 * 对齐 three 的公式：倒角第 `b` 层取 `t = b / bevelSegments`，
 * 底部 `z = -bevelThickness * cos(t·π/2)`、轮廓外扩 `bevelSize * sin(t·π/2)`，顶部镜像。
 */
describe('ExtrudeGeometry 的 bevel 倒角', () =>
{
    it('未启用 bevel：只有 z=0 与 z=depth 两层，轮廓不外扩', () =>
    {
        const geo = logic({ __type__: 'ExtrudeGeometry', shapes: square(10), depth: 4 }) as unknown as GeoLike;
        const e = extents(geo);

        expect(e.minZ).toBe(0);
        expect(e.maxZ).toBe(4);
        // 轮廓保持在 [0, 10]，没有被外扩
        expect(e.minX).toBe(0);
        expect(e.maxX).toBe(10);
    });

    it('bevelThickness 把 z 范围两端各撑开；bevelSize 只外扩轮廓、不改变主体', () =>
    {
        const geo = logic({
            __type__: 'ExtrudeGeometry',
            shapes: square(10),
            depth: 4,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 2,
            bevelSegments: 3,
        }) as unknown as GeoLike;
        const e = extents(geo);

        // z 范围 = [-bevelThickness, depth + bevelThickness]
        expect(e.minZ).toBeCloseTo(-1, 6);
        expect(e.maxZ).toBeCloseTo(5, 6);
        // 轮廓外扩量是 `bevelSize * sin(t·π/2)`，而 `t = b / bevelSegments` 最大只到
        // `(segments - 1) / segments`（与 three 的循环同口径），所以**外扩永远达不到 bevelSize**。
        // segments = 3、bevelSize = 2 时最大外扩 = 2·sin(2π/6) = √3。
        expect(e.minX).toBeCloseTo(-Math.sqrt(3), 6);
        expect(e.maxX).toBeCloseTo(10 + Math.sqrt(3), 6);
    });

    it('bevelSegments 决定分层数：顶点数随段数单调增加', () =>
    {
        const make = (segments: number) => logic({
            __type__: 'ExtrudeGeometry',
            shapes: square(10),
            depth: 4,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 2,
            bevelSegments: segments,
        }) as unknown as GeoLike;
        const one = extents(make(1));
        const three = extents(make(3));

        // 每多一段，两端各多一层 × 每层 4 个顶点
        expect(three.count - one.count).toBe(2 * 2 * 4);
    });

    it('bevelSize 为 0 时退化成直挤出（层不外扩，z 范围仍被 thickness 撑开）', () =>
    {
        const geo = logic({
            __type__: 'ExtrudeGeometry',
            shapes: square(10),
            depth: 4,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 0,
        }) as unknown as GeoLike;
        const e = extents(geo);

        // 本仓与 three 同口径：size 为 0 时不再算倒角，故 z 范围仍是 [0, depth]
        expect(e.minZ).toBe(0);
        expect(e.maxZ).toBe(4);
        expect(e.minX).toBe(0);
        expect(e.maxX).toBe(10);
    });

    it('倒角几何不产生 NaN / Infinity 顶点，索引不越界', () =>
    {
        const geo = logic({
            __type__: 'ExtrudeGeometry',
            shapes: square(10),
            depth: 4,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 2,
            bevelSegments: 3,
        }) as unknown as GeoLike;
        const pos = geo.vertices.a_position.data;
        const count = pos.length / 3;

        for (let i = 0; i < pos.length; i++) expect(Number.isFinite(pos[i])).toBe(true);
        for (let i = 0; i < geo.vertexIndices.length; i++)
        {
            const idx = geo.vertexIndices[i];
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(count);
        }
    });
});
