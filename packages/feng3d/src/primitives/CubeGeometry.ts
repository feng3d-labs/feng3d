import { validateFieldTypes } from '../core/Validate';
import { Geometry, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CubeGeometry: CubeGeometryLogic;
    }
}

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
    /** 宽度（缺失时由工厂填充默认值） */
    readonly width?: number;
    /** 高度（缺失时由工厂填充默认值） */
    readonly height?: number;
    /** 深度（缺失时由工厂填充默认值） */
    readonly depth?: number;
    /** 宽度方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 高度方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 深度方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsD?: number;
    /** 是否为6块贴图（缺失时由工厂填充默认值） */
    readonly tile6?: boolean;
}

// CubeGeometry 默认值由访问器字段 ?? 处理（见下）

/**
 * CubeGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 width/height/depth/segmentsW/segmentsH/segmentsD/tile6。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class CubeGeometryLogic extends GeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    readonly #width = (): number => reactive(this._data as CubeGeometry).width ?? 1;
    readonly #height = (): number => reactive(this._data as CubeGeometry).height ?? 1;
    readonly #depth = (): number => reactive(this._data as CubeGeometry).depth ?? 1;
    readonly #segmentsW = (): number => reactive(this._data as CubeGeometry).segmentsW ?? 1;
    readonly #segmentsH = (): number => reactive(this._data as CubeGeometry).segmentsH ?? 1;
    readonly #segmentsD = (): number => reactive(this._data as CubeGeometry).segmentsD ?? 1;
    readonly #tile6 = (): boolean => reactive(this._data as CubeGeometry).tile6 ?? false;


    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_tangents = computed(() => this.#buildTangents());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_colors = computed(() =>
    {
        const pos = this.#_positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1); // 全白 (1,1,1,1)
    });
    readonly #_indicesComputed = computed(() => this.#buildIndices());

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: CubeGeometry)
    {
        validateFieldTypes(data, { width: 'number', height: 'number', depth: 'number', segmentsW: 'number', segmentsH: 'number', segmentsD: 'number', tile6: 'boolean' }, 'CubeGeometry');
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CubeGeometry): CubeGeometryLogic
    {
        return new CubeGeometryLogic(data);
    }

    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** indices 由 computed 驱动（覆写基类 getter） */
    override get vertexIndices(): number[]
    {
        return this.#_indicesComputed.value;
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
    #getFaces()
    {
        // 通过 accessor 函数读取（含默认值）
        return [
            { u: 2, v: 1, w: 0, udir: -1, vdir: -1, depthHalf: this.#width() / 2, gridX: this.#segmentsW(), gridY: this.#segmentsH(), face: 0 }, // +X
            { u: 2, v: 1, w: 0, udir: 1, vdir: -1, depthHalf: -this.#width() / 2, gridX: this.#segmentsW(), gridY: this.#segmentsH(), face: 1 }, // -X
            { u: 0, v: 2, w: 1, udir: 1, vdir: 1, depthHalf: this.#height() / 2, gridX: this.#segmentsW(), gridY: this.#segmentsD(), face: 2 }, // +Y
            { u: 0, v: 2, w: 1, udir: 1, vdir: -1, depthHalf: -this.#height() / 2, gridX: this.#segmentsW(), gridY: this.#segmentsD(), face: 3 }, // -Y
            { u: 0, v: 1, w: 2, udir: 1, vdir: -1, depthHalf: this.#depth() / 2, gridX: this.#segmentsW(), gridY: this.#segmentsH(), face: 4 }, // +Z
            { u: 0, v: 1, w: 2, udir: -1, vdir: -1, depthHalf: -this.#depth() / 2, gridX: this.#segmentsW(), gridY: this.#segmentsH(), face: 5 }, // -Z
        ];
    }

    #buildPositions(): Float32Array
    {

        const faces = this.#getFaces();
        const data: number[] = [];
        for (const f of faces)
        {
            const segW = f.gridX + 1;
            const segH = f.gridY + 1;
            // 面内 u/v 方向的实际尺寸（按 face 对应 width/height/depth）
            const faceSizes = [
                { u: this.#depth(), v: this.#height() },  // +X: u=z(depth), v=y(height)
                { u: this.#depth(), v: this.#height() },  // -X
                { u: this.#width(), v: this.#depth() },   // +Y: u=x(width), v=z(depth)
                { u: this.#width(), v: this.#depth() },   // -Y
                { u: this.#width(), v: this.#height() },  // +Z: u=x(width), v=y(height)
                { u: this.#width(), v: this.#height() },  // -Z
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

    #buildNormals(): Float32Array
    {

        const faces = this.#getFaces();
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

    #buildTangents(): Float32Array
    {

        const faces = this.#getFaces();
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

    #buildUVs(): Float32Array
    {

        const faces = this.#getFaces();
        const data: number[] = [];
        // tile6=true 时每面映射到 atlas 的 1/6 区域（3列×2行），face 索引对应位置：
        // face0(+X)->(1/3,1/2), face1(-X)->(2/3,0), face2(+Y)->(0,0), face3(-Y)->(0,1/2),
        // face4(+Z)->(1/3,1/2)... 沿用原 tile6 语义（见旧实现 tl0u/tl1u 映射）
        const tile6Offsets = this.#tile6()
            ? [[1 / 3, 1 / 2], [2 / 3, 0], [0, 0], [0, 1 / 2], [1 / 3, 1 / 2], [2 / 3, 0]]
            : [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
        const tileDim = this.#tile6() ? [1 / 3, 1 / 2] : [1, 1];
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
                    // feng3d 纹理上传不 flipY（copyExternalImageToTexture 默认），UV v=0 对应图像顶部。
                    // iy=0 顶点在面顶部（vdir 控制后），故 v = iy/gridY（不翻转），与 three.js 的 1-iy/gridY 不同
                    // （three.js 用 flipY=true 上传，约定相反）。
                    data.push(offU + (ix / f.gridX) * dimU, offV + (iy / f.gridY) * dimV);
                }
            }
        }

        return new Float32Array(data);
    }

    #buildIndices(): number[]
    {

        const faces = this.#getFaces();
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
}

registerLogic('CubeGeometry', CubeGeometryLogic as unknown as new (data: CubeGeometry) => CubeGeometryLogic);
