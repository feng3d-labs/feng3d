import { Color4 } from '@feng3d/math';
import { Texture } from '@feng3d/webgpu';
import type { CustomGeometry } from 'feng3d';
import { computed, defaultTexture, effect, GeometryLogic, geometryUtils, ImageUtil, reactive, ref, registerLogic } from 'feng3d';
import type { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TerrainGeometry: TerrainGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        TerrainGeometry: TerrainGeometry;
    }
}

/**
 * 地形几何体（纯数据接口）。
 *
 * 继承 {@link CustomGeometry} 获得顶点数据字段，通过高度图（heightMap）+ 尺寸/分段
 * 参数声明，TerrainGeometryLogic 在 updateGeometry 时读取高度图像素生成
 * positions/uvs/indices/normals/tangents（写入响应式数据接口字段）。
 */
export interface TerrainGeometry extends Omit<CustomGeometry, '__type__'>
{
    readonly __type__: 'TerrainGeometry';
    /** 高度图路径 */
    readonly heightMap: Texture;
    /** 地形宽度 */
    readonly width: number;
    /** 地形高度 */
    readonly height: number;
    /** 地形深度 */
    readonly depth: number;
    /** 横向网格段数 */
    readonly segmentsW: number;
    /** 纵向网格段数 */
    readonly segmentsH: number;
    /** 最大地形高度 */
    readonly maxElevation: number;
    /** 最小地形高度 */
    readonly minElevation: number;
}

/**
 * 创建 TerrainGeometry 实例。
 */
export function createTerrainGeometry(): TerrainGeometry
{
    return {
        __type__: 'TerrainGeometry',
        name: 'terrain',
        scaleU: 1,
        scaleV: 1,
        heightMap: defaultTexture,
        width: 10,
        height: 1,
        depth: 10,
        segmentsW: 30,
        segmentsH: 30,
        maxElevation: 255,
        minElevation: 0,
    };
}

/**
 * 默认高度图
 */
const defaultHeightMap = new ImageUtil(1024, 1024, new Color4(0, 0, 0, 0)).imageData;

/**
 * TerrainGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic} 获得全部通用顶点/索引/包围盒行为，仅覆写
 * vertices / vertexIndices：按高度图（heightMap）像素生成
 * positions/uvs/indices/normals/tangents。
 *
 * 通过 effect 监听 heightMap/width/height/depth/segmentsW/segmentsH/maxElevation/minElevation
 * 变化触发 invalidateGeometry（heightMap 走单独回调重新读取像素数据）。
 */
export class TerrainGeometryLogic extends GeometryLogic
{
    // 每个实例独立的高度图像素缓存（普通变量，配合 r_heightVersion 版本戳触发 computed 重算）
    #heightImageData: ImageData = defaultHeightMap;
    // 版本戳：heightImageData 更新时递增，_terrainData computed 依赖它触发重算
    readonly #r_heightVersion = ref(0);

    /**
     * 按高度图生成顶点数据（computed 驱动）。
     * 依赖 heightImageData（effect 更新）+ 构造参数（reactive 读取），
     * 任一变化时 computed 自动失效重算。
     * 返回 { positions, uvs, indices, normals, tangents }。
     */
    readonly #_terrainData = computed(() =>
    {
        void this.#r_heightVersion.value; // 建立对 heightImageData 更新的依赖
        if (!this.#heightImageData) return null;
        const r_g = reactive(this._data as TerrainGeometry);
        let x: number; let z: number;
        let numInds = 0; let base = 0;
        const tw = r_g.segmentsW + 1;
        let numVerts = 0;
        const uDiv = (this.#heightImageData.width - 1) / r_g.segmentsW;
        const vDiv = (this.#heightImageData.height - 1) / r_g.segmentsH;
        let u: number; let v: number; let y: number;

        const vertices: number[] = [];
        const indices: number[] = [];
        let col: number;
        for (let zi = 0; zi <= r_g.segmentsH; ++zi)
        {
            for (let xi = 0; xi <= r_g.segmentsW; ++xi)
            {
                x = (xi / r_g.segmentsW - 0.5) * r_g.width;
                z = (zi / r_g.segmentsH - 0.5) * r_g.depth;
                u = xi * uDiv;
                v = (r_g.segmentsH - zi) * vDiv;
                col = this.#getPixel(this.#heightImageData, u, v) & 0xff;
                y = (col > r_g.maxElevation) ? (r_g.maxElevation / 0xff) * r_g.height : ((col < r_g.minElevation) ? (r_g.minElevation / 0xff) * r_g.height : (col / 0xff) * r_g.height);
                vertices[numVerts++] = x;
                vertices[numVerts++] = y;
                vertices[numVerts++] = z;
                if (xi !== r_g.segmentsW && zi !== r_g.segmentsH)
                {
                    base = xi + zi * tw;
                    indices[numInds++] = base;
                    indices[numInds++] = base + tw;
                    indices[numInds++] = base + tw + 1;
                    indices[numInds++] = base;
                    indices[numInds++] = base + tw + 1;
                    indices[numInds++] = base + 1;
                }
            }
        }
        // uvs
        const uvs: number[] = [];
        let ui = 0;
        for (let yi = 0; yi <= r_g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= r_g.segmentsW; ++xi)
            {
                uvs[ui++] = xi / r_g.segmentsW;
                uvs[ui++] = 1 - yi / r_g.segmentsH;
            }
        }

        return {
            positions: vertices,
            uvs,
            indices,
            normals: geometryUtils.createVertexNormals(indices, vertices, true),
            tangents: geometryUtils.createVertexTangents(indices, vertices, uvs, true),
        };
    });

    // 从 _terrainData 派生各顶点属性 computed
    readonly #_positions = computed(() => this.#_terrainData.value ? new Float32Array(this.#_terrainData.value.positions) : new Float32Array());
    readonly #_uvs = computed(() => this.#_terrainData.value ? new Float32Array(this.#_terrainData.value.uvs) : new Float32Array());
    readonly #_normals = computed(() => this.#_terrainData.value ? new Float32Array(this.#_terrainData.value.normals) : new Float32Array());
    readonly #_tangents = computed(() => this.#_terrainData.value ? new Float32Array(this.#_terrainData.value.tangents) : new Float32Array());
    readonly #_indices = computed(() => this.#_terrainData.value ? this.#_terrainData.value.indices : []);

    // attributes 覆写数据源：computed 驱动的属性表
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: { data: new Float32Array(), format: 'float32x4' },
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: TerrainGeometry)
    {
        super(data);

        // heightMap 变化时更新高度图像素缓存，触发 _terrainData computed 重算。
        // 其余构造参数（width/height/depth/segmentsW/...）由 _terrainData computed 内 reactive(data).xxx 直接追踪。
        const r_geometry = reactive(data);
        effect(() => { void r_geometry.heightMap; this.#onHeightMapChanged(); });
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: TerrainGeometry): TerrainGeometryLogic
    {
        return new TerrainGeometryLogic(data);
    }

    /** 顶点属性表（覆写基类 getter，返回 computed 驱动的属性表） */
    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** 顶点索引（覆写基类 getter，由 computed 驱动） */
    override get vertexIndices(): number[]
    {
        return this.#_indices.value;
    }

    /**
     * heightMap 变化回调：从 webgpu Texture.sources[0].image 读取像素数据。
     *
     * 统一为 webgpu Texture 接口后，heightMap 像素数据放在 sources 中；
     * 旧 Texture2D 的 _pixels + loadCompleted 事件已移除，createTextureFromUrl
     * 在创建时即 resolve，故直接从 sources[0].image 读取。
     */
    #onHeightMapChanged(): void
    {
        const source = ((this._data as TerrainGeometry).heightMap as any).sources?.[0];
        const img = source?.image;
        if (!img)
        {
            this.#heightImageData = defaultHeightMap;
            this.#r_heightVersion.value++;

            return;
        }
        // source.image 可能是 ImageData / ImageBitmap / HTMLImageElement，统一转 ImageData。
        this.#heightImageData = img instanceof ImageData
            ? img
            : (img instanceof ImageBitmap
                ? ImageUtil.fromImage(img as any).imageData
                : ImageUtil.fromImage(img as HTMLImageElement).imageData);
        this.#r_heightVersion.value++;
    }

    /**
     * 读取 imageData 中 (u, v) 处的蓝色通道值（地形高度来源）。
     */
    #getPixel(imageData: ImageData, u: number, v: number): number
    {
        u = ~~u; v = ~~v;
        const index = (v * imageData.width + u) * 4;
        const data = imageData.data;
        const blue = data[index + 2];

        return blue;
    }
}

registerLogic('TerrainGeometry', TerrainGeometryLogic as unknown as new (data: TerrainGeometry) => TerrainGeometryLogic);
