import { Geometry, geometryUtils, ImageUtil, Texture2D } from '@feng3d/core';
import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { gPartial } from '@feng3d/polyfill';
import { decoratorRegisterClass, serialization, serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';

declare global
{
    export interface MixinsGeometryMap
    {
        TerrainGeometry: TerrainGeometry
    }

    export interface MixinsDefaultGeometry
    {
        'Terrain-Geometry': TerrainGeometry;
    }
}

/**
 * 地形几何体
 */
@decoratorRegisterClass()
export class TerrainGeometry extends Geometry
{
    /**
     * 高度图路径
     */
    @serialize
    @oav()
    heightMap = Texture2D.default;

    /**
     * 地形宽度
     */
    @serialize
    @oav()
    width = 10;

    /**
     * 地形高度
     */
    @serialize
    @oav()
    height = 1;

    /**
     * 地形深度
     */
    @serialize
    @oav()
    depth = 10;

    /**
     * 横向网格段数
     */
    @serialize
    @oav()
    segmentsW = 30;

    /**
     * 纵向网格段数
     */
    @serialize
    @oav()
    segmentsH = 30;

    /**
     * 最大地形高度
     */
    @serialize
    @oav()
    maxElevation = 255;

    /**
     * 最小地形高度
     */
    @serialize
    @oav()
    minElevation = 0;

    private _heightImageData: ImageData;

    /**
     * 创建高度地形 拥有segmentsW*segmentsH个顶点
     */
    constructor(raw?: gPartial<TerrainGeometry>)
    {
        super();
        this.name = 'terrain';
        serialization.setValue(this, raw);
        //
        watcher.watch(this as TerrainGeometry, 'heightMap', this._onHeightMapChanged, this);
        watcher.watch(this as TerrainGeometry, 'width', this.invalidateGeometry, this);
        watcher.watch(this as TerrainGeometry, 'height', this.invalidateGeometry, this);
        watcher.watch(this as TerrainGeometry, 'depth', this.invalidateGeometry, this);
        watcher.watch(this as TerrainGeometry, 'segmentsW', this.invalidateGeometry, this);
        watcher.watch(this as TerrainGeometry, 'segmentsH', this.invalidateGeometry, this);
        watcher.watch(this as TerrainGeometry, 'maxElevation', this.invalidateGeometry, this);
        watcher.watch(this as TerrainGeometry, 'minElevation', this.invalidateGeometry, this);
    }

    private _onHeightMapChanged()
    {
        if (!this.heightMap['_pixels'])
        {
            this._heightImageData = getDefaultHeightMap();
            this.invalidateGeometry();

            this.heightMap.once('loadCompleted', () =>
            {
                const img = this.heightMap['_pixels'] as HTMLImageElement;
                this._heightImageData = ImageUtil.fromImage(img).imageData;
                this.invalidateGeometry();
            });

            return;
        }
        const img = this.heightMap['_pixels'] as HTMLImageElement;
        this._heightImageData = ImageUtil.fromImage(img).imageData;
        this.invalidateGeometry();
    }

    /**
     * 创建顶点坐标
     */
    protected buildGeometry()
    {
        if (!this._heightImageData)
        { return; }
        let x: number; let
            z: number;
        let numInds = 0;
        let base = 0;
        // 一排顶点数据
        const tw = this.segmentsW + 1;
        // 总顶点数量
        let numVerts = (this.segmentsH + 1) * tw;
        // 一个格子所占高度图X轴像素数
        const uDiv = (this._heightImageData.width - 1) / this.segmentsW;
        // 一个格子所占高度图Y轴像素数
        const vDiv = (this._heightImageData.height - 1) / this.segmentsH;
        let u: number; let
            v: number;
        let y: number;

        const vertices: number[] = [];
        const indices: number[] = [];

        numVerts = 0;
        let col: number;
        for (let zi = 0; zi <= this.segmentsH; ++zi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                // 顶点坐标
                x = (xi / this.segmentsW - 0.5) * this.width;
                z = (zi / this.segmentsH - 0.5) * this.depth;
                // 格子对应高度图uv坐标
                u = xi * uDiv;
                v = (this.segmentsH - zi) * vDiv;

                // 获取颜色值
                col = this.getPixel(this._heightImageData, u, v) & 0xff;
                // 计算高度值
                y = (col > this.maxElevation) ? (this.maxElevation / 0xff) * this.height : ((col < this.minElevation) ? (this.minElevation / 0xff) * this.height : (col / 0xff) * this.height);

                // 保存顶点坐标
                vertices[numVerts++] = x;
                vertices[numVerts++] = y;
                vertices[numVerts++] = z;

                if (xi !== this.segmentsW && zi !== this.segmentsH)
                {
                    // 增加 一个顶点同时 生成一个格子或两个三角形
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
        const uvs = this.buildUVs();
        const normals = geometryUtils.createVertexNormals(indices, vertices, true);
        const tangents = geometryUtils.createVertexTangents(indices, vertices, uvs, true);

        this.indexBuffer = { array: indices };
        this.attributes.a_position = { array: vertices, itemSize: 3 };
        this.attributes.a_uv = { array: uvs, itemSize: 2 };
        this.attributes.a_normal = { array: normals, itemSize: 3 };
        this.attributes.a_tangent = { array: tangents, itemSize: 3 };
    }

    /**
     * 创建uv坐标
     */
    private buildUVs()
    {
        let numUvs = (this.segmentsH + 1) * (this.segmentsW + 1) * 2;
        const uvs: number[] = [];

        numUvs = 0;
        // 计算每个顶点的uv坐标
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                uvs[numUvs++] = xi / this.segmentsW;
                uvs[numUvs++] = 1 - yi / this.segmentsH;
            }
        }

        return uvs;
    }

    /**
     * 获取位置在（x，z）处的高度y值
     * @param x x坐标
     * @param z z坐标
     * @return 高度
     */
    getHeightAt(x: number, z: number): number
    {
        // 得到高度图中的值
        const u = (x / this.width + 0.5) * (this._heightImageData.width - 1);
        const v = (-z / this.depth + 0.5) * (this._heightImageData.height - 1);

        const col = this.getPixel(this._heightImageData, u, v) & 0xff;

        let h: number;
        if (col > this.maxElevation)
        {
            h = (this.maxElevation / 0xff) * this.height;
        }
        else if (col < this.minElevation)
        {
            h = (this.minElevation / 0xff) * this.height;
        }
        else
        {
            h = (col / 0xff) * this.height;
        }

        return h;
    }

    /**
     * 获取像素值
     */
    private getPixel(imageData: ImageData, u: number, v: number)
    {
        // 取整
        u = ~~u;
        v = ~~v;

        const index = (v * imageData.width + u) * 4;
        const data = imageData.data;
        // const red = data[index];// 红色色深
        // const green = data[index + 1];// 绿色色深
        const blue = data[index + 2];// 蓝色色深
        // const alpha = data[index + 3];// 透明度

        return blue;
    }
}

/**
 * 默认高度图
 */
function getDefaultHeightMap()
{
    _defaultHeightMap = _defaultHeightMap || new ImageUtil(1024, 1024, new Color4(0, 0, 0, 0)).imageData;

    return _defaultHeightMap;
}
let _defaultHeightMap: ImageData;

Geometry.setDefault('Terrain-Geometry', new TerrainGeometry());
