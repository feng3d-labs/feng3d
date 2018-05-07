namespace feng3d
{

    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    export class PlaneGeometry extends Geometry
    {
        @oav()
        @serialize
        get width()
        {
            return this._width;
        }
        set width(value)
        {
            if (this._width == value)
                return;
            this._width = value;
            this.invalidateGeometry();
        }
        private _width = 1;

        @oav()
        @serialize
        get height()
        {
            return this._height;
        }
        set height(value)
        {
            if (this._height == value)
                return;
            this._height = value;
            this.invalidateGeometry();
        }
        private _height = 1;

        @oav()
        @serialize
        get segmentsW()
        {
            return this._segmentsW;
        }
        set segmentsW(value)
        {
            if (this._segmentsW == value)
                return;
            this._segmentsW = value;
            this.invalidateGeometry();
        }
        private _segmentsW = 1;

        @oav()
        @serialize
        get segmentsH()
        {
            return this._segmentsH;
        }
        set segmentsH(value)
        {
            if (this._segmentsH == value)
                return;
            this._segmentsH = value;
            this.invalidateGeometry();
        }
        private _segmentsH = 1;

        @oav()
        @serialize
        get yUp()
        {
            return this._yUp;
        }
        set yUp(value)
        {
            if (this._yUp == value)
                return;
            this._yUp = value;
            this.invalidateGeometry();
        }
        private _yUp = true;

        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(width = 1, height = 1, segmentsW = 1, segmentsH = 1, yUp = true)
        {
            super();

            this.name = "Plane";
            this.width = width;
            this.height = height;
            this.segmentsW = segmentsW;
            this.segmentsH = segmentsH;
            this.yUp = yUp;
        }

        /**
         * 构建几何体数据
         */
        protected buildGeometry()
        {
            var vertexPositionData = this.buildPosition();
            this.setVAData("a_position", vertexPositionData, 3);

            var vertexNormalData = this.buildNormal();
            this.setVAData("a_normal", vertexNormalData, 3)

            var vertexTangentData = this.buildTangent();
            this.setVAData("a_tangent", vertexTangentData, 3)

            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);

            var indices = this.buildIndices();
            this.indices = indices;
        }

        /**
         * 构建顶点坐标
         * @param this.width 宽度
         * @param this.height 高度
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildPosition()
        {
            var vertexPositionData: number[] = [];
            var x: number, y: number;
            var positionIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    x = (xi / this.segmentsW - .5) * this.width;
                    y = (yi / this.segmentsH - .5) * this.height;

                    //设置坐标数据
                    vertexPositionData[positionIndex++] = x;
                    if (this.yUp)
                    {
                        vertexPositionData[positionIndex++] = 0;
                        vertexPositionData[positionIndex++] = y;
                    }
                    else
                    {
                        vertexPositionData[positionIndex++] = y;
                        vertexPositionData[positionIndex++] = 0;
                    }
                }
            }
            return vertexPositionData;
        }

        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal()
        {
            var vertexNormalData: number[] = [];

            var normalIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {

                    //设置法线数据
                    vertexNormalData[normalIndex++] = 0;
                    if (this.yUp)
                    {
                        vertexNormalData[normalIndex++] = 1;
                        vertexNormalData[normalIndex++] = 0;
                    }
                    else
                    {
                        vertexNormalData[normalIndex++] = 0;
                        vertexNormalData[normalIndex++] = 1;
                    }
                }
            }
            return vertexNormalData;
        }

        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent()
        {
            var vertexTangentData: number[] = [];
            var tangentIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    if (this.yUp)
                    {
                        vertexTangentData[tangentIndex++] = 1;
                        vertexTangentData[tangentIndex++] = 0;
                        vertexTangentData[tangentIndex++] = 0;
                    }
                    else
                    {
                        vertexTangentData[tangentIndex++] = -1;
                        vertexTangentData[tangentIndex++] = 0;
                        vertexTangentData[tangentIndex++] = 0;
                    }
                }
            }
            return vertexTangentData;
        }

        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices()
        {
            var indices: number[] = [];
            var tw = this.segmentsW + 1;

            var numIndices = 0;
            var base: number;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    //生成索引数据
                    if (xi != this.segmentsW && yi != this.segmentsH)
                    {
                        base = xi + yi * tw;
                        if (this.yUp)
                        {
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + tw;
                            indices[numIndices++] = base + tw + 1;
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + tw + 1;
                            indices[numIndices++] = base + 1;
                        } else
                        {
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + tw + 1;
                            indices[numIndices++] = base + tw;
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + 1;
                            indices[numIndices++] = base + tw + 1;
                        }
                    }
                }
            }

            return indices;
        }

        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs()
        {
            var data: number[] = [];
            var index = 0;

            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    if (this.yUp)
                    {
                        data[index++] = xi / this.segmentsW;
                        data[index++] = 1 - yi / this.segmentsH;
                    } else
                    {
                        data[index++] = 1 - xi / this.segmentsW;
                        data[index++] = 1 - yi / this.segmentsH;
                    }
                }
            }

            return data;
        }
    }
}