module feng3d
{

    /**
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    export class CapsuleGeometry extends Geometry
    {
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius = 50, height = 100, segmentsW = 16, segmentsH = 15, yUp = true)
        {
            super();

            this.buildGeometry(radius, height, segmentsW, segmentsH, yUp);

            var uvData = this.buildUVs(segmentsW, segmentsH);
            this.setVAData(GLAttribute.a_uv, uvData, 2);
            this.buildIndices(segmentsW, segmentsH, yUp);
        }

        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildGeometry(radius = 1, height = 1, segmentsW = 1, segmentsH = 1, yUp = true)
        {
            var vertexPositionData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);

            var startIndex: number;
            var index: number = 0;
            var comp1: number, comp2: number, t1: number, t2: number;
            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                startIndex = index;

                var horangle: number = Math.PI * yi / segmentsH;
                var z: number = -radius * Math.cos(horangle);
                var ringradius: number = radius * Math.sin(horangle);

                for (var xi: number = 0; xi <= segmentsW; ++xi)
                {
                    var verangle: number = 2 * Math.PI * xi / segmentsW;
                    var x: number = ringradius * Math.cos(verangle);
                    var y: number = ringradius * Math.sin(verangle);
                    var normLen: number = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen: number = Math.sqrt(y * y + x * x);
                    var offset: number = yi > segmentsH / 2 ? height / 2 : -height / 2;

                    if (yUp)
                    {
                        t1 = 0;
                        t2 = tanLen > .007 ? x / tanLen : 0;
                        comp1 = -z;
                        comp2 = y;
                    }
                    else
                    {
                        t1 = tanLen > .007 ? x / tanLen : 0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }

                    if (xi == segmentsW)
                    {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                        vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                        vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                        vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;

                        vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > .007 ? -y / tanLen : 1) * 0.5;
                        vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                        vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
                    }
                    else
                    {
                        vertexPositionData[index] = x;
                        vertexPositionData[index + 1] = yUp ? comp1 - offset : comp1;
                        vertexPositionData[index + 2] = yUp ? comp2 : comp2 + offset;

                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;

                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }

                    if (xi > 0 && yi > 0)
                    {

                        if (yi == segmentsH)
                        {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }

                    index += 3;
                }
            }
            this.setVAData(GLAttribute.a_position, vertexPositionData, 3);
            this.setVAData(GLAttribute.a_normal, vertexNormalData, 3);
            this.setVAData(GLAttribute.a_tangent, vertexTangentData, 3);
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

            var numIndices = 0;
            for (var yi: number = 0; yi <= segmentsH; ++yi)
            {
                for (var xi: number = 0; xi <= segmentsW; ++xi)
                {
                    if (xi > 0 && yi > 0)
                    {
                        var a: number = (segmentsW + 1) * yi + xi;
                        var b: number = (segmentsW + 1) * yi + xi - 1;
                        var c: number = (segmentsW + 1) * (yi - 1) + xi - 1;
                        var d: number = (segmentsW + 1) * (yi - 1) + xi;

                        if (yi == segmentsH)
                        {
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                        else if (yi == 1)
                        {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                        }
                        else
                        {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                    }
                }
            }
            this.setIndices(indices);
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
                    data[index++] = yi / segmentsH;
                }
            }

            return data;
        }

    }
}