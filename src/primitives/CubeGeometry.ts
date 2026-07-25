import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CubeGeometry: CubeGeometry;
    }
}

/**
 * 立（长）方体几何体（纯数据接口）。
 */
export interface CubeGeometry extends Geometry
{
    readonly __type__: 'CubeGeometry';
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 深度 */
    readonly depth: number;
    /** 宽度方向分割数 */
    readonly segmentsW: number;
    /** 高度方向分割数 */
    readonly segmentsH: number;
    /** 深度方向分割数 */
    readonly segmentsD: number;
    /** 是否为6块贴图 */
    readonly tile6: boolean;
}

// CubeGeometry 默认值由 cubeGeometryLogic 工厂顶部处理（见下）

/**
 * 创建 CubeGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 width/height/depth/segmentsW/segmentsH/segmentsD/tile6。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export function cubeGeometryLogic(geometry: CubeGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值）
    const writable = geometry as UnReadonly<CubeGeometry>;
    if (geometry.name === undefined) writable.name = 'Cube';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.width === undefined) writable.width = 1;
    if (geometry.height === undefined) writable.height = 1;
    if (geometry.depth === undefined) writable.depth = 1;
    if (geometry.segmentsW === undefined) writable.segmentsW = 1;
    if (geometry.segmentsH === undefined) writable.segmentsH = 1;
    if (geometry.segmentsD === undefined) writable.segmentsD = 1;
    if (geometry.tile6 === undefined) writable.tile6 = false;

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _tangents = computed(() => buildTangents());
    const _uvs = computed(() => buildUVs());
    const _colors = computed(() =>
    {
        const pos = _positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1); // 全白 (1,1,1,1)
    });
    const _indicesComputed = computed(() => buildIndices());

    // attributes: data 由 computed getter 驱动
    base.setAttributes(createAttributes());

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'indices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

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
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----
    //
    // 单层立方体，6 面各一组顶点（外法线朝外），索引 a,b,d + b,c,d（CCW，配合 frontFace:'ccw'）。
    // 参照 three.js BoxGeometry.buildPlane 的 (u,v,w,udir,vdir) 参数化方法。

    /**
     * 6 面参数表：[uAxis, vAxis, wAxis, udir, vdir, depth, gridX, gridY, faceIndex]
     * - uAxis/vAxis/wAxis: 0=x, 1=y, 2=z（面内两轴 + 法线轴）
     * - udir/vdir: 面内坐标方向符号（控制朝向，使外法线朝外）
     * - depth: 该面在 wAxis 上的半尺寸（符号决定 +w 或 -w 侧）
     * - gridX/gridY: 该面两个方向的分割数
     * - faceIndex: 0..5，用于 tile6 UV 分块
     *
     * 顺序与 three.js BoxGeometry.js:76-81 一致（px/nx/py/ny/pz/nz）。
     */
    function getFaces(g: { width: number; height: number; depth: number; segmentsW: number; segmentsH: number; segmentsD: number })
    {
        return [
            { u: 2, v: 1, w: 0, udir: -1, vdir: -1, depthHalf: g.width / 2, gridX: g.segmentsW, gridY: g.segmentsH, face: 0 }, // +X
            { u: 2, v: 1, w: 0, udir: 1, vdir: -1, depthHalf: -g.width / 2, gridX: g.segmentsW, gridY: g.segmentsH, face: 1 }, // -X
            { u: 0, v: 2, w: 1, udir: 1, vdir: 1, depthHalf: g.height / 2, gridX: g.segmentsW, gridY: g.segmentsD, face: 2 }, // +Y
            { u: 0, v: 2, w: 1, udir: 1, vdir: -1, depthHalf: -g.height / 2, gridX: g.segmentsW, gridY: g.segmentsD, face: 3 }, // -Y
            { u: 0, v: 1, w: 2, udir: 1, vdir: -1, depthHalf: g.depth / 2, gridX: g.segmentsW, gridY: g.segmentsH, face: 4 }, // +Z
            { u: 0, v: 1, w: 2, udir: -1, vdir: -1, depthHalf: -g.depth / 2, gridX: g.segmentsW, gridY: g.segmentsH, face: 5 }, // -Z
        ];
    }

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry);
        const faces = getFaces(g);
        const data: number[] = [];
        for (const f of faces)
        {
            const segW = f.gridX + 1;
            const segH = f.gridY + 1;
            // 面内 u/v 方向的实际尺寸（按 face 对应 width/height/depth）
            const faceSizes = [
                { u: g.depth, v: g.height },  // +X: u=z(depth), v=y(height)
                { u: g.depth, v: g.height },  // -X
                { u: g.width, v: g.depth },   // +Y: u=x(width), v=z(depth)
                { u: g.width, v: g.depth },   // -Y
                { u: g.width, v: g.height },  // +Z: u=x(width), v=y(height)
                { u: g.width, v: g.height },  // -Z
            ][f.face];
            const segU = faceSizes.u / f.gridX;
            const segV = faceSizes.v / f.gridY;
            for (let iy = 0; iy < segH; iy++)
            {
                const yv = iy * segV - faceSizes.v / 2;
                for (let ix = 0; ix < segW; ix++)
                {
                    const xu = ix * segU - faceSizes.u / 2;
                    const pos = [0, 0, 0];
                    pos[f.u] = xu * f.udir;
                    pos[f.v] = yv * f.vdir;
                    pos[f.w] = f.depthHalf;
                    data.push(pos[0], pos[1], pos[2]);
                }
            }
        }

        return new Float32Array(data);
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        const faces = getFaces(g);
        const data: number[] = [];
        for (const f of faces)
        {
            const count = (f.gridX + 1) * (f.gridY + 1);
            // 外法线 = wAxis 方向 × depthHalf 符号
            const n = [0, 0, 0];
            n[f.w] = f.depthHalf > 0 ? 1 : -1;
            for (let i = 0; i < count; i++)
            {
                data.push(n[0], n[1], n[2]);
            }
        }

        return new Float32Array(data);
    }

    function buildTangents(): Float32Array
    {
        const g = reactive(geometry);
        const faces = getFaces(g);
        const data: number[] = [];
        for (const f of faces)
        {
            const count = (f.gridX + 1) * (f.gridY + 1);
            // 切线沿 uAxis 方向（与 UV 的 U 增长一致），符号跟随 udir
            const t = [0, 0, 0];
            t[f.u] = f.udir;
            for (let i = 0; i < count; i++)
            {
                data.push(t[0], t[1], t[2]);
            }
        }

        return new Float32Array(data);
    }

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry);
        const faces = getFaces(g);
        const data: number[] = [];
        // tile6=true 时每面映射到 atlas 的 1/6 区域（3列×2行），face 索引对应位置：
        // face0(+X)->(1/3,1/2), face1(-X)->(2/3,0), face2(+Y)->(0,0), face3(-Y)->(0,1/2),
        // face4(+Z)->(1/3,1/2)... 沿用原 tile6 语义（见旧实现 tl0u/tl1u 映射）
        const tile6Offsets = g.tile6
            ? [[1 / 3, 1 / 2], [2 / 3, 0], [0, 0], [0, 1 / 2], [1 / 3, 1 / 2], [2 / 3, 0]]
            : [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
        const tileDim = g.tile6 ? [1 / 3, 1 / 2] : [1, 1];
        for (const f of faces)
        {
            const segW = f.gridX + 1;
            const segH = f.gridY + 1;
            const [offU, offV] = tile6Offsets[f.face];
            const [dimU, dimV] = tileDim;
            for (let iy = 0; iy < segH; iy++)
            {
                for (let ix = 0; ix < segW; ix++)
                {
                    data.push(offU + (ix / f.gridX) * dimU, offV + (1 - iy / f.gridY) * dimV);
                }
            }
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const faces = getFaces(g);
        const indices: number[] = [];
        let vertexOffset = 0;
        for (const f of faces)
        {
            const gridX1 = f.gridX + 1;
            for (let iy = 0; iy < f.gridY; iy++)
            {
                for (let ix = 0; ix < f.gridX; ix++)
                {
                    const a = vertexOffset + ix + gridX1 * iy;
                    const b = vertexOffset + ix + gridX1 * (iy + 1);
                    const c = vertexOffset + (ix + 1) + gridX1 * (iy + 1);
                    const d = vertexOffset + (ix + 1) + gridX1 * iy;
                    // CCW（配合 frontFace:'ccw'），与 three.js BoxGeometry 一致
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
            vertexOffset += gridX1 * (f.gridY + 1);
        }

        return indices;
    }

    return base;
}

registerLogic('CubeGeometry', cubeGeometryLogic);
registerCloneFactory('CubeGeometry', (src: CubeGeometry) => ({ ...src }) as CubeGeometry);
registerDefaultGeometryFactory('Cube', () => ({ __type__: 'CubeGeometry' }));
