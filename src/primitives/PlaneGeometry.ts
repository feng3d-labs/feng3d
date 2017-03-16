module feng3d
{

    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    export class PlaneGeometry extends Geometry
    {

        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(public width = 100, public height = 100, public segmentsW = 1, public segmentsH = 1, public yUp = true)
        {
            super();

            Watcher.watch(this, ["width"], this.invalidateGeometry, this);
            Watcher.watch(this, ["height"], this.invalidateGeometry, this);
            Watcher.watch(this, ["segmentsW"], this.invalidateGeometry, this);
            Watcher.watch(this, ["segmentsH"], this.invalidateGeometry, this);
            Watcher.watch(this, ["yUp"], this.invalidateGeometry, this);
        }

        /**
         * 构建几何体数据
         */
        protected buildGeometry()
        {
            var vertexPositionData = this.buildPosition();
            this.setVAData(GLAttribute.a_position, vertexPositionData, 3);

            var vertexNormalData = this.buildNormal();
            this.setVAData(GLAttribute.a_normal, vertexNormalData, 3)

            var vertexTangentData = this.buildTangent();
            this.setVAData(GLAttribute.a_tangent, vertexTangentData, 3)

            var uvData = this.buildUVs();
            this.setVAData(GLAttribute.a_uv, uvData, 2);

            var indices = this.buildIndices();
            this.setIndices(indices);
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
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var x: number, y: number;
            var positionIndex: number = 0;
            for (var yi: number = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
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
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);

            var normalIndex: number = 0;
            for (var yi: number = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
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
                        vertexNormalData[normalIndex++] = -1;
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
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var tangentIndex: number = 0;
            for (var yi: number = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
                {

                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
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
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var tw: number = this.segmentsW + 1;

            var numIndices = 0;
            var base: number;
            for (var yi: number = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
                {

                    //生成索引数据
                    if (xi != this.segmentsW && yi != this.segmentsH)
                    {
                        base = xi + yi * tw;

                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base + 1;
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
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index: number = 0;

            for (var yi: number = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= this.segmentsW; ++xi)
                {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = 1 - yi / this.segmentsH;
                }
            }

            return data;
        }
    }
}