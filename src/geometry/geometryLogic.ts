import { Box3, Color4, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { reactive } from '@feng3d/reactivity';
import { RenderObject, VertexAttribute } from '@feng3d/webgpu';
import { CullFace } from '../render/data/enums';
import { Index } from '../render/data/Index';
import { applyGeometryRenderData } from '../render/webgpu/MaterialPipeline';
import { logic, registerLogic } from '../core/logic';
import { geometryUtils } from './GeometryUtils';
import type { Geometry } from './Geometry';
import type { CubeGeometry } from '../primitives/CubeGeometry';
import type { PlaneGeometry } from '../primitives/PlaneGeometry';
import type { SphereGeometry } from '../primitives/SphereGeometry';
import type { CylinderGeometry } from '../primitives/CylinderGeometry';
import type { CapsuleGeometry } from '../primitives/CapsuleGeometry';
import type { TorusGeometry } from '../primitives/TorusGeometry';
import type { PointGeometry, PointInfo } from './PointGeometry';
import type { SegmentGeometry, Segment } from './SegmentGeometry';
import type { ParametricGeometry } from '../primitives/ParametricGeometry';

/**
 * Geometry 逻辑处理输出。
 *
 * 顶点数据（_attributes / _indexBuffer / positions / normals / uvs / indices / tangents /
 * colors / skin* / bounding）全部由本 logic 维护；Geometry 接口只保留构造参数。
 *
 * 行为：updateGeometry / beforeRender / bounding / raycast / clone / cloneFrom /
 * addGeometry / applyTransformation / invalidate / clear。
 */
export interface GeometryLogic
{
    /** 顶点属性表（直接使用 webgpu VertexAttribute，data 为 Float32Array） */
    readonly attributes: Record<string, VertexAttribute>;
    /** 索引缓冲 */
    readonly indexBuffer: Index;
    /** 索引数据 */
    indices: number[];
    /** 坐标数据 */
    positions: number[];
    /** 颜色数据 */
    colors: number[];
    /** uv 数据 */
    uvs: number[];
    /** 法线数据 */
    normals: number[];
    /** 切线数据 */
    tangents: number[];
    /** 蒙皮索引 */
    skinIndices: number[];
    /** 蒙皮权重 */
    skinWeights: number[];
    /** 蒙皮索引 1 */
    skinIndices1: number[];
    /** 蒙皮权重 1 */
    skinWeights1: number[];
    /** 顶点数量 */
    readonly numVertex: number;
    /** 三角形数量 */
    readonly numTriangles: number;
    /** 包围盒 */
    bounding: Box3;
    /** 标记需要更新几何体 */
    invalidateGeometry(): void;
    /** 更新几何体（若已失效则触发 buildGeometry） */
    updateGeometry(): void;
    /** 渲染前把顶点/索引/draw 写入 renderObject */
    beforeRender(renderObject: RenderObject): void;
    /** 射线投影 */
    raycast(ray: Ray3, shortestCollisionDistance?: number, cullFace?: CullFace): ReturnType<GeometryUtils['raycast']>;
    /** 克隆（深拷贝顶点数据，复用同一份构造参数） */
    clone(): Geometry;
    /** 从另一个 geometry 克隆顶点数据 */
    cloneFrom(geometry: Geometry): void;
    /** 合并另一个 geometry 的顶点数据（可选变换） */
    addGeometry(geometry: Geometry, transform?: Matrix4x4): void;
    /** 应用变换矩阵到顶点数据 */
    applyTransformation(transform: Matrix4x4): void;
    /** 包围盒失效 */
    invalidateBounds(): void;
    /** 清理顶点数据 */
    clear(): void;
}

// GeometryUtils 的可射线投影方法类型别名（避免 any）
type GeometryUtils = typeof geometryUtils;

/**
 * 获取 Geometry 的 logic（统一 logic 入口的类型化便捷封装）。
 */
export function geometryLogic(geometry: Geometry): GeometryLogic
{
    return logic<GeometryLogic>(geometry);
}

// ---- 默认 Geometry 注册表（惰性创建，避免 import 期副作用） ----

const _defaultGeometrys: Record<string, Geometry> = {};

let _defaultsRegistered = false;
function ensureDefaultGeometrys(): void
{
    if (_defaultsRegistered) return;
    _defaultsRegistered = true;
    // 注意：避免循环 import，工厂通过 require 风格延迟读取
    // 这里直接 import 工厂已在文件末尾注册时完成
    setDefaultGeometry('Cube', createCubeGeometry());
    setDefaultGeometry('Plane', createPlaneGeometry());
    setDefaultGeometry('Sphere', createSphereGeometry());
    setDefaultGeometry('Torus', createTorusGeometry());
    setDefaultGeometry('Quad', createQuadGeometry());
    setDefaultGeometry('Capsule', createCapsuleGeometry());
    setDefaultGeometry('Cylinder', createCylinderGeometry());
    setDefaultGeometry('Cone', createConeGeometry());
}

/**
 * 设置默认几何体。
 *
 * @param name 默认几何体名称
 * @param geometry 默认几何体
 */
export function setDefaultGeometry(name: string, geometry: Geometry): void
{
    _defaultGeometrys[name] = geometry;
}

/**
 * 获取默认几何体。
 *
 * @param name 默认几何体名称
 */
export function getDefaultGeometry(name: string): Geometry
{
    ensureDefaultGeometrys();
    return _defaultGeometrys[name];
}

// ---- 基类 logic 工厂 ----

/**
 * 创建 Geometry 基类 logic。
 *
 * 内部维护默认的 _attributes（9 个 VertexAttribute）、_indexBuffer、_bounding、
 * _geometryInvalid。实现通用行为：beforeRender（applyGeometryRenderData）、bounding
 * （Box3.formPositions）、raycast（geometryUtils.raycast）、clone/cloneFrom/addGeometry/
 * applyTransformation/clear。
 *
 * 子类 logic 工厂应直接调用本函数（不要走 geometryLogic()，避免 _pending 递归），
 * 然后实现自身的 buildGeometry。
 *
 * @param geometry 数据对象
 * @param buildGeometry 子类提供的构建函数（在 updateGeometry 时调用）
 */
export function createBaseGeometryLogic(geometry: Geometry, buildGeometry?: () => void): GeometryLogic
{
    const attributes: Record<string, VertexAttribute> = {
        a_position: { data: new Float32Array([]), format: 'float32x3' },
        a_color: { data: new Float32Array([]), format: 'float32x4' },
        a_uv: { data: new Float32Array([]), format: 'float32x2' },
        a_normal: { data: new Float32Array([]), format: 'float32x3' },
        a_tangent: { data: new Float32Array([]), format: 'float32x3' },
        a_skinIndices: { data: new Float32Array([]), format: 'float32x4' },
        a_skinWeights: { data: new Float32Array([]), format: 'float32x4' },
        a_skinIndices1: { data: new Float32Array([]), format: 'float32x4' },
        a_skinWeights1: { data: new Float32Array([]), format: 'float32x4' },
    };
    const indexBuffer = new Index();
    let geometryInvalid = true;
    let bounding: Box3 = null as any;

    const setAttr = (key: string, value: number[]) =>
    {
        attributes[key].data = new Float32Array(value);
    };

    const logicObj: GeometryLogic = {
        attributes,
        indexBuffer,
        get indices() { logicObj.updateGeometry(); return indexBuffer.indices; },
        set indices(v) { indexBuffer.indices = v; },
        get positions() { return attributes.a_position.data as unknown as number[]; },
        set positions(v) { setAttr('a_position', v); },
        get colors() { return attributes.a_color.data as unknown as number[]; },
        set colors(v) { setAttr('a_color', v); },
        get uvs() { return attributes.a_uv.data as unknown as number[]; },
        set uvs(v) { setAttr('a_uv', v); },
        get normals() { return attributes.a_normal.data as unknown as number[]; },
        set normals(v) { setAttr('a_normal', v); },
        get tangents() { return attributes.a_tangent.data as unknown as number[]; },
        set tangents(v) { setAttr('a_tangent', v); },
        get skinIndices() { return attributes.a_skinIndices.data as unknown as number[]; },
        set skinIndices(v) { setAttr('a_skinIndices', v); },
        get skinWeights() { return attributes.a_skinWeights.data as unknown as number[]; },
        set skinWeights(v) { setAttr('a_skinWeights', v); },
        get skinIndices1() { return attributes.a_skinIndices1.data as unknown as number[]; },
        set skinIndices1(v) { setAttr('a_skinIndices1', v); },
        get skinWeights1() { return attributes.a_skinWeights1.data as unknown as number[]; },
        set skinWeights1(v) { setAttr('a_skinWeights1', v); },
        get numVertex() { return logicObj.positions.length / 3; },
        get numTriangles() { return logicObj.indices.length / 3; },
        get bounding()
        {
            logicObj.updateGeometry();
            if (!bounding)
            {
                const positions = logicObj.positions;
                if (!positions || positions.length === 0)
                {
                    return new Box3();
                }
                bounding = Box3.formPositions(positions);
            }

            return bounding;
        },
        invalidateGeometry()
        {
            geometryInvalid = true;
            logicObj.invalidateBounds();
        },
        updateGeometry()
        {
            if (geometryInvalid)
            {
                geometryInvalid = false;
                buildGeometry?.();
            }
        },
        beforeRender(renderObject: RenderObject)
        {
            logicObj.updateGeometry();
            applyGeometryRenderData(renderObject, logicObj);
        },
        raycast(ray, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE)
        {
            return geometryUtils.raycast(ray, logicObj.indices, logicObj.positions, logicObj.uvs, shortestCollisionDistance, cullFace);
        },
        clone()
        {
            // 通过 __type__ 找到对应工厂创建同类型空数据，再克隆顶点数据
            const cloned = cloneGeometryData(geometry);
            logicObj.cloneFrom(cloned);

            return cloned;
        },
        cloneFrom(source: Geometry)
        {
            const sourceLogic = geometryLogic(source);
            sourceLogic.updateGeometry();
            logicObj.indices = sourceLogic.indices.concat();
            for (const attributeName in sourceLogic.attributes)
            {
                const src = sourceLogic.attributes[attributeName];
                attributes[attributeName].data = new Float32Array(src.data as Float32Array);
            }
        },
        addGeometry(source: Geometry, transform?: Matrix4x4)
        {
            logicObj.updateGeometry();
            const sourceLogic = geometryLogic(source);
            sourceLogic.updateGeometry();
            let other = sourceLogic;
            if (transform)
            {
                const cloned = sourceLogic.clone();
                geometryLogic(cloned).applyTransformation(transform);
                other = geometryLogic(cloned);
            }

            // 自身为空时直接克隆
            if (!logicObj.indices || logicObj.indices.length === 0)
            {
                logicObj.cloneFrom(source);

                return;
            }

            const oldNumVertex = logicObj.numVertex;
            // 合并索引
            const selfIndices = logicObj.indices;
            const otherIndices = other.indices;
            const totalIndices = selfIndices.concat();
            for (let i = 0; i < otherIndices.length; i++)
            {
                totalIndices[selfIndices.length + i] = otherIndices[i] + oldNumVertex;
            }
            logicObj.indices = totalIndices;
            // 合并属性
            for (const attributeName in attributes)
            {
                const selfAttr = attributes[attributeName];
                const otherAttr = other.attributes[attributeName];
                selfAttr.data = new Float32Array(
                    Array.from(selfAttr.data as Float32Array).concat(Array.from(otherAttr.data as Float32Array))
                );
            }
        },
        applyTransformation(transform: Matrix4x4)
        {
            logicObj.updateGeometry();
            const vertices = logicObj.positions;
            const normals = logicObj.normals;
            const tangents = logicObj.tangents;
            geometryUtils.applyTransformation(transform, vertices, normals, tangents);
            logicObj.positions = vertices;
            logicObj.normals = normals;
            logicObj.tangents = tangents;
        },
        invalidateBounds() { bounding = null as any; },
        clear()
        {
            for (const key in attributes)
            {
                attributes[key].data = new Float32Array([]);
            }
        },
    };

    return logicObj;
}

// 按 __type__ 克隆一份同类型空数据（用于 clone 时构造新实例）
function cloneGeometryData(geometry: Geometry): Geometry
{
    const fn = _cloneFactories.get(geometry.__type__);
    if (!fn) throw new Error(`未注册 ${geometry.__type__} 的克隆工厂`);
    const cloned = fn(geometry);

    return cloned;
}

// 子类注册"按数据克隆"工厂（避免依赖 class 构造器）
const _cloneFactories = new Map<string, (src: any) => Geometry>();

// ---- CubeGeometry logic ----

function createCubeGeometryLogic(geometry: CubeGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildCube(geometry, base));
    watchGeometryInvalid(geometry, ['width', 'height', 'depth', 'segmentsW', 'segmentsH', 'segmentsD', 'tile6'], base);

    return base;
}

function buildCube(g: CubeGeometry, lg: GeometryLogic): void
{
    lg.positions = buildCubePosition(g);
    lg.normals = buildCubeNormal(g);
    lg.tangents = buildCubeTangent(g);
    lg.uvs = buildCubeUVs(g);
    lg.indices = buildCubeIndices(g);
}

function buildCubePosition(g: CubeGeometry): number[]
{
    const data: number[] = [];
    let i: number; let j: number; let outerPos: number; let positionIndex = 0;
    const hw = g.width / 2; const hh = g.height / 2; const hd = g.depth / 2;
    const dw = g.width / g.segmentsW; const dh = g.height / g.segmentsH; const dd = g.depth / g.segmentsD;
    for (i = 0; i <= g.segmentsW; i++)
    {
        outerPos = -hw + i * dw;
        for (j = 0; j <= g.segmentsH; j++)
        {
            data[positionIndex++] = outerPos;
            data[positionIndex++] = -hh + j * dh;
            data[positionIndex++] = -hd;
            data[positionIndex++] = outerPos;
            data[positionIndex++] = -hh + j * dh;
            data[positionIndex++] = hd;
        }
    }
    for (i = 0; i <= g.segmentsW; i++)
    {
        outerPos = -hw + i * dw;
        for (j = 0; j <= g.segmentsD; j++)
        {
            data[positionIndex++] = outerPos;
            data[positionIndex++] = hh;
            data[positionIndex++] = -hd + j * dd;
            data[positionIndex++] = outerPos;
            data[positionIndex++] = -hh;
            data[positionIndex++] = -hd + j * dd;
        }
    }
    for (i = 0; i <= g.segmentsD; i++)
    {
        outerPos = hd - i * dd;
        for (j = 0; j <= g.segmentsH; j++)
        {
            data[positionIndex++] = -hw;
            data[positionIndex++] = -hh + j * dh;
            data[positionIndex++] = outerPos;
            data[positionIndex++] = hw;
            data[positionIndex++] = -hh + j * dh;
            data[positionIndex++] = outerPos;
        }
    }

    return data;
}

function buildCubeNormal(g: CubeGeometry): number[]
{
    const data: number[] = [];
    let i: number; let j: number; let idx = 0;
    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        data[idx++] = 0; data[idx++] = 0; data[idx++] = -1;
        data[idx++] = 0; data[idx++] = 0; data[idx++] = 1;
    }
    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
    {
        data[idx++] = 0; data[idx++] = 1; data[idx++] = 0;
        data[idx++] = 0; data[idx++] = -1; data[idx++] = 0;
    }
    for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        data[idx++] = -1; data[idx++] = 0; data[idx++] = 0;
        data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
    }

    return data;
}

function buildCubeTangent(g: CubeGeometry): number[]
{
    const data: number[] = [];
    let i: number; let j: number; let idx = 0;
    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
        data[idx++] = -1; data[idx++] = 0; data[idx++] = 0;
    }
    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
    {
        data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
        data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
    }
    for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        data[idx++] = 0; data[idx++] = 0; data[idx++] = -1;
        data[idx++] = 0; data[idx++] = 0; data[idx++] = 1;
    }

    return data;
}

function buildCubeIndices(g: CubeGeometry): number[]
{
    const indices: number[] = [];
    let tl: number; let tr: number; let bl: number; let br: number;
    let i: number; let j: number; let inc = 0; let fidx = 0;

    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        if (i && j)
        {
            tl = 2 * ((i - 1) * (g.segmentsH + 1) + (j - 1));
            tr = 2 * (i * (g.segmentsH + 1) + (j - 1));
            bl = tl + 2; br = tr + 2;
            indices[fidx++] = tl; indices[fidx++] = bl; indices[fidx++] = br;
            indices[fidx++] = tl; indices[fidx++] = br; indices[fidx++] = tr;
            indices[fidx++] = tr + 1; indices[fidx++] = br + 1; indices[fidx++] = bl + 1;
            indices[fidx++] = tr + 1; indices[fidx++] = bl + 1; indices[fidx++] = tl + 1;
        }
    }
    inc += 2 * (g.segmentsW + 1) * (g.segmentsH + 1);

    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
    {
        if (i && j)
        {
            tl = inc + 2 * ((i - 1) * (g.segmentsD + 1) + (j - 1));
            tr = inc + 2 * (i * (g.segmentsD + 1) + (j - 1));
            bl = tl + 2; br = tr + 2;
            indices[fidx++] = tl; indices[fidx++] = bl; indices[fidx++] = br;
            indices[fidx++] = tl; indices[fidx++] = br; indices[fidx++] = tr;
            indices[fidx++] = tr + 1; indices[fidx++] = br + 1; indices[fidx++] = bl + 1;
            indices[fidx++] = tr + 1; indices[fidx++] = bl + 1; indices[fidx++] = tl + 1;
        }
    }
    inc += 2 * (g.segmentsW + 1) * (g.segmentsD + 1);

    for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        if (i && j)
        {
            tl = inc + 2 * ((i - 1) * (g.segmentsH + 1) + (j - 1));
            tr = inc + 2 * (i * (g.segmentsH + 1) + (j - 1));
            bl = tl + 2; br = tr + 2;
            indices[fidx++] = tl; indices[fidx++] = bl; indices[fidx++] = br;
            indices[fidx++] = tl; indices[fidx++] = br; indices[fidx++] = tr;
            indices[fidx++] = tr + 1; indices[fidx++] = br + 1; indices[fidx++] = bl + 1;
            indices[fidx++] = tr + 1; indices[fidx++] = bl + 1; indices[fidx++] = tl + 1;
        }
    }

    return indices;
}

function buildCubeUVs(g: CubeGeometry): number[]
{
    let i: number; let j: number; let uidx = 0;
    const data: number[] = [];
    let uTileDim: number; let vTileDim: number; let uTileStep: number; let vTileStep: number;
    let tl0u: number; let tl0v: number; let tl1u: number; let tl1v: number; let du: number; let dv: number;

    if (g.tile6)
    {
        uTileDim = uTileStep = 1 / 3;
        vTileDim = vTileStep = 1 / 2;
    }
    else
    {
        uTileDim = vTileDim = 1;
        uTileStep = vTileStep = 0;
    }

    tl0u = Number(uTileStep); tl0v = Number(vTileStep);
    tl1u = 2 * uTileStep; tl1v = 0 * vTileStep;
    du = uTileDim / g.segmentsW; dv = vTileDim / g.segmentsH;
    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        data[uidx++] = tl0u + i * du;
        data[uidx++] = tl0v + (vTileDim - j * dv);
        data[uidx++] = tl1u + (uTileDim - i * du);
        data[uidx++] = tl1v + (vTileDim - j * dv);
    }

    tl0u = Number(uTileStep); tl0v = 0 * vTileStep;
    tl1u = 0 * uTileStep; tl1v = 0 * vTileStep;
    du = uTileDim / g.segmentsW; dv = vTileDim / g.segmentsD;
    for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
    {
        data[uidx++] = tl0u + i * du;
        data[uidx++] = tl0v + (vTileDim - j * dv);
        data[uidx++] = tl1u + i * du;
        data[uidx++] = tl1v + j * dv;
    }

    tl0u = 0 * uTileStep; tl0v = Number(vTileStep);
    tl1u = 2 * uTileStep; tl1v = Number(vTileStep);
    du = uTileDim / g.segmentsD; dv = vTileDim / g.segmentsH;
    for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
    {
        data[uidx++] = tl0u + i * du;
        data[uidx++] = tl0v + (vTileDim - j * dv);
        data[uidx++] = tl1u + (uTileDim - i * du);
        data[uidx++] = tl1v + (vTileDim - j * dv);
    }

    return data;
}

// ---- PlaneGeometry logic ----

function createPlaneGeometryLogic(geometry: PlaneGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildPlane(geometry, base));
    watchGeometryInvalid(geometry, ['width', 'height', 'segmentsW', 'segmentsH', 'yUp'], base);

    return base;
}

function buildPlane(g: PlaneGeometry, lg: GeometryLogic): void
{
    const positions: number[] = [];
    const normals: number[] = [];
    const tangents: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const tw = g.segmentsW + 1;
    let pi = 0; let ni = 0; let ti = 0; let ui = 0; let ii = 0;

    for (let yi = 0; yi <= g.segmentsH; ++yi)
    {
        for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            const x = (xi / g.segmentsW - 0.5) * g.width;
            const y = (yi / g.segmentsH - 0.5) * g.height;
            positions[pi++] = x;
            if (g.yUp) { positions[pi++] = 0; positions[pi++] = y; }
            else { positions[pi++] = y; positions[pi++] = 0; }

            normals[ni++] = 0;
            if (g.yUp) { normals[ni++] = 1; normals[ni++] = 0; }
            else { normals[ni++] = 0; normals[ni++] = 1; }

            if (g.yUp) { tangents[ti++] = 1; tangents[ti++] = 0; tangents[ti++] = 0; }
            else { tangents[ti++] = -1; tangents[ti++] = 0; tangents[ti++] = 0; }

            if (g.yUp) { uvs[ui++] = xi / g.segmentsW; uvs[ui++] = 1 - yi / g.segmentsH; }
            else { uvs[ui++] = 1 - xi / g.segmentsW; uvs[ui++] = 1 - yi / g.segmentsH; }

            if (xi !== g.segmentsW && yi !== g.segmentsH)
            {
                const b = xi + yi * tw;
                if (g.yUp)
                {
                    indices[ii++] = b; indices[ii++] = b + tw; indices[ii++] = b + tw + 1;
                    indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + 1;
                }
                else
                {
                    indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + tw;
                    indices[ii++] = b; indices[ii++] = b + 1; indices[ii++] = b + tw + 1;
                }
            }
        }
    }

    lg.positions = positions;
    lg.normals = normals;
    lg.tangents = tangents;
    lg.uvs = uvs;
    lg.indices = indices;
}

// ---- SphereGeometry logic ----

function createSphereGeometryLogic(geometry: SphereGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildSphere(geometry, base));
    watchGeometryInvalid(geometry, ['radius', 'segmentsW', 'segmentsH', 'yUp'], base);

    return base;
}

function buildSphere(g: SphereGeometry, lg: GeometryLogic): void
{
    const vertexPositionData: number[] = [];
    const vertexNormalData: number[] = [];
    const vertexTangentData: number[] = [];

    let startIndex: number; let index = 0;
    let comp1: number; let comp2: number; let t1: number; let t2: number;
    for (let yi = 0; yi <= g.segmentsH; ++yi)
    {
        startIndex = index;
        const horangle = Math.PI * yi / g.segmentsH;
        const z = -g.radius * Math.cos(horangle);
        const ringradius = g.radius * Math.sin(horangle);

        for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            const verangle = 2 * Math.PI * xi / g.segmentsW;
            const x = ringradius * Math.cos(verangle);
            const y = ringradius * Math.sin(verangle);
            const normLen = 1 / Math.sqrt(x * x + y * y + z * z);
            const tanLen = Math.sqrt(y * y + x * x);

            if (g.yUp) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; comp1 = -z; comp2 = y; }
            else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; comp1 = y; comp2 = z; }

            if (xi === g.segmentsW)
            {
                vertexPositionData[index] = vertexPositionData[startIndex];
                vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                vertexNormalData[index] = vertexNormalData[startIndex] + x * normLen * 0.5;
                vertexNormalData[index + 1] = vertexNormalData[startIndex + 1] + comp1 * normLen * 0.5;
                vertexNormalData[index + 2] = vertexNormalData[startIndex + 2] + comp2 * normLen * 0.5;

                vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                vertexTangentData[index + 1] = t1;
                vertexTangentData[index + 2] = t2;
            }
            else
            {
                vertexPositionData[index] = x;
                vertexPositionData[index + 1] = comp1;
                vertexPositionData[index + 2] = comp2;

                vertexNormalData[index] = x * normLen;
                vertexNormalData[index + 1] = comp1 * normLen;
                vertexNormalData[index + 2] = comp2 * normLen;

                vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                vertexTangentData[index + 1] = t1;
                vertexTangentData[index + 2] = t2;
            }

            if (xi > 0 && yi > 0)
            {
                if (yi === g.segmentsH)
                {
                    vertexPositionData[index] = vertexPositionData[startIndex];
                    vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                    vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                }
            }

            index += 3;
        }
    }

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.uvs = buildSphereUVs(g);
    lg.indices = buildSphereIndices(g);
}

function buildSphereIndices(g: SphereGeometry): number[]
{
    const indices: number[] = [];
    let n = 0;
    for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
    {
        if (xi > 0 && yi > 0)
        {
            const a = (g.segmentsW + 1) * yi + xi;
            const b = (g.segmentsW + 1) * yi + xi - 1;
            const c = (g.segmentsW + 1) * (yi - 1) + xi - 1;
            const d = (g.segmentsW + 1) * (yi - 1) + xi;
            if (yi === g.segmentsH) { indices[n++] = a; indices[n++] = c; indices[n++] = d; }
            else if (yi === 1) { indices[n++] = a; indices[n++] = b; indices[n++] = c; }
            else
            {
                indices[n++] = a; indices[n++] = b; indices[n++] = c;
                indices[n++] = a; indices[n++] = c; indices[n++] = d;
            }
        }
    }

    return indices;
}

function buildSphereUVs(g: SphereGeometry): number[]
{
    const data: number[] = [];
    let index = 0;
    for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
    {
        data[index++] = xi / g.segmentsW;
        data[index++] = yi / g.segmentsH;
    }

    return data;
}

// ---- CapsuleGeometry logic ----

function createCapsuleGeometryLogic(geometry: CapsuleGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildCapsule(geometry, base));
    watchGeometryInvalid(geometry, ['radius', 'height', 'segmentsW', 'segmentsH', 'yUp'], base);

    return base;
}

function buildCapsule(g: CapsuleGeometry, lg: GeometryLogic): void
{
    const vertexPositionData: number[] = [];
    const vertexNormalData: number[] = [];
    const vertexTangentData: number[] = [];

    let startIndex: number; let index = 0;
    let comp1: number; let comp2: number; let t1: number; let t2: number;
    for (let yi = 0; yi <= g.segmentsH; ++yi)
    {
        startIndex = index;
        const horangle = Math.PI * yi / g.segmentsH;
        const z = -g.radius * Math.cos(horangle);
        const ringradius = g.radius * Math.sin(horangle);

        for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            const verangle = 2 * Math.PI * xi / g.segmentsW;
            const x = ringradius * Math.cos(verangle);
            const y = ringradius * Math.sin(verangle);
            const normLen = 1 / Math.sqrt(x * x + y * y + z * z);
            const tanLen = Math.sqrt(y * y + x * x);
            const offset = yi > g.segmentsH / 2 ? g.height / 2 : -g.height / 2;

            if (g.yUp) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; comp1 = -z; comp2 = y; }
            else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; comp1 = y; comp2 = z; }

            if (xi === g.segmentsW)
            {
                vertexPositionData[index] = vertexPositionData[startIndex];
                vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;

                vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > 0.007 ? -y / tanLen : 1) * 0.5;
                vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
            }
            else
            {
                vertexPositionData[index] = x;
                vertexPositionData[index + 1] = g.yUp ? comp1 - offset : comp1;
                vertexPositionData[index + 2] = g.yUp ? comp2 : comp2 + offset;

                vertexNormalData[index] = x * normLen;
                vertexNormalData[index + 1] = comp1 * normLen;
                vertexNormalData[index + 2] = comp2 * normLen;

                vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                vertexTangentData[index + 1] = t1;
                vertexTangentData[index + 2] = t2;
            }

            if (xi > 0 && yi > 0)
            {
                if (yi === g.segmentsH)
                {
                    vertexPositionData[index] = vertexPositionData[startIndex];
                    vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                    vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                }
            }

            index += 3;
        }
    }

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.uvs = buildCapsuleUVs(g);
    lg.indices = buildCapsuleIndices(g);
}

function buildCapsuleIndices(g: CapsuleGeometry): number[]
{
    const indices: number[] = [];
    let n = 0;
    for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
    {
        if (xi > 0 && yi > 0)
        {
            const a = (g.segmentsW + 1) * yi + xi;
            const b = (g.segmentsW + 1) * yi + xi - 1;
            const c = (g.segmentsW + 1) * (yi - 1) + xi - 1;
            const d = (g.segmentsW + 1) * (yi - 1) + xi;
            if (yi === g.segmentsH) { indices[n++] = a; indices[n++] = c; indices[n++] = d; }
            else if (yi === 1) { indices[n++] = a; indices[n++] = b; indices[n++] = c; }
            else
            {
                indices[n++] = a; indices[n++] = b; indices[n++] = c;
                indices[n++] = a; indices[n++] = c; indices[n++] = d;
            }
        }
    }

    return indices;
}

function buildCapsuleUVs(g: CapsuleGeometry): number[]
{
    const data: number[] = [];
    let index = 0;
    for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
    {
        data[index++] = xi / g.segmentsW;
        data[index++] = yi / g.segmentsH;
    }

    return data;
}

// ---- CylinderGeometry logic（同时服务 ConeGeometry） ----

function createCylinderGeometryLogic(geometry: CylinderGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildCylinder(geometry, base));
    watchGeometryInvalid(geometry, ['topRadius', 'bottomRadius', 'height', 'segmentsW', 'segmentsH', 'topClosed', 'bottomClosed', 'surfaceClosed', 'yUp'], base);

    return base;
}

function buildCylinder(g: CylinderGeometry, lg: GeometryLogic): void
{
    let i: number; let j: number; let index = 0;
    let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;
    let comp1: number; let comp2: number; let startIndex = 0; let t1: number; let t2: number;

    const vertexPositionData: number[] = [];
    const vertexNormalData: number[] = [];
    const vertexTangentData: number[] = [];

    const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;

    const addVertex = (px: number, py: number, pz: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number) =>
    {
        vertexPositionData[index] = px; vertexPositionData[index + 1] = py; vertexPositionData[index + 2] = pz;
        vertexNormalData[index] = nx; vertexNormalData[index + 1] = ny; vertexNormalData[index + 2] = nz;
        vertexTangentData[index] = tx; vertexTangentData[index + 1] = ty; vertexTangentData[index + 2] = tz;
        index += 3;
    };

    // 顶部
    if (g.topClosed && g.topRadius > 0)
    {
        z = -0.5 * g.height;
        for (i = 0; i <= g.segmentsW; ++i)
        {
            if (g.yUp) { t1 = 1; t2 = 0; comp1 = -z; comp2 = 0; }
            else { t1 = 0; t2 = -1; comp1 = 0; comp2 = z; }
            addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
            revolutionAngle = i * revolutionAngleDelta;
            x = g.topRadius * Math.cos(revolutionAngle);
            y = g.topRadius * Math.sin(revolutionAngle);
            if (g.yUp) { comp1 = -z; comp2 = y; }
            else { comp1 = y; comp2 = z; }
            if (i === g.segmentsW)
            {
                addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5], 0, t1, t2, 1, 0, 0);
            }
            else
            {
                addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
            }
        }
    }

    // 底部
    if (g.bottomClosed && g.bottomRadius > 0)
    {
        z = 0.5 * g.height;
        startIndex = index;
        for (i = 0; i <= g.segmentsW; ++i)
        {
            if (g.yUp) { t1 = -1; t2 = 0; comp1 = -z; comp2 = 0; }
            else { t1 = 0; t2 = 1; comp1 = 0; comp2 = z; }
            addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
            revolutionAngle = i * revolutionAngleDelta;
            x = g.bottomRadius * Math.cos(revolutionAngle);
            y = g.bottomRadius * Math.sin(revolutionAngle);
            if (g.yUp) { comp1 = -z; comp2 = y; }
            else { comp1 = y; comp2 = z; }
            if (i === g.segmentsW)
            {
                addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], 0, t1, t2, 1, 0, 0);
            }
            else
            {
                addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
            }
        }
    }

    // 侧面
    const dr = g.bottomRadius - g.topRadius;
    const latNormElev = dr / g.height;
    const latNormBase = (latNormElev === 0) ? 1 : g.height / dr;

    if (g.surfaceClosed)
    {
        let na0: number; let na1: number; let naComp1: number; let naComp2: number;
        for (j = 0; j <= g.segmentsH; ++j)
        {
            radius = g.topRadius - ((j / g.segmentsH) * (g.topRadius - g.bottomRadius));
            z = -(g.height / 2) + (j / g.segmentsH * g.height);
            startIndex = index;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = radius * Math.cos(revolutionAngle);
                y = radius * Math.sin(revolutionAngle);
                na0 = latNormBase * Math.cos(revolutionAngle);
                na1 = latNormBase * Math.sin(revolutionAngle);
                if (g.yUp)
                {
                    t1 = 0; t2 = -na0; comp1 = -z; comp2 = y;
                    naComp1 = latNormElev; naComp2 = na1;
                }
                else
                {
                    t1 = -na0; t2 = 0; comp1 = y; comp2 = z;
                    naComp1 = na1; naComp2 = latNormElev;
                }
                if (i === g.segmentsW)
                {
                    addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2],
                        na0, latNormElev, na1, na1, t1, t2);
                }
                else
                {
                    addVertex(x, comp1, comp2, na0, naComp1, naComp2, -na1, t1, t2);
                }
            }
        }
    }

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.uvs = buildCylinderUVs(g);
    lg.indices = buildCylinderIndices(g);
}

function buildCylinderIndices(g: CylinderGeometry): number[]
{
    let i: number; let j: number; let index = 0;
    const indices: number[] = [];
    let n = 0;
    const addTriangleClockWise = (cwVertexIndex0: number, cwVertexIndex1: number, cwVertexIndex2: number) =>
    {
        indices[n++] = cwVertexIndex0;
        indices[n++] = cwVertexIndex1;
        indices[n++] = cwVertexIndex2;
    };

    if (g.topClosed && g.topRadius > 0)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            index += 2;
            if (i > 0) addTriangleClockWise(index - 1, index - 3, index - 2);
        }
    }
    if (g.bottomClosed && g.bottomRadius > 0)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            index += 2;
            if (i > 0) addTriangleClockWise(index - 2, index - 3, index - 1);
        }
    }
    if (g.surfaceClosed)
    {
        let a: number; let b: number; let c: number; let d: number;
        for (j = 0; j <= g.segmentsH; ++j) for (i = 0; i <= g.segmentsW; ++i)
        {
            index++;
            if (i > 0 && j > 0)
            {
                a = index - 1; b = index - 2;
                c = b - g.segmentsW - 1; d = a - g.segmentsW - 1;
                addTriangleClockWise(a, b, c);
                addTriangleClockWise(a, c, d);
            }
        }
    }

    return indices;
}

function buildCylinderUVs(g: CylinderGeometry): number[]
{
    let i: number; let j: number; let x: number; let y: number; let revolutionAngle: number;
    const data: number[] = [];
    const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;
    let index = 0;
    if (g.topClosed)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            revolutionAngle = i * revolutionAngleDelta;
            x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
            y = 0.5 + 0.5 * Math.sin(revolutionAngle);
            data[index++] = 0.5; data[index++] = 0.5;
            data[index++] = x; data[index++] = y;
        }
    }
    if (g.bottomClosed)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            revolutionAngle = i * revolutionAngleDelta;
            x = 0.5 + 0.5 * Math.cos(revolutionAngle);
            y = 0.5 + 0.5 * Math.sin(revolutionAngle);
            data[index++] = 0.5; data[index++] = 0.5;
            data[index++] = x; data[index++] = y;
        }
    }
    if (g.surfaceClosed)
    {
        for (j = 0; j <= g.segmentsH; ++j) for (i = 0; i <= g.segmentsW; ++i)
        {
            data[index++] = (i / g.segmentsW);
            data[index++] = (j / g.segmentsH);
        }
    }

    return data;
}

// ---- TorusGeometry logic ----

function createTorusGeometryLogic(geometry: TorusGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildTorus(geometry, base));
    watchGeometryInvalid(geometry, ['radius', 'tubeRadius', 'segmentsR', 'segmentsT', 'yUp'], base);

    return base;
}

function buildTorus(g: TorusGeometry, lg: GeometryLogic): void
{
    let i: number; let j: number;
    let x: number; let y: number; let z: number; let nx: number; let ny: number; let nz: number; let revolutionAngleR: number; let revolutionAngleT: number;
    const vertexPositionStride = 3;
    const numVertices = (g.segmentsT + 1) * (g.segmentsR + 1);

    const vertexPositionData: number[] = new Array(numVertices * vertexPositionStride);
    const vertexNormalData: number[] = new Array(numVertices * vertexPositionStride);
    const vertexTangentData: number[] = new Array(numVertices * vertexPositionStride);
    const rawIndices: number[] = [];

    const addVertex = (vertexIndex: number, px: number, py: number, pz: number, nxv: number, nyv: number, nzv: number, tx: number, ty: number, tz: number) =>
    {
        vertexPositionData[vertexIndex * vertexPositionStride] = px;
        vertexPositionData[vertexIndex * vertexPositionStride + 1] = py;
        vertexPositionData[vertexIndex * vertexPositionStride + 2] = pz;
        vertexNormalData[vertexIndex * vertexPositionStride] = nxv;
        vertexNormalData[vertexIndex * vertexPositionStride + 1] = nyv;
        vertexNormalData[vertexIndex * vertexPositionStride + 2] = nzv;
        vertexTangentData[vertexIndex * vertexPositionStride] = tx;
        vertexTangentData[vertexIndex * vertexPositionStride + 1] = ty;
        vertexTangentData[vertexIndex * vertexPositionStride + 2] = tz;
    };

    const revolutionAngleDeltaR = 2 * Math.PI / g.segmentsR;
    const revolutionAngleDeltaT = 2 * Math.PI / g.segmentsT;

    let comp1: number; let comp2: number; let t1: number; let t2: number; let n1: number; let n2: number;
    let startPositionIndex: number; let a: number; let b: number; let c: number; let d: number; let length: number;
    let currentTriangleIndex = 0;

    for (j = 0; j <= g.segmentsT; ++j)
    {
        startPositionIndex = j * (g.segmentsR + 1) * vertexPositionStride;
        for (i = 0; i <= g.segmentsR; ++i)
        {
            const vertexIndex = j * (g.segmentsR + 1) + i;
            revolutionAngleR = i * revolutionAngleDeltaR;
            revolutionAngleT = j * revolutionAngleDeltaT;
            length = Math.cos(revolutionAngleT);
            nx = length * Math.cos(revolutionAngleR);
            ny = length * Math.sin(revolutionAngleR);
            nz = Math.sin(revolutionAngleT);
            x = g.radius * Math.cos(revolutionAngleR) + g.tubeRadius * nx;
            y = g.radius * Math.sin(revolutionAngleR) + g.tubeRadius * ny;
            z = (j === g.segmentsT) ? 0 : g.tubeRadius * nz;
            if (g.yUp)
            {
                n1 = -nz; n2 = ny; t1 = 0;
                t2 = (length ? nx / length : x / g.radius);
                comp1 = -z; comp2 = y;
            }
            else
            {
                n1 = ny; n2 = nz;
                t1 = (length ? nx / length : x / g.radius);
                t2 = 0; comp1 = y; comp2 = z;
            }
            if (i === g.segmentsR)
            {
                addVertex(vertexIndex, x, vertexPositionData[startPositionIndex + 1], vertexPositionData[startPositionIndex + 2], nx, n1, n2, -(length ? ny / length : y / g.radius), t1, t2);
            }
            else
            {
                addVertex(vertexIndex, x, comp1, comp2, nx, n1, n2, -(length ? ny / length : y / g.radius), t1, t2);
            }
            if (i > 0 && j > 0)
            {
                a = vertexIndex; b = vertexIndex - 1;
                c = b - g.segmentsR - 1; d = a - g.segmentsR - 1;
                rawIndices[currentTriangleIndex * 3] = a;
                rawIndices[currentTriangleIndex * 3 + 1] = b;
                rawIndices[currentTriangleIndex * 3 + 2] = c;
                currentTriangleIndex++;
                rawIndices[currentTriangleIndex * 3] = a;
                rawIndices[currentTriangleIndex * 3 + 1] = c;
                rawIndices[currentTriangleIndex * 3 + 2] = d;
                currentTriangleIndex++;
            }
        }
    }

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.indices = rawIndices;
    lg.uvs = buildTorusUVs(g);
}

function buildTorusUVs(g: TorusGeometry): number[]
{
    let i: number; let j: number;
    const stride = 2;
    const data: number[] = [];
    let index = 0;
    for (j = 0; j <= g.segmentsT; ++j) for (i = 0; i <= g.segmentsR; ++i)
    {
        index = j * (g.segmentsR + 1) + i;
        data[index * stride] = i / g.segmentsR;
        data[index * stride + 1] = j / g.segmentsT;
    }

    return data;
}

// ---- QuadGeometry logic ----

function createQuadGeometryLogic(geometry: Geometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildQuad(base));

    return base;
}

function buildQuad(lg: GeometryLogic): void
{
    const size = 0.5;
    lg.positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
    lg.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    lg.indices = [0, 1, 2, 0, 2, 3];
    lg.normals = geometryUtils.createVertexNormals(lg.indices, lg.positions, true);
    lg.tangents = geometryUtils.createVertexTangents(lg.indices, lg.positions, lg.uvs, true);
}

// ---- PointGeometry logic ----

function createPointGeometryLogic(geometry: PointGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildPoint(geometry, base));
    watchGeometryInvalid(geometry, ['points'], base);

    return base;
}

function buildPoint(g: PointGeometry, lg: GeometryLogic): void
{
    let numPoints = g.points.length;
    const indices: number[] = [];
    const positionData: number[] = [];
    const normalData: number[] = [];
    const uvData: number[] = [];
    const colors: number[] = [];
    numPoints = Math.max(1, numPoints);

    for (let i = 0; i < numPoints; i++)
    {
        const element = g.points[i];
        const position = (element && element.position) || Vector3.ZERO;
        const color = (element && element.color) || Color4.WHITE;
        const normal = (element && element.normal) || Vector3.ZERO;
        const uv = (element && element.uv) || Vector2.zero;
        indices[i] = i;
        positionData.push(position.x, position.y, position.z);
        normalData.push(normal.x, normal.y, normal.z);
        uvData.push(uv.x, uv.y);
        colors.push(color.r, color.g, color.b, color.a);
    }
    lg.positions = positionData;
    lg.uvs = uvData;
    lg.normals = normalData;
    lg.indices = indices;
    lg.colors = colors;
}

// ---- SegmentGeometry logic ----

function createSegmentGeometryLogic(geometry: SegmentGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildSegment(geometry, base));
    watchGeometryInvalid(geometry, ['segments'], base);

    return base;
}

function buildSegment(g: SegmentGeometry, lg: GeometryLogic): void
{
    let numSegments = g.segments.length;
    numSegments = Math.max(1, numSegments);
    const indices: number[] = [];
    const positionData: number[] = [];
    const colorData: number[] = [];
    for (let i = 0; i < numSegments; i++)
    {
        const element = g.segments[i];
        const start = (element && element.start) || new Vector3();
        const end = (element && element.end) || new Vector3();
        const startColor = (element && element.startColor) || new Color4();
        const endColor = (element && element.endColor) || new Color4();
        indices.push(i * 2, i * 2 + 1);
        positionData.push(start.x, start.y, start.z, end.x, end.y, end.z);
        colorData.push(startColor.r, startColor.g, startColor.b, startColor.a,
            endColor.r, endColor.g, endColor.b, endColor.a);
    }
    lg.positions = positionData;
    lg.colors = colorData;
    lg.indices = indices;
}

// ---- CustomGeometry logic ----

function createCustomGeometryLogic(geometry: Geometry): GeometryLogic
{
    // CustomGeometry 没有自身 buildGeometry，数据由外部直接 set 到 logic 上
    return createBaseGeometryLogic(geometry);
}

// ---- ParametricGeometry logic ----

function createParametricGeometryLogic(geometry: ParametricGeometry): GeometryLogic
{
    const base = createBaseGeometryLogic(geometry, () => buildParametric(geometry, base));

    return base;
}

function buildParametric(g: ParametricGeometry, lg: GeometryLogic): void
{
    const func = (g as any).__func as ((u: number, v: number) => Vector3) | undefined;
    const slices = (g as any).__slices as number | undefined;
    const stacks = (g as any).__stacks as number | undefined;
    const doubleside = (g as any).__doubleside as boolean | undefined;
    if (!func || slices == null || stacks == null) return;

    let positions: number[] = [];
    const indices: number[] = [];
    let uvs: number[] = [];
    const sliceCount = slices + 1;
    for (let i = 0; i <= stacks; i++)
    {
        const v = i / stacks;
        for (let j = 0; j <= slices; j++)
        {
            const u = j / slices;
            uvs.push(u, v);
            const p = func(u, v);
            positions.push(p.x, p.y, p.z);
            if (i < stacks && j < slices)
            {
                const a = i * sliceCount + j;
                const b = i * sliceCount + j + 1;
                const c = (i + 1) * sliceCount + j + 1;
                const d = (i + 1) * sliceCount + j;
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
    }
    if (doubleside)
    {
        positions = positions.concat(positions);
        uvs = uvs.concat(uvs);
        const start = (stacks + 1) * (slices + 1);
        for (let i = 0, n = indices.length; i < n; i += 3)
        {
            indices.push(start + indices[i], start + indices[i + 2], start + indices[i + 1]);
        }
    }
    lg.indices = indices;
    lg.positions = positions;
    lg.uvs = uvs;
    lg.normals = geometryUtils.createVertexNormals(lg.indices, lg.positions, true);
    lg.tangents = geometryUtils.createVertexTangents(lg.indices, lg.positions, lg.uvs, true);
}

// ---- 响应式失效监听（参数变化触发 invalidateGeometry） ----

import { effect } from '@feng3d/reactivity';
function watchGeometryInvalid(geometry: Geometry, keys: string[], lg: GeometryLogic): void
{
    const rg = reactive(geometry as any);
    for (const key of keys)
    {
        effect(() =>
        {
            // 读取以建立依赖
            void rg[key];
            lg.invalidateGeometry();
        });
    }
}

// ---- 注册到 logic 分发表 ----

registerLogic('Geometry', createBaseGeometryLogic as any);
registerLogic('CubeGeometry', createCubeGeometryLogic);
registerLogic('PlaneGeometry', createPlaneGeometryLogic);
registerLogic('SphereGeometry', createSphereGeometryLogic);
registerLogic('CapsuleGeometry', createCapsuleGeometryLogic);
registerLogic('CylinderGeometry', createCylinderGeometryLogic);
registerLogic('ConeGeometry', createCylinderGeometryLogic);
registerLogic('TorusGeometry', createTorusGeometryLogic);
registerLogic('QuadGeometry', createQuadGeometryLogic);
registerLogic('PointGeometry', createPointGeometryLogic);
registerLogic('SegmentGeometry', createSegmentGeometryLogic);
registerLogic('CustomGeometry', createCustomGeometryLogic);
registerLogic('ParametricGeometry', createParametricGeometryLogic);

// 注册克隆工厂
_cloneFactories.set('CubeGeometry', (src: CubeGeometry) => createCubeGeometryWithData(src));
_cloneFactories.set('PlaneGeometry', (src: PlaneGeometry) => createPlaneGeometryWithData(src));
_cloneFactories.set('SphereGeometry', (src: SphereGeometry) => createSphereGeometryWithData(src));
_cloneFactories.set('CapsuleGeometry', (src: CapsuleGeometry) => createCapsuleGeometryWithData(src));
_cloneFactories.set('CylinderGeometry', (src: CylinderGeometry) => createCylinderGeometryWithData(src));
_cloneFactories.set('ConeGeometry', (src: CylinderGeometry) => createConeGeometryWithData(src));
_cloneFactories.set('TorusGeometry', (src: TorusGeometry) => createTorusGeometryWithData(src));
_cloneFactories.set('QuadGeometry', () => createQuadGeometry());
_cloneFactories.set('PointGeometry', (src: PointGeometry) => createPointGeometryWithData(src));
_cloneFactories.set('SegmentGeometry', (src: SegmentGeometry) => createSegmentGeometryWithData(src));
_cloneFactories.set('CustomGeometry', () => createCustomGeometry());
_cloneFactories.set('ParametricGeometry', (src: ParametricGeometry) => createParametricGeometryWithData(src));

// 工厂与按数据克隆函数（避免循环依赖，放在文件末尾 import 子类工厂后定义）
import { createCubeGeometry, createCubeGeometryWithData } from '../primitives/CubeGeometry';
import { createPlaneGeometry, createPlaneGeometryWithData } from '../primitives/PlaneGeometry';
import { createSphereGeometry, createSphereGeometryWithData } from '../primitives/SphereGeometry';
import { createCapsuleGeometry, createCapsuleGeometryWithData } from '../primitives/CapsuleGeometry';
import { createCylinderGeometry, createCylinderGeometryWithData } from '../primitives/CylinderGeometry';
import { createConeGeometry, createConeGeometryWithData } from '../primitives/ConeGeometry';
import { createTorusGeometry, createTorusGeometryWithData } from '../primitives/TorusGeometry';
import { createQuadGeometry } from '../primitives/QuadGeometry';
import { createCustomGeometry } from './CustomGeometry';
import { createPointGeometry, createPointGeometryWithData } from './PointGeometry';
import { createSegmentGeometry, createSegmentGeometryWithData } from './SegmentGeometry';
import { createParametricGeometry, createParametricGeometryWithData } from '../primitives/ParametricGeometry';
