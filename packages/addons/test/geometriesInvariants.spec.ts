import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 ConvexGeometry.spec.ts 同模式）
import './browser-stub';

// logic 从 feng3d barrel 导入：与各 Geometry.ts 内 registerLogic 走同一 reactivity 模块实例
import { logic } from 'feng3d';

// 值导入以触发各自的 registerLogic（仅作类型使用会被 esbuild 丢弃）
import '../src/geometries/CircleGeometry';
import '../src/geometries/DodecahedronGeometry';
import '../src/geometries/IcosahedronGeometry';
import '../src/geometries/OctahedronGeometry';
import '../src/geometries/RingGeometry';
import '../src/geometries/TetrahedronGeometry';
import '../src/geometries/TorusKnotGeometry';

/**
 * 几何生成器的**通用不变量**（issue #382）。
 *
 * `packages/addons/src/geometries/` 下有 13 个生成器，此前只有 `ConvexGeometry` 有测试。
 * 这些生成器不需要 GPU，而且有一组跨所有生成器通用的不变量 —— 这类代码的经典缺陷
 * 恰好都能被它们抓住：
 *
 * - **索引越界**（`vertexIndices` 指向不存在的顶点）→ 渲染时读越界或被静默丢弃；
 * - **NaN/Infinity 顶点**（某处除零、三角函数参数错）→ 整个 mesh 消失或崩；
 * - 顶点数不是 3 的倍数、属性长度不匹配、退化包围盒。
 *
 * 为了让报错能定位到"是哪个几何的哪一项"，下面凡是循环检查的地方，都把
 * 几何名与下标放进断言消息里。
 */

interface GeometryLike
{
    vertices: { a_position?: { data: ArrayLike<number> }; a_normal?: { data: ArrayLike<number> }; a_uv?: { data: ArrayLike<number> } };
    vertexIndices: ArrayLike<number>;
    bounding: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
}

/**
 * 被测的生成器清单。
 *
 * 字段都是可选的（本仓 §11.5：子接口字段可选、默认值由工厂补），所以可以只给 `__type__`。
 * `PolyhedronGeometry` 是抽象基类（§11.4 基接口不直接构造），故不列入 —— 它的具体子类
 * （Dodecahedron / Icosahedron / Octahedron / Tetrahedron）已在表内。
 */
/**
 * ⚠️ 以下 5 个生成器**没有纳入**本文件，各有明确原因（不是漏掉）：
 *
 * - `ConvexGeometry`：需要 `Vector3` 数组作为输入（只给 `__type__` 会在实现里
 *   `points[i].distance(...)` 处抛错），而且它已有专门的回归测试 `ConvexGeometry.spec.ts`；
 * - `ExtrudeGeometry` / `LatheGeometry` / `ShapeGeometry` / `TubeGeometry`：
 *   必须提供输入（形状 / 轮廓点 / 路径），**只给 `__type__` 时生成空几何是正确行为**，
 *   不是缺陷。要给它们写不变量测试，需要先各自准备一份最小合法输入 —— 那是独立的一件事。
 *
 * 因此本文件覆盖的是"参数可缺省、能自洽生成"的那 7 个生成器。
 */
const GEOMETRIES: [string, () => unknown][] = [
    ['CircleGeometry', () => ({ __type__: 'CircleGeometry' })],
    ['DodecahedronGeometry', () => ({ __type__: 'DodecahedronGeometry' })],
    ['IcosahedronGeometry', () => ({ __type__: 'IcosahedronGeometry' })],
    ['OctahedronGeometry', () => ({ __type__: 'OctahedronGeometry' })],
    ['RingGeometry', () => ({ __type__: 'RingGeometry' })],
    ['TetrahedronGeometry', () => ({ __type__: 'TetrahedronGeometry' })],
    ['TorusKnotGeometry', () => ({ __type__: 'TorusKnotGeometry' })],
];

/** 取 logic 结果（拿不到就抛，让用例直接失败而不是空指针） */
function build(name: string, factory: () => unknown): GeometryLike
{
    const gl = logic(factory() as never);

    if (!gl) throw new Error(`${name}: logic() 返回空`);

    return gl as unknown as GeometryLike;
}

describe('几何生成器的通用不变量（issue #382）', () =>
{
    it.each(GEOMETRIES)('%s：能构造出非空的 logic', (name, factory) =>
    {
        const gl = build(name, factory);

        expect(gl, name).toBeTruthy();
        expect(gl.vertices, name).toBeTruthy();
    });

    it.each(GEOMETRIES)('%s：顶点数 > 0 且是 3 的倍数', (name, factory) =>
    {
        const gl = build(name, factory);
        const positions = gl.vertices.a_position?.data;

        expect(positions, `${name}: 没有 a_position`).toBeTruthy();
        expect(positions!.length, `${name}: 顶点数据为空`).toBeGreaterThan(0);
        expect(positions!.length % 3, `${name}: 顶点数据长度 ${positions!.length} 不是 3 的倍数`).toBe(0);
    });

    it.each(GEOMETRIES)('%s：所有顶点坐标都是有限数（无 NaN/Infinity）', (name, factory) =>
    {
        const gl = build(name, factory);
        const positions = gl.vertices.a_position!.data;

        for (let i = 0; i < positions.length; i++)
        {
            const v = positions[i];

            if (!Number.isFinite(v))
            {
                // 报错信息里带上几何名与下标（分量位置也能算出来）
                throw new Error(`${name}: positions[${i}] (顶点 ${Math.floor(i / 3)} 的第 ${i % 3} 个分量) 不是有限数，实际是 ${v}`);
            }
        }

        expect(true).toBe(true);
    });

    it.each(GEOMETRIES)('%s：索引非空、都是非负整数、且在顶点数范围内', (name, factory) =>
    {
        const gl = build(name, factory);
        const positions = gl.vertices.a_position!.data;
        const vertexCount = positions.length / 3;
        const indices = gl.vertexIndices;

        expect(indices, `${name}: 没有 vertexIndices`).toBeTruthy();
        expect(indices.length, `${name}: 索引为空`).toBeGreaterThan(0);

        for (let i = 0; i < indices.length; i++)
        {
            const idx = indices[i];

            if (!Number.isInteger(idx))
            {
                throw new Error(`${name}: vertexIndices[${i}] = ${idx} 不是整数`);
            }
            if (idx < 0)
            {
                throw new Error(`${name}: vertexIndices[${i}] = ${idx} 为负数`);
            }
            if (idx >= vertexCount)
            {
                throw new Error(`${name}: vertexIndices[${i}] = ${idx} 越界（顶点数 ${vertexCount}）`);
            }
        }

        expect(true).toBe(true);
    });

    it.each(GEOMETRIES)('%s：包围盒 min ≤ max 且不退化', (name, factory) =>
    {
        const gl = build(name, factory);
        const { min, max } = gl.bounding;

        expect(min.x, `${name}: min.x > max.x`).toBeLessThanOrEqual(max.x);
        expect(min.y, `${name}: min.y > max.y`).toBeLessThanOrEqual(max.y);
        expect(min.z, `${name}: min.z > max.z`).toBeLessThanOrEqual(max.z);

        // 三个方向的尺寸不能全为 0（否则是整个塌成一点的 degenerate 网格）
        const size = [max.x - min.x, max.y - min.y, max.z - min.z];
        expect(Math.max(...size), `${name}: 包围盒退化（尺寸 ${size.join(', ')}）`).toBeGreaterThan(0);

        for (const v of [...size, min.x, min.y, min.z, max.x, max.y, max.z])
        {
            expect(Number.isFinite(v), `${name}: 包围盒分量不是有限数`).toBe(true);
        }
    });

    it.each(GEOMETRIES)('%s：法线/UV（若提供）的元素个数与顶点数一致', (name, factory) =>
    {
        const gl = build(name, factory);
        const vertexCount = gl.vertices.a_position!.data.length / 3;

        if (gl.vertices.a_normal?.data)
        {
            expect(gl.vertices.a_normal.data.length, `${name}: a_normal 个数与顶点数不一致`).toBe(vertexCount * 3);
        }
        if (gl.vertices.a_uv?.data)
        {
            expect(gl.vertices.a_uv.data.length, `${name}: a_uv 个数与顶点数不一致`).toBe(vertexCount * 2);
        }
    });
});