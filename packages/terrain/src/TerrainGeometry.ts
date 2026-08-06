import { Color4 } from '@feng3d/math';
import { Texture } from '@feng3d/webgpu';
import type { Geometry } from 'feng3d';
import { defaultTexture, effect, GeometryLogic, geometryUtils, ImageUtil, reactive, registerLogic, setDefaultGeometry } from 'feng3d';

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
 * 创建 TerrainGeometry logic。
 *
 * 监听 heightMap/width/height/depth/segmentsW/segmentsH/maxElevation/minElevation 变化
 * 触发 invalidateGeometry；在 buildGeometry 时按高度图生成顶点。
 */
function createTerrainGeometryLogic(g: TerrainGeometry, lg: GeometryLogic)
{
    let _heightImageData = defaultHeightMap;

    const onHeightMapChanged = () =>
    {
        // 统一为 webgpu Texture 接口后，heightMap 像素数据应放在 sources 中；
        // 旧 Texture2D 的 _pixels + loadCompleted 事件已移除，createTextureFromUrl
        // 在创建时即 resolve，故直接从 sources[0].image 读取。
        const source = (g.heightMap as any).sources?.[0];
        const img = source?.image;
        if (!img)
        {
            _heightImageData = defaultHeightMap;
            lg.invalidateGeometry();

            return;
        }
        // source.image 可能是 ImageData / ImageBitmap / HTMLImageElement，统一转 ImageData。
        _heightImageData = img instanceof ImageData
            ? img
            : (img instanceof ImageBitmap
                ? ImageUtil.fromImage(img as any).imageData
                : ImageUtil.fromImage(img as HTMLImageElement).imageData);
        lg.invalidateGeometry();
    };

    // 注意：TerrainGeometry 的 logic 必须自行维护顶点数据，这里需要 base logic 的能力。
    // 简化：把 TerrainGeometry 当作 CustomGeometry，借助已注册的 'CustomGeometry' 工厂
    // 拿到 base logic，再覆盖其 buildGeometry。
    // 但 logic() 按 __type__ 分发，所以需要单独注册一份 'TerrainGeometry' 工厂。

    const buildGeometry = () =>
    {
        if (!_heightImageData) return;
        let x: number; let z: number;
        let numInds = 0; let base = 0;
        const tw = g.segmentsW + 1;
        let numVerts = 0;
        const uDiv = (_heightImageData.width - 1) / g.segmentsW;
        const vDiv = (_heightImageData.height - 1) / g.segmentsH;
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
                col = getPixel(_heightImageData, u, v) & 0xff;
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

    // 这里无法直接组合 base logic（base 工厂签名接受单一 geometry），
    // 因此把 'TerrainGeometry' 注册为一个会复用 base 的工厂：
    // 我们直接调用 createBaseGeometryLogic 的等价——通过注册一个内联工厂实现。
    // 见文件末尾 registerLogic。

    const getPixel = (imageData: ImageData, u: number, v: number) =>
    {
        u = ~~u; v = ~~v;
        const index = (v * imageData.width + u) * 4;
        const data = imageData.data;
        const blue = data[index + 2];

        return blue;
    };

    // 通过 effect 监听参数变化触发 invalidateGeometry（heightMap 走单独回调）
    const rg = reactive(g as any);
    effect(() => { void rg.heightMap; onHeightMapChanged(); });
    for (const key of ['width', 'height', 'depth', 'segmentsW', 'segmentsH', 'maxElevation', 'minElevation'])
    {
        effect(() => { void rg[key]; lg.invalidateGeometry(); });
    }

    return buildGeometry;
}

class TerrainGeometryLogic extends GeometryLogic
{
    private readonly _terrainBuild: () => void;

    constructor(geometry: TerrainGeometry)
    {
        super(geometry);
        this.attributes = {
            a_position: { data: new Float32Array(), format: 'float32x3' },
            a_color: { data: new Float32Array(), format: 'float32x4' },
            a_uv: { data: new Float32Array(), format: 'float32x2' },
            a_normal: { data: new Float32Array(), format: 'float32x3' },
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
        this._terrainBuild = createTerrainGeometryLogic(geometry, this);
    }

    buildGeometry(): void
    {
        this._terrainBuild();
    }
}
registerLogic('TerrainGeometry', TerrainGeometryLogic as any);

setDefaultGeometry('Terrain-Geometry', createTerrainGeometry());
