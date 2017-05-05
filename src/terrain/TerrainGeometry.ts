module feng3d
{

    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    export class TerrainGeometry extends Geometry
    {
        private _heightMap: ImageData;
        private _heightImage: HTMLImageElement;

		/**
		 * 创建高度地形 拥有segmentsW*segmentsH个顶点
		 * @param    heightMap	高度图
		 * @param    width	地形宽度
		 * @param    height	地形高度
		 * @param    depth	地形深度
		 * @param    segmentsW	x轴上网格段数
		 * @param    segmentsH	y轴上网格段数
		 * @param    maxElevation	最大地形高度
		 * @param    minElevation	最小地形高度
		 */
        constructor(public heightMapUrl: string, public width: number = 1000, public height: number = 100, public depth: number = 1000, public segmentsW: number = 30, public segmentsH: number = 30, public maxElevation: number = 255, public minElevation: number = 0)
        {
            super();

            Watcher.watch(this, ["width"], this.invalidateGeometry, this);
            Watcher.watch(this, ["height"], this.invalidateGeometry, this);
            Watcher.watch(this, ["depth"], this.invalidateGeometry, this);
            Watcher.watch(this, ["segmentsW"], this.invalidateGeometry, this);
            Watcher.watch(this, ["segmentsH"], this.invalidateGeometry, this);
            Watcher.watch(this, ["maxElevation"], this.invalidateGeometry, this);
            Watcher.watch(this, ["minElevation"], this.invalidateGeometry, this);

            this._heightImage = new Image();
            this._heightImage.crossOrigin = "Anonymous";
            this._heightImage.addEventListener("load", this.onHeightMapLoad.bind(this));
            this._heightImage.src = heightMapUrl;

            Binding.bindProperty(this, ["heightMapUrl"], this._heightImage, "src");
        }

        /**
         * 高度图加载完成
         */
        private onHeightMapLoad()
        {
            var canvasImg = document.createElement("canvas");
            canvasImg.width = this._heightImage.width;
            canvasImg.height = this._heightImage.height;

            var ctxt = canvasImg.getContext('2d');

            ctxt.drawImage(this._heightImage, 0, 0);
            var terrainHeightData = ctxt.getImageData(0, 0, this._heightImage.width, this._heightImage.height);//读取整张图片的像素。
            ctxt.putImageData(terrainHeightData, terrainHeightData.width, terrainHeightData.height);
            this._heightMap = terrainHeightData;

            this.invalidateGeometry();
        }

		/**
		 * 创建顶点坐标
		 */
        protected buildGeometry()
        {
            if (!this._heightMap)
                return;
            var x: number, z: number;
            var numInds: number = 0;
            var base: number = 0;
            //一排顶点数据
            var tw: number = this.segmentsW + 1;
            //总顶点数量
            var numVerts: number = (this.segmentsH + 1) * tw;
            //一个格子所占高度图X轴像素数
            var uDiv: number = (this._heightMap.width - 1) / this.segmentsW;
            //一个格子所占高度图Y轴像素数
            var vDiv: number = (this._heightMap.height - 1) / this.segmentsH;
            var u: number, v: number;
            var y: number;

            var vertices = new Float32Array(numVerts * 3);
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);

            numVerts = 0;
            var col: number;
            for (var zi: number = 0; zi <= this.segmentsH; ++zi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
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
            this.setVAData(GLAttribute.a_position, vertices, 3)
            this.buildUVs();
            this.setIndices(indices);
        }

		/**
		 * 创建uv坐标
		 */
        private buildUVs()
        {
            var numUvs: number = (this.segmentsH + 1) * (this.segmentsW + 1) * 2;
            var uvs = new Float32Array(numUvs);

            numUvs = 0;
            //计算每个顶点的uv坐标
            for (var yi: number = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
                {
                    uvs[numUvs++] = xi / this.segmentsW;
                    uvs[numUvs++] = 1 - yi / this.segmentsH;
                }
            }

            this.setVAData(GLAttribute.a_uv, uvs, 2);
        }

		/**
		 * 获取位置在（x，z）处的高度y值
		 * @param x x坐标
		 * @param z z坐标
		 * @return 高度
		 */
        public getHeightAt(x: number, z: number): number
        {

            //得到高度图中的值
            var u: number = (x / this.width + .5) * (this._heightMap.width - 1);
            var v: number = (-z / this.depth + .5) * (this._heightMap.height - 1);

            var col: number = this.getPixel(this._heightMap, u, v) & 0xff;

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