import { Color4 } from '@feng3d/math';
import { Texture } from '@feng3d/webgpu';
import type { CustomGeometry } from 'feng3d';
import { computed, defaultTexture, effect, geometryLogic, type GeometryLogic, geometryUtils, ImageUtil, reactive, ref, registerLogic, setDefaultGeometry } from 'feng3d';
import type { VertexAttribute } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TerrainGeometry: GeometryLogic;
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
 * 参数声明，terrainGeometryLogic 在 updateGeometry 时读取高度图像素生成
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
 * 创建 TerrainGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic} 获得全部通用顶点/索引/包围盒行为，仅注入空属性表并
 * 覆盖 buildGeometry：按高度图（heightMap）像素生成 positions/uvs/indices/normals/tangents。
 *
 * 通过 effect 监听 heightMap/width/height/depth/segmentsW/segmentsH/maxElevation/minElevation
 * 变化触发 invalidateGeometry（heightMap 走单独回调重新读取像素数据）。
 */
export function terrainGeometryLogic(geometry: TerrainGeometry): GeometryLogic
{
    // 组合基座（提供全部通用顶点/索引/包围盒/渲染行为）
    const lg = geometryLogic(geometry);

    // _terrainData / _positions 等 computed 在 buildTerrainGeometry 之后定义（见下）

    function createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: { readonly value: Float32Array }, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(_positions, 'float32x3'),
            a_color: { data: new Float32Array(), format: 'float32x4' },
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // 每个实例独立的高度图像素缓存（ref 驱动，变化时触发 _terrainData computed 重算）    // 每个实例独立的高度图像素缓存（普通变量，配合 r_heightVersion 版本戳触发 computed 重算）
    let heightImageData: ImageData = defaultHeightMap;
    // 版本戳：heightImageData 更新时递增，_terrainData computed 依赖它触发重算
    const r_heightVersion = ref(0);

    /**
     * heightMap 变化回调：从 webgpu Texture.sources[0].image 读取像素数据。
     *
     * 统一为 webgpu Texture 接口后，heightMap 像素数据放在 sources 中；
     * 旧 Texture2D 的 _pixels + loadCompleted 事件已移除，createTextureFromUrl
     * 在创建时即 resolve，故直接从 sources[0].image 读取。
     */
    const onHeightMapChanged = () =>
    {
        const source = (geometry.heightMap as any).sources?.[0];
        const img = source?.image;
        if (!img)
        {
            heightImageData = defaultHeightMap;
            r_heightVersion.value++;

            return;
        }
        // source.image 可能是 ImageData / ImageBitmap / HTMLImageElement，统一转 ImageData。
        heightImageData = img instanceof ImageData
            ? img
            : (img instanceof ImageBitmap
                ? ImageUtil.fromImage(img as any).imageData
                : ImageUtil.fromImage(img as HTMLImageElement).imageData);
        r_heightVersion.value++;
    };

    /**
     * buildGeometry：按高度图生成 positions/uvs/indices/normals/tangents。
     */
    /**
     * 按高度图生成顶点数据（computed 驱动）。
     * 依赖 r_heightImageData（effect 更新）+ 构造参数（reactive 读取），
     * 任一变化时 computed 自动失效重算。
     * 返回 { positions, uvs, indices, normals, tangents }。
     */
    const _terrainData = computed(() =>
    {
        void r_heightVersion.value; // 建立对 heightImageData 更新的依赖
        if (!heightImageData) return null;
        const g = reactive(geometry);
        let x: number; let z: number;
        let numInds = 0; let base = 0;
        const tw = g.segmentsW + 1;
        let numVerts = 0;
        const uDiv = (heightImageData.width - 1) / g.segmentsW;
        const vDiv = (heightImageData.height - 1) / g.segmentsH;
        let u: number; let v: number; let y: number;

        const vertices: number[] = [];
        const indices: number[] = [];
        let col: number;
        for (let zi = 0; zi <= g.segmentsH; ++zi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                x = (xi / g.segmentsW - 0.5) * g.width;
                z = (zi / g.segmentsH - 0.5) * g.depth;
                u = xi * uDiv;
                v = (g.segmentsH - zi) * vDiv;
                col = getPixel(heightImageData, u, v) & 0xff;
                y = (col > g.maxElevation) ? (g.maxElevation / 0xff) * g.height : ((col < g.minElevation) ? (g.minElevation / 0xff) * g.height : (col / 0xff) * g.height);
                vertices[numVerts++] = x;
                vertices[numVerts++] = y;
                vertices[numVerts++] = z;
                if (xi !== g.segmentsW && zi !== g.segmentsH)
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
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                uvs[ui++] = xi / g.segmentsW;
                uvs[ui++] = 1 - yi / g.segmentsH;
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
    const _positions = computed(() => _terrainData.value ? new Float32Array(_terrainData.value.positions) : new Float32Array());
    const _uvs = computed(() => _terrainData.value ? new Float32Array(_terrainData.value.uvs) : new Float32Array());
    const _normals = computed(() => _terrainData.value ? new Float32Array(_terrainData.value.normals) : new Float32Array());
    const _tangents = computed(() => _terrainData.value ? new Float32Array(_terrainData.value.tangents) : new Float32Array());
    const _indices = computed(() => _terrainData.value ? _terrainData.value.indices : []);

    // attributes getter 重写：返回 computed 驱动的属性表
    const _attrTable = createAttributes();
    Object.defineProperty(lg, 'attributes', { get() { return _attrTable; }, enumerable: true, configurable: true });

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(lg, 'indices', { get() { return _indices.value; }, enumerable: true, configurable: true });

    /**
     * 读取 imageData 中 (u, v) 处的蓝色通道值（地形高度来源）。
     */
    const getPixel = (imageData: ImageData, u: number, v: number) =>
    {
        u = ~~u; v = ~~v;
        const index = (v * imageData.width + u) * 4;
        const data = imageData.data;
        const blue = data[index + 2];

        return blue;
    };

    // heightMap 变化时更新高度图像素缓存（r_heightImageData），触发 _terrainData computed 重算。
    // 其余构造参数（width/height/depth/segmentsW/...）由 _terrainData computed 内 reactive(geometry).xxx 直接追踪。
    const rg = reactive(geometry);
    effect(() => { void rg.heightMap; onHeightMapChanged(); });

    return lg;
}

registerLogic('TerrainGeometry', terrainGeometryLogic);

setDefaultGeometry('Terrain-Geometry', createTerrainGeometry());
