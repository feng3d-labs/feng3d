import { Color4 } from '@feng3d/math';
import { Texture } from '@feng3d/webgpu';
import type { Geometry } from 'feng3d';
import { defaultTexture, effect, geometryLogic, type GeometryLogic, geometryUtils, ImageUtil, reactive, registerLogic, setDefaultGeometry } from 'feng3d';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TerrainGeometry: GeometryLogic;
    }
}

/**
 * 地形几何体（纯数据接口）。
 *
 * 通过高度图（heightMap）+ 尺寸/分段参数声明，terrainGeometryLogic 在 updateGeometry 时
 * 读取高度图像素生成 positions/uvs/indices/normals/tangents。
 */
export interface TerrainGeometry extends Geometry
{
    /** 高度图路径 */
    heightMap: Texture;
    /** 地形宽度 */
    width: number;
    /** 地形高度 */
    height: number;
    /** 地形深度 */
    depth: number;
    /** 横向网格段数 */
    segmentsW: number;
    /** 纵向网格段数 */
    segmentsH: number;
    /** 最大地形高度 */
    maxElevation: number;
    /** 最小地形高度 */
    minElevation: number;
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

    // 注入空属性表（buildGeometry 时再填充实际数据）
    lg.setAttributes({
        a_position: { data: new Float32Array(), format: 'float32x3' },
        a_color: { data: new Float32Array(), format: 'float32x4' },
        a_uv: { data: new Float32Array(), format: 'float32x2' },
        a_normal: { data: new Float32Array(), format: 'float32x3' },
        a_tangent: { data: new Float32Array(), format: 'float32x3' },
        a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
        a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
        a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
        a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
    });

    // 每个实例独立的高度图像素缓存
    let heightImageData: ImageData = defaultHeightMap;

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
            lg.invalidateGeometry();

            return;
        }
        // source.image 可能是 ImageData / ImageBitmap / HTMLImageElement，统一转 ImageData。
        heightImageData = img instanceof ImageData
            ? img
            : (img instanceof ImageBitmap
                ? ImageUtil.fromImage(img as any).imageData
                : ImageUtil.fromImage(img as HTMLImageElement).imageData);
        lg.invalidateGeometry();
    };

    /**
     * buildGeometry：按高度图生成 positions/uvs/indices/normals/tangents。
     */
    const buildTerrainGeometry = () =>
    {
        if (!heightImageData) return;
        const g = geometry;
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
        lg.positions = vertices;
        lg.uvs = uvs;
        lg.indices = indices;
        lg.normals = geometryUtils.createVertexNormals(lg.indices, lg.positions, true);
        lg.tangents = geometryUtils.createVertexTangents(lg.indices, lg.positions, lg.uvs, true);
    };

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

    // 覆盖基座 buildGeometry：按高度图生成顶点
    Object.defineProperty(lg, 'buildGeometry', {
        value: buildTerrainGeometry,
        writable: true,
        enumerable: true,
        configurable: true,
    });

    // 响应式监听参数变化触发 invalidateGeometry（heightMap 走单独回调）
    const rg = reactive(geometry);
    effect(() => { void rg.heightMap; onHeightMapChanged(); });
    for (const key of ['width', 'height', 'depth', 'segmentsW', 'segmentsH', 'maxElevation', 'minElevation'])
    {
        effect(() => { void rg[key]; lg.invalidateGeometry(); });
    }

    return lg;
}

registerLogic('TerrainGeometry', terrainGeometryLogic);

setDefaultGeometry('Terrain-Geometry', createTerrainGeometry());
