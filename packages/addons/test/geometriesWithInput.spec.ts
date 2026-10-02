import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 ConvexGeometry.spec.ts 同模式）
import './browser-stub';

import { logic } from 'feng3d';
import { LineCurve3, Shape2, Vector2 } from '@feng3d/math';

import '../src/geometries/ExtrudeGeometry';
import '../src/geometries/LatheGeometry';
import '../src/geometries/ShapeGeometry';
import '../src/geometries/TubeGeometry';

/**
 * 需要输入的几何生成器（issue #388）。
 *
 * #382 给 7 个"参数可缺省"的生成器补了通用不变量，并**有意排除**了这 4 个 —— 它们必须提供
 * 输入（形状 / 轮廓点 / 路径），只给 `__type__` 时生成空几何是正确行为。本文件就是那"独立的一件事"。
 *
 * 这 4 个恰好算法最复杂（挤出 / 旋转 / 三角化 / 路径扫掠），所以除了 #382 那组不变量之外，
 * 还额外断言**"输入确实生效"**（改参数 → 产出的几何随之变化），这是本文件独有的价值。
 *
 * `Shape2` / `LineCurve3` 等是 `@feng3d/math` 的 class，用 `new` 是允许的
 * （仓库规范禁止的是 `new` **纯数据类**）。
 */

interface GeometryLike
{
    vertices: { a_position?: { data: ArrayLike<number> }; a_normal?: { data: ArrayLike<number> }; a_uv?: { data: ArrayLike<number> } };
    vertexIndices: ArrayLike<number>;
    bounding: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
}

/** 一个三角形轮廓（单位直角三角形） */
function triangleShape(): Shape2
{
    return new Shape2([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]);
}

function build(name: string, data: unknown): GeometryLike
{
    const gl = logic(data as never);

    if (!gl) throw new Error(`${name}: logic() 返回空`);

    return gl as unknown as GeometryLike;
}

/** 逐个检查一组不变量（与 #382 同一组） */
function assertInvariants(name: string, gl: GeometryLike): void
{
    const positions = gl.vertices.a_position?.data;
    expect(positions, `${name}: 没有 a_position`).toBeTruthy();
    expect(positions!.length, `${name}: 顶点数据为空`).toBeGreaterThan(0);
    expect(positions!.length % 3, `${name}: 顶点长度 ${positions!.length} 不是 3 的倍数`).toBe(0);

    for (let i = 0; i < positions!.length; i++)
    {
        if (!Number.isFinite(positions![i])) throw new Error(`${name}: positions[${i}] 不是有限数，实际是 ${positions![i]}`);
    }

    const vertexCount = positions!.length / 3;
    expect(gl.vertexIndices.length, `${name}: 索引为空`).toBeGreaterThan(0);
    for (let i = 0; i < gl.vertexIndices.length; i++)
    {
        const idx = gl.vertexIndices[i];
        if (!Number.isInteger(idx) || idx < 0 || idx >= vertexCount) throw new Error(`${name}: vertexIndices[${i}] = ${idx} 非法（顶点数 ${vertexCount}）`);
    }

    const { min, max } = gl.bounding;
    expect(min.x, `${name}: min.x > max.x`).toBeLessThanOrEqual(max.x);
    expect(min.y, `${name}: min.y > max.y`).toBeLessThanOrEqual(max.y);
    expect(min.z, `${name}: min.z > max.z`).toBeLessThanOrEqual(max.z);
    const size = [max.x - min.x, max.y - min.y, max.z - min.z];
    expect(Math.max(...size), `${name}: 包围盒退化`).toBeGreaterThan(0);

    if (gl.vertices.a_normal?.data) expect(gl.vertices.a_normal.data.length, `${name}: a_normal 长度不符`).toBe(vertexCount * 3);
    if (gl.vertices.a_uv?.data) expect(gl.vertices.a_uv.data.length, `${name}: a_uv 长度不符`).toBe(vertexCount * 2);
}

/** 造一个带 `__points` 的 LatheGeometry 数据（轮廓点走运行时隐藏字段，源码注释写明） */
function latheData(segments: number, points: Vector2[]): unknown
{
    const data: Record<string, unknown> = {
        __type__: 'LatheGeometry',
        segments,
        phiStart: 0,
        phiLength: Math.PI * 2,
    };
    data.__points = points;

    return data;
}

/** 一条沿 X 轴的单位线段，供 TubeGeometry 当路径 */
function linePath(): LineCurve3
{
    return new LineCurve3({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
}

describe('需要输入的几何生成器（issue #388）', () =>
{
    describe('通用不变量', () =>
    {
        it('ShapeGeometry：三角形轮廓能产出有效网格', () =>
        {
            assertInvariants('ShapeGeometry', build('ShapeGeometry', { __type__: 'ShapeGeometry', shape: triangleShape() }));
        });

        it('ExtrudeGeometry：三角形轮廓 + depth 能产出有效网格', () =>
        {
            assertInvariants('ExtrudeGeometry', build('ExtrudeGeometry', { __type__: 'ExtrudeGeometry', shapes: triangleShape(), depth: 1 }));
        });

        it('LatheGeometry：轮廓点能产出有效网格', () =>
        {
            const points = [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 2 }];
            assertInvariants('LatheGeometry', build('LatheGeometry', latheData(12, points)));
        });

        it('TubeGeometry：直线路径能产出有效网格', () =>
        {
            assertInvariants('TubeGeometry', build('TubeGeometry', {
                __type__: 'TubeGeometry',
                path: linePath(),
                tubularSegments: 8,
                radius: 0.2,
                radialSegments: 6,
                closed: false,
            }));
        });
    });

    describe('输入确实生效（本文件独有的价值）', () =>
    {
        it('ExtrudeGeometry：depth 变大 → 挤出方向变长', () =>
        {
            const shallow = build('ExtrudeGeometry', { __type__: 'ExtrudeGeometry', shapes: triangleShape(), depth: 1 });
            const deep = build('ExtrudeGeometry', { __type__: 'ExtrudeGeometry', shapes: triangleShape(), depth: 5 });

            const depthOf = (g: GeometryLike) => g.bounding.max.z - g.bounding.min.z;

            expect(depthOf(deep)).toBeGreaterThan(depthOf(shallow));
        });

        it('TubeGeometry：radius 变大 → 包围盒变大', () =>
        {
            const make = (radius: number) => build('TubeGeometry', {
                __type__: 'TubeGeometry', path: linePath(), tubularSegments: 8, radius, radialSegments: 6, closed: false,
            });

            const volumeOf = (g: GeometryLike) => (g.bounding.max.y - g.bounding.min.y) + (g.bounding.max.z - g.bounding.min.z);

            expect(volumeOf(make(0.4))).toBeGreaterThan(volumeOf(make(0.1)));
        });

        it('TubeGeometry：tubularSegments 变大 → 顶点数变多', () =>
        {
            const make = (tubularSegments: number) => build('TubeGeometry', {
                __type__: 'TubeGeometry', path: linePath(), tubularSegments, radius: 0.2, radialSegments: 6, closed: false,
            });

            const countOf = (g: GeometryLike) => g.vertices.a_position!.data.length;

            expect(countOf(make(16))).toBeGreaterThan(countOf(make(4)));
        });

        it('LatheGeometry：segments 变大 → 顶点数变多', () =>
        {
            const points = [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 2 }];
            const few = build('LatheGeometry', latheData(4, points));
            const many = build('LatheGeometry', latheData(24, points));

            expect(many.vertices.a_position!.data.length).toBeGreaterThan(few.vertices.a_position!.data.length);
        });

        it('LatheGeometry：轮廓点为空时不崩（空输入的正确行为）', () =>
        {
            // 空轮廓 → 空几何，而不是抛错或产出 NaN
            expect(() => build('LatheGeometry', latheData(12, []))).not.toThrow();
        });

        it('ShapeGeometry：三角形轮廓的三角形数与轮廓相符', () =>
        {
            const gl = build('ShapeGeometry', { __type__: 'ShapeGeometry', shape: triangleShape() });

            // 一个三角形 3 个顶点、3 个索引
            expect(gl.vertices.a_position!.data.length).toBe(3 * 3);
            expect(gl.vertexIndices.length).toBe(3);
        });
    });
});