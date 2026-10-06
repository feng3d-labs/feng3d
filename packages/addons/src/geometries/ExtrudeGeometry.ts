import type { Shape2 } from '@feng3d/math';
import { Geometry, GeometryLogic, computedAttr, createGeometryLogicState, geometryBeforeRender, geometryBounding, geometryRaycast } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ExtrudeGeometry: ExtrudeGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        ExtrudeGeometry: ExtrudeGeometry;
    }
}

/**
 * 挤出几何体（纯数据接口）。
 *
 * 把 2D Shape2 沿 Z 轴挤出为 3D 实体，对应 three.js 的 `ExtrudeGeometry`。
 *
 * 支持 bevel 倒角（`bevelEnabled` + `bevelThickness`/`bevelSize`/`bevelSegments`）：
 * 沿 Z 方向在主体两端各生成一层圆角过渡——每层把轮廓**向外偏移** `bevelSize * sin(t·π/2)`、
 * 同时把 Z 收进 `bevelThickness * cos(t·π/2)`，与 three 的分层公式一致。
 */
export interface ExtrudeGeometry extends Geometry
{
    readonly __type__: 'ExtrudeGeometry';
    /** 2D 形状（含轮廓 + 孔洞） */
    readonly shapes: Shape2 | Shape2[];
    /** 挤出深度 */
    readonly depth?: number;
    /** 曲线细分数 */
    readonly curveSegments?: number;
    /** 挤出方向步数（默认 1，大于 1 时中间插入分段） */
    readonly steps?: number;
    /** 是否启用倒角（默认 false） */
    readonly bevelEnabled?: boolean;
    /**
     * 倒角沿 Z 方向的厚度（默认 0）。
     *
     * 倒角段占据 `[-bevelThickness, 0]` 与 `[depth, depth + bevelThickness]` 两段。
     */
    readonly bevelThickness?: number;
    /**
     * 倒角在轮廓法线方向的偏移量（默认 0）。
     *
     * 每层轮廓相对原始轮廓**向外**偏移 `bevelSize * sin(t·π/2)`（`t` 为层内比例）。
     */
    readonly bevelSize?: number;
    /** 倒角的分层段数（默认 3，越大越圆滑） */
    readonly bevelSegments?: number;
    /** 轮廓偏移的基础量（默认 0，three 的 `bevelOffset`） */
    readonly bevelOffset?: number;
}

/**
 * ExtrudeGeometryLogic 逻辑类。
 *
 * 挤出算法（简化版，无 bevel）：
 * 1. 用 Shape2.triangulate 三角化顶面（z=0）和底面（z=depth，翻转法线）
 * 2. 沿轮廓边建侧面四边形（每边 2 三角形）
 */
export interface ExtrudeGeometryLogic extends GeometryLogic
{
}

/**
 * 工厂函数：ExtrudeGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function extrudeGeometryLogic(data: ExtrudeGeometry): ExtrudeGeometryLogic
{
    // 默认值填充（工厂内完成，创建完成即已填充）
    const writable = data as UnReadonly<ExtrudeGeometry>;
    if (data.name === undefined) writable.name = '';
    if (data.depth === undefined) writable.depth = 1;
    if (data.curveSegments === undefined) writable.curveSegments = 12;
    if (data.steps === undefined) writable.steps = 1;
    if (data.bevelThickness === undefined) writable.bevelThickness = 0;
    if (data.bevelSize === undefined) writable.bevelSize = 0;
    if (data.bevelSegments === undefined) writable.bevelSegments = 3;
    if (data.bevelOffset === undefined) writable.bevelOffset = 0;

    // 响应式参数访问器（默认值已填充，直接读取）
    const shapes = (): Shape2 | Shape2[] => reactive(data).shapes;
    const depth = (): number => reactive(data).depth ?? 1;
    const curveSegments = (): number => reactive(data).curveSegments ?? 12;
    const bevelThickness = (): number => reactive(data).bevelThickness ?? 0;
    const bevelSize = (): number => reactive(data).bevelSize ?? 0;
    const bevelSegments = (): number => Math.max(1, Math.floor(reactive(data).bevelSegments ?? 3));
    const bevelOffset = (): number => reactive(data).bevelOffset ?? 0;
/** 倒角是否真正生效（three 也要求 thickness/size 均非零，否则退化为直挤出） */
    const bevelActive = (): boolean => (reactive(data).bevelEnabled ?? false) && bevelThickness() !== 0 && bevelSize() !== 0;

    /** 二维点（与 Shape2.getPoints 的返回元素同形） */
    type Pt2 = { x: number; y: number };

    /** 线段 a→b 的单位法线（左手法线，与侧壁算法保持一致） */
    function edgeNormal(a: Pt2, b: Pt2, out: Pt2): void
    {
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        const len = Math.sqrt(ex * ex + ey * ey);

        if (len > 1e-12)
        {
            out.x = ey / len;
            out.y = -ex / len;
        }
        else
        {
            out.x = 0;
            out.y = 0;
        }
    }

    /**
     * 把闭合轮廓沿法线方向整体偏移 `amount`（倒角每层的轮廓）。
     *
     * 每个顶点的偏移方向取**相邻两条边外法线的角平分线**，并按 `1 / cos(半夹角)` 放大长度，
     * 这样尖角处的轮廓不会因为两条边各偏一点而缩短——与 three 的 `getBevelVec` 同思路。
     */
    function offsetContour(points: readonly Pt2[], amount: number): Pt2[]
    {
        const n = points.length;
        const result: Pt2[] = [];
        const n1: Pt2 = { x: 0, y: 0 };
        const n2: Pt2 = { x: 0, y: 0 };

        for (let i = 0; i < n; i++)
        {
            const cur = points[i];
            const prev = points[(i - 1 + n) % n];
            const next = points[(i + 1) % n];
            edgeNormal(prev, cur, n1);
            edgeNormal(cur, next, n2);

            let bx = n1.x + n2.x;
            let by = n1.y + n2.y;
            const len = Math.sqrt(bx * bx + by * by);

            if (len < 1e-9)
            {
                // 两条边共线（或退化）：直接用前一条边的法线
                bx = n1.x;
                by = n1.y;
            }
            else
            {
                bx /= len;
                by /= len;
            }

            // 长度补偿：角平分线方向的位移，投影回单边法线要除以 cos(半夹角)
            const cos = bx * n1.x + by * n1.y;
            const scale = Math.abs(cos) > 1e-6 ? amount / cos : amount;
            result.push({ x: cur.x + bx * scale, y: cur.y + by * scale });
        }

        return result;
    }

    /** 一层：Z 位置 + 该层轮廓相对原轮廓的偏移量 */
    type Layer = { z: number; offset: number };

    /**
     * 生成 Z 方向的层表（由下到上）。
     *
     * three 的公式：倒角第 `b` 层取 `t = b / bevelSegments`，
     * 底部 `z = -bevelThickness * cos(t·π/2)`、偏移 `bevelSize * sin(t·π/2)`；
     * 顶部镜像。中间夹 `z = 0` 与 `z = depth` 两层作为主体。
     */
    function buildLayers(): Layer[]
    {
        const bt = bevelThickness();
        const bs = bevelSize();
        const off = bevelOffset();
        const segments = bevelSegments();
        const active = bevelActive();
        const baseOffset = active ? off : 0;
        const depthValue = depth();
        const layers: Layer[] = [];

        if (active)
        {
            for (let b = 0; b < segments; b++)
            {
                const t = b / segments;
                layers.push({ z: -bt * Math.cos(t * Math.PI / 2), offset: off + bs * Math.sin(t * Math.PI / 2) });
            }
        }
        layers.push({ z: 0, offset: baseOffset });
        layers.push({ z: depthValue, offset: baseOffset });
        if (active)
        {
            for (let b = segments - 1; b >= 0; b--)
            {
                const t = b / segments;
                layers.push({ z: depthValue + bt * Math.cos(t * Math.PI / 2), offset: off + bs * Math.sin(t * Math.PI / 2) });
            }
        }

        return layers;
    }

    function buildExtrude(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const shapesValue = shapes();
        if (!shapesValue) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const depthValue = depth();
        const divisions = curveSegments();
        const shapeList = Array.isArray(shapesValue) ? shapesValue : [shapesValue];

        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        // 层表对所有 shape 相同：无 bevel 时恰好两层（z=0 / z=depth），有 bevel 时两端各加若干倒角层
        const layers = buildLayers();

        for (const shape of shapeList)
        {
            // 三角化顶面（z=0）
            const tri = shape.triangulate({ points: [], indices: [] });
            const pts2d = tri.points;
            const triIdx = tri.indices;

            const baseVert = positions.length / 3;

            // 顶面（z=0，法线 +Z）
            for (let i = 0; i < pts2d.length; i += 2)
            {
                positions.push(pts2d[i], pts2d[i + 1], 0);
                normals.push(0, 0, 1);
                uvs.push(pts2d[i], pts2d[i + 1]);
            }
            for (let i = 0; i < triIdx.length; i += 3)
            {
                indices.push(baseVert + triIdx[i], baseVert + triIdx[i + 1], baseVert + triIdx[i + 2]);
            }

            // 底面（z=depth，法线 -Z，翻转索引）
            const botBase = positions.length / 3;
            for (let i = 0; i < pts2d.length; i += 2)
            {
                positions.push(pts2d[i], pts2d[i + 1], depthValue);
                normals.push(0, 0, -1);
                uvs.push(pts2d[i], pts2d[i + 1]);
            }
            for (let i = 0; i < triIdx.length; i += 3)
            {
                indices.push(botBase + triIdx[i + 2], botBase + triIdx[i + 1], botBase + triIdx[i]);
            }

            // 侧面：在相邻两层之间沿轮廓边建四边形。
            //
            // 无 bevel 时 `layers` 恰好两层（z=0 / z=depth），这里退化成与原先完全相同的单段侧壁；
            // 有 bevel 时每两层之间都会生成一圈，倒角轮廓的偏移量已在 `buildLayers` 里算好。
            const baseContour = shape.getPoints(divisions) as Pt2[];
            const layerContours = layers.map((layer) => (layer.offset === 0 ? baseContour : offsetContour(baseContour, layer.offset)));
            const ringStarts: number[] = [];
            for (let li = 0; li < layers.length; li++)
            {
                const contour = layerContours[li];
                const n = contour.length;
                ringStarts.push(positions.length / 3);
                for (let i = 0; i < n; i++)
                {
                    const p = contour[i];
                    const n1 = { x: 0, y: 0 };
                    const n2 = { x: 0, y: 0 };
                    edgeNormal(contour[(i - 1 + n) % n], p, n1);
                    edgeNormal(p, contour[(i + 1) % n], n2);
                    let nx = n1.x + n2.x;
                    let ny = n1.y + n2.y;
                    const nl = Math.sqrt(nx * nx + ny * ny);
                    if (nl > 1e-9) { nx /= nl; ny /= nl; } else { nx = n1.x; ny = n1.y; }
                    positions.push(p.x, p.y, layers[li].z);
                    normals.push(nx, ny, 0);
                    // 侧壁的 uv：u 沿轮廓一圈、v 沿层
                    uvs.push(n > 0 ? i / n : 0, layers.length > 1 ? li / (layers.length - 1) : 0);
                }
            }
            for (let li = 0; li < layers.length - 1; li++)
            {
                const n = layerContours[li].length;
                const s0 = ringStarts[li];
                const s1 = ringStarts[li + 1];
                for (let i = 0; i < n; i++)
                {
                    const j = (i + 1) % n;
                    indices.push(s0 + i, s0 + j, s1 + j, s0 + i, s1 + j, s1 + i);
                }
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices,
        };
    }

    const extrudeComputed = computed(() => buildExtrude());
    const positionsComputed = computed(() => extrudeComputed.value.positions);
    const normalsComputed = computed(() => extrudeComputed.value.normals);
    const uvsComputed = computed(() => extrudeComputed.value.uvs);
    const indicesComputed = computed(() => extrudeComputed.value.indices);
    const colorsComputed = computed(() =>
    {
        const n = positionsComputed.value.length / 3;
        const d = new Float32Array(n * 4);
        d.fill(1);

        return d;
    });
    const tangentsComputed = computed(() => new Float32Array(positionsComputed.value.length));

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positionsComputed, 'float32x3'),
        a_color: computedAttr(colorsComputed, 'float32x4'),
        a_uv: computedAttr(uvsComputed, 'float32x2'),
        a_normal: computedAttr(normalsComputed, 'float32x3'),
        a_tangent: computedAttr(tangentsComputed, 'float32x3'),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: ExtrudeGeometryLogic = {
        get vertices() { return attrTable; },
        get vertexIndices() { return indicesComputed.value; },
        get indices() { return state.indices.value; },
        get draw() { return state.draw.value; },
        get bounding() { return geometryBounding(logic); },
        raycast(ray, shortestCollisionDistance, cullFace) { return geometryRaycast(logic, ray, shortestCollisionDistance, cullFace); },
        beforeRender(renderObject) { geometryBeforeRender(logic, renderObject); },
    };

    return logic;
}
registerLogic('ExtrudeGeometry', extrudeGeometryLogic);
