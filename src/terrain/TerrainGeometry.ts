namespace feng3d
{

    /**
     * 地形几何体原始数据
     */
    export interface TerrainGeometryRaw
    {
        /**
         * 高度图路径
         */
        heightMapUrl?: string
        /**
         * 地形宽度
         */
        width?: number;

        /**
         * 地形高度
         */
        height?: number;

        /**
         * 地形深度
         */
        depth?: number;

        /**
         * 横向网格段数
         */
        segmentsW?: number;

        /**
         * 纵向网格段数
         */
        segmentsH?: number;

        /**
         * 最大地形高度
         */
        maxElevation?: number;

        /**
         * 最小地形高度
         */
        minElevation?: number;
    }

    /**
     * 默认高度图
     */
    var defaultHeightMap = imageUtil.createImageData();

    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    export class TerrainGeometry extends Geometry implements TerrainGeometryRaw
    {
        @serialize
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        @watch("invalidateGeometry")
        heightMapUrl: string;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        width = 10;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        height = 1;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        depth = 10;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        segmentsW = 30;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        segmentsH = 30;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        maxElevation = 255;

        @serialize
        @oav()
        @watch("invalidateGeometry")
        minElevation = 0;

        private _heightMap = defaultHeightMap;

		/**
		 * 创建高度地形 拥有segmentsW*segmentsH个顶点
		 */
        constructor(raw?: TerrainGeometryRaw)
        {
            super();
            this.name = "terrain";
            serialization.setValue(this, raw);
        }

        /**
         * 几何体变脏
         */
        invalidateGeometry(propertyKey?: string, oldValue?, newValue?)
        {
            if (propertyKey == "heightMapUrl")
            {
                imageUtil.getImageDataFromUrl(newValue, (imageData) =>
                {
                    if (imageData)
                    {
                        this._heightMap = imageData;
                        super.invalidateGeometry();
                    }
                });
            } else
            {
                super.invalidateGeometry();
            }
        }

		/**
		 * 创建顶点坐标
		 */
        protected buildGeometry()
        {
            if (!this._heightMap)
                return;
            var x: number, z: number;
            var numInds = 0;
            var base = 0;
            //一排顶点数据
            var tw = this.segmentsW + 1;
            //总顶点数量
            var numVerts = (this.segmentsH + 1) * tw;
            //一个格子所占高度图X轴像素数
            var uDiv = (this._heightMap.width - 1) / this.segmentsW;
            //一个格子所占高度图Y轴像素数
            var vDiv = (this._heightMap.height - 1) / this.segmentsH;
            var u: number, v: number;
            var y: number;

            var vertices: number[] = [];
            var indices: number[] = [];

            numVerts = 0;
            var col: number;
            for (var zi = 0; zi <= this.segmentsH; ++zi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    //顶点坐标
                    x = (xi / this.segmentsW - .5) * this.width;
                    z = (zi / this.segmentsH - .5) * this.depth;
                    //格子对应高度图uv坐标
                    u = xi * uDiv;
                    v = (this.segmentsH - zi) * vDiv;

                    //获取颜色值
                    col = this.getPixel(this._heightMap, u, v) & 0xff;
                    //计算高度值
                    y = (col > this.maxElevation) ? (this.maxElevation / 0xff) * this.height : ((col < this.minElevation) ? (this.minElevation / 0xff) * this.height : (col / 0xff) * this.height);

                    //保存顶点坐标
                    vertices[numVerts++] = x;
                    vertices[numVerts++] = y;
                    vertices[numVerts++] = z;

                    if (xi != this.segmentsW && zi != this.segmentsH)
                    {
                        //增加 一个顶点同时 生成一个格子或两个三角形
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
            var uvs = this.buildUVs();
            this.setVAData("a_position", vertices, 3);
            this.setVAData("a_uv", uvs, 2);
            this.indices = indices;
        }

		/**
		 * 创建uv坐标
		 */
        private buildUVs()
        {
            var numUvs = (this.segmentsH + 1) * (this.segmentsW + 1) * 2;
            var uvs: number[] = [];

            numUvs = 0;
            //计算每个顶点的uv坐标
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
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

            //得到高度图中的值
            var u = (x / this.width + .5) * (this._heightMap.width - 1);
            var v = (-z / this.depth + .5) * (this._heightMap.height - 1);

            var col = this.getPixel(this._heightMap, u, v) & 0xff;

            var h: number;
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

            //取整
            u = ~~u;
            v = ~~v;

            var index = (v * imageData.width + u) * 4;
            var data = imageData.data;
            var red = data[index];//红色色深
            var green = data[index + 1];//绿色色深
            var blue = data[index + 2];//蓝色色深
            var alpha = data[index + 3];//透明度
            return blue;
        }
    }
}