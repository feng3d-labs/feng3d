import { Vector3 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        ConvexGeometry: ConvexGeometry;
    }
}

/**
 * 凸包几何体（纯数据接口）。
 *
 * 从一组 3D 点生成凸包（convex hull）网格。用 QuickHull 算法计算凸包面，
 * 每个 face 三角化为 3 个顶点（fan），输出 positions/normals/indices。
 *
 * 对应 three.js addons/geometries/ConvexGeometry.js。
 */
export interface ConvexGeometry extends Geometry
{
    readonly __type__: 'ConvexGeometry';
    /** 输入点集（凸包将包含这些点） */
    readonly points: Vector3[];
}

/**
 * QuickHull 凸包算法（紧凑实现）。
 *
 * 返回凸包的三角面列表，每面含 { vertices: [v0,v1,v2], normal }。
 * 算法：找极值点建初始四面体 → 对每个面，收集其外侧最远点，细分为新面 → 迭代到收敛。
 */
interface HullFace
{
    /** 面的 3 个顶点索引（指向 points 数组） */
    i: [number, number, number];
    /** 面法线（归一化） */
    normal: Vector3;
    /** 面外侧（法线方向）的点索引集 */
    outside: number[];
}

function quickHull(points: Vector3[]): { positions: number[]; normals: number[]; indices: number[] }
{
    const n = points.length;
    if (n < 4)
    {
        // 退化：少于 4 点无法建体，返回空
        return { positions: [], normals: [], indices: [] };
    }

    // 1. 找 aabb 极值点，选最大跨度的轴上两个点
    let ext = points[0];
    for (let i = 0; i < n; i++) { if (points[i].x < ext.x) ext = points[i]; }
    let far = points[1];
    let farDist = 0;
    for (let i = 0; i < n; i++) { const d = points[i].distance(ext); if (d > farDist) { farDist = d; far = points[i]; } }
    // far 可能 == ext，退回 x 最大
    if (far === ext) { far = points.reduce((a, b) => b.x > a.x ? b : a); }

    // 2. 找离直线(ext→far)最远的点 c
    const ab = far.sub(ext);
    let ci = -1; let cDist = -1;
    for (let i = 0; i < n; i++)
    {
        const ap = points[i].sub(ext);
        const cross = ab.cross(ap);
        const d = cross.length / ab.length;
        if (d > cDist) { cDist = d; ci = i; }
    }

    // 3. 找离三角形(ext,far,ci)最远的点 di
    const extI = points.indexOf(ext), farI = points.indexOf(far);
    let di = -1; let dDist = -1;
    const triNormal = ab.cross(points[ci].sub(ext)).normalize();
    const triD = triNormal.dot(ext);
    for (let i = 0; i < n; i++)
    {
        const d = Math.abs(points[i].dot(triNormal) - triD);
        if (d > dDist) { dDist = d; di = i; }
    }

    // 初始四面体的 4 面
    const v = [extI, farI, ci, di];
    // 确保每个面法线朝外（远离四面体质心）
    const center = ext.add(far).add(points[ci]).add(points[di]).scaleNumber(0.25);
    function makeFace(a: number, b: number, c: number): HullFace
    {
        const nrm = points[b].sub(points[a]).cross(points[c].sub(points[a]));
        const len = nrm.length;
        if (len > 1e-10) nrm.scaleNumber(1 / len);
        // 翻转使法线远离质心
        if (nrm.dot(points[a].sub(center)) < 0) { nrm.scaleNumber(-1); const t = b; b = c; c = t; }
        return { i: [a, b, c], normal: nrm, outside: [] };
    }
    let faces: HullFace[] = [
        makeFace(v[0], v[1], v[2]),
        makeFace(v[0], v[3], v[1]),
        makeFace(v[0], v[2], v[3]),
        makeFace(v[1], v[3], v[2]),
    ];

    // 4. 分配所有点到面的 outside
    function pointAbove(face: HullFace, p: Vector3): boolean
    {
        return face.normal.dot(p.sub(points[face.i[0]])) > 1e-7;
    }
    function reassignOutside()
    {
        for (const f of faces) f.outside = [];
        for (let i = 0; i < n; i++)
        {
            for (const f of faces) { if (pointAbove(f, points[i])) { f.outside.push(i); break; } }
        }
    }
    reassignOutside();

    // 5. 迭代：找有 outside 的面，取最远点，找其"可见面集"，建新面
    let iterations = 0;
    while (iterations++ < 1000)
    {
        // 找 outside 最多的面
        let face: HullFace | null = null;
        let bestDist = -1; let bestPt = -1;
        for (const f of faces)
        {
            for (const pi of f.outside)
            {
                const d = f.normal.dot(points[pi].sub(points[f.i[0]]));
                if (d > bestDist) { bestDist = d; bestPt = pi; face = f; }
            }
        }
        if (!face || bestPt < 0) break; // 收敛

        const eye = points[bestPt];
        // 找所有从 eye 可见的面（eye 在其外侧）
        const visible = faces.filter(f => pointAbove(f, eye));
        if (visible.length === 0) { face.outside = face.outside.filter(p => p !== bestPt); continue; }

        // 收集可见面的边界边（只属于一个可见面的边 = horizon）
        const edgeMap = new Map<string, { a: number; b: number }>();
        for (const f of visible)
        {
            for (let e = 0; e < 3; e++)
            {
                const a = f.i[e], b = f.i[(e + 1) % 3];
                const key = a < b ? `${a},${b}` : `${b},${a}`;
                const existing = edgeMap.get(key);
                if (existing) edgeMap.delete(key); // 内部边（两个面共享）→ 删除
                else edgeMap.set(key, { a, b });
            }
        }
        // 从可见面列表删除
        const visibleSet = new Set(visible);
        faces = faces.filter(f => !visibleSet.has(f));

        // 用 horizon 边 + eye 点建新面
        for (const [, e] of edgeMap)
        {
            // 法线朝外：边方向 × (eye - edge.a)，确保远离质心
            const nrm = points[e.b].sub(points[e.a]).cross(eye.sub(points[e.a]));
            const len = nrm.length;
            if (len < 1e-10) continue;
            nrm.scaleNumber(1 / len);
            if (nrm.dot(points[e.a].sub(center)) < 0) { nrm.scaleNumber(-1); faces.push({ i: [e.a, e.b, bestPt], normal: nrm, outside: [] }); }
            else { faces.push({ i: [e.b, e.a, bestPt], normal: nrm, outside: [] }); }
        }
        reassignOutside();
    }

    // 6. 输出：每面 fan 三角化（每面 3 顶点，法线 = 面法线）
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    let vi = 0;
    for (const f of faces)
    {
        for (let k = 0; k < 3; k++)
        {
            const p = points[f.i[k]];
            positions.push(p.x, p.y, p.z);
            normals.push(f.normal.x, f.normal.y, f.normal.z);
        }
        indices.push(vi, vi + 1, vi + 2);
        vi += 3;
    }

    return { positions, normals, indices };
}

/**
 * 创建 ConvexGeometryLogic 实例（函数式实现）。
 *
 * 用 QuickHull 从 points 计算凸包，生成 positions/normals/indices（computed 懒求值）。
 * 模式与 PolyhedronGeometry 一致：computed 驱动 attributes，indices 覆盖基类 getter。
 */
export function convexGeometryLogic(geometry: ConvexGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<ConvexGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.points === undefined) writable.points = [];

    // computed：points 变化时重算凸包
    const _hull = computed(() =>
    {
        const pts = reactive(geometry).points;

        return quickHull(pts);
    });
    const _positions = computed(() => new Float32Array(_hull.value.positions));
    const _normals = computed(() => new Float32Array(_hull.value.normals));
    const _indices = computed(() => _hull.value.indices);
    const _uvs = computed(() =>
    {
        const n = _positions.value.length / 3;
        const d = new Float32Array(n * 2);

        return d;
    });
    const _colors = computed(() =>
    {
        const n = _positions.value.length / 3;
        const d = new Float32Array(n * 4);
        d.fill(1);

        return d;
    });

    function createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(_positions, 'float32x3'),
            a_color: computedAttr(_colors, 'float32x4'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    base.setAttributes(createAttributes());
    Object.defineProperty(base, 'indices', { get() { return _indices.value; }, enumerable: true, configurable: true });

    return base;
}

registerLogic('ConvexGeometry', convexGeometryLogic);
registerCloneFactory('ConvexGeometry', (src: ConvexGeometry) => ({ ...src }) as ConvexGeometry);
