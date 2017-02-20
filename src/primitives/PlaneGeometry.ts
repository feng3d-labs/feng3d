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
        constructor(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true)
        {

            super();

            var vertexPositionData = this.buildPosition(width, height, segmentsW, segmentsH, yUp);
            this.setVAData(GLAttribute.a_position, vertexPositionData, 3);

            var vertexNormalData = this.buildNormal(segmentsW, segmentsH, yUp);
            this.setVAData(GLAttribute.a_normal, vertexNormalData, 3)

            var vertexTangentData = this.buildTangent(segmentsW, segmentsH, yUp);
            this.setVAData(GLAttribute.a_tangent, vertexTangentData, 3)

            var uvData = this.buildUVs(segmentsW, segmentsH);
            this.setVAData(GLAttribute.a_uv, uvData, 2);

            var indices = this.buildIndices(segmentsW, segmentsH, yUp);
            this.setIndices(indices);
        }

        /**
         * 构建顶点坐标
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildPosition(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true)
        {

            var vertexPositionData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var x: number, y: number;
            var positionIndex: number = 0;
            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= segmentsW; ++xi)
                {
                    x = (xi / segmentsW - .5) * width;
                    y = (yi / segmentsH - .5) * height;

                    //设置坐标数据
                    vertexPositionData[positionIndex++] = x;
                    if (yUp)
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
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal(segmentsW = 1, segmentsH = 1, yUp = true)
        {

            var vertexNormalData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);

            var normalIndex: number = 0;
            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= segmentsW; ++xi)
                {

                    //设置法线数据
                    vertexNormalData[normalIndex++] = 0;
                    if (yUp)
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
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent(segmentsW = 1, segmentsH = 1, yUp = true)
        {

            var vertexTangentData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var tangentIndex: number = 0;
            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= segmentsW; ++xi)
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
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices(segmentsW = 1, segmentsH = 1, yUp = true)
        {

            var indices = new Uint16Array(segmentsH * segmentsW * 6);
            var tw: number = segmentsW + 1;

            var numIndices = 0;
            var base: number;
            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= segmentsW; ++xi)
                {

                    //生成索引数据
                    if (xi != segmentsW && yi != segmentsH)
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
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs(segmentsW = 1, segmentsH = 1)
        {
            var data = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 2);
            var index: number = 0;

            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= segmentsW; ++xi)
                {
                    data[index++] = xi / segmentsW;
                    data[index++] = 1 - yi / segmentsH;
                }
            }

            return data;
        }
    }
}