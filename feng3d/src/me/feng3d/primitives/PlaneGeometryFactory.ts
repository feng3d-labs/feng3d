module me.feng3d.primitives {

    /**
     * 创建
     */
    export function creatPlane(plane: PlanePrimitive): Geometry {

        var target = new Geometry();

        var vertexPositionData: number[] = [];
        var vertexNormalData: number[] = [];
        var vertexTangentData: number[] = [];
        var indices: number[] = [];
        var tw: number = this._segmentsW + 1;
        var vertexPositionStride: number = 3;
        var vertexNormalStride: number = 3;
        var vertexTangentStride: number = 3;

        var numIndices = 0;
        var positionIndex: number = 0;
        var normalIndex: number = 0;
        var tangentIndex: number = 0;
        var x: number, y: number;
        var base: number;
        for (var yi: number = 0; yi <= this._segmentsH; ++yi) {
            for (var xi: number = 0; xi <= this._segmentsW; ++xi) {
                x = (xi / this._segmentsW - .5) * this._width;
                y = (yi / this._segmentsH - .5) * this._height;

                //设置坐标数据
                vertexPositionData[positionIndex++] = x;
                if (this._yUp) {
                    vertexPositionData[positionIndex++] = 0;
                    vertexPositionData[positionIndex++] = y;
                }
                else {
                    vertexPositionData[positionIndex++] = y;
                    vertexPositionData[positionIndex++] = 0;
                }

                //设置法线数据
                vertexNormalData[normalIndex++] = 0;
                if (this._yUp) {
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                }
                else {
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = -1;
                }

                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;

                //复制反面数据
                if (this._doubleSided) {
                    for (var i: number = 0; i < 3; ++i) {
                        vertexPositionData[positionIndex] = vertexPositionData[positionIndex - vertexPositionStride];
                        ++positionIndex;
                    }
                    for (i = 0; i < 3; ++i) {
                        vertexPositionData[normalIndex] = -vertexPositionData[normalIndex - vertexNormalStride];
                        ++normalIndex;
                    }
                    for (i = 0; i < 3; ++i) {
                        vertexTangentData[tangentIndex] = -vertexTangentData[tangentIndex - vertexTangentStride];
                        ++tangentIndex;
                    }
                }

                //生成索引数据
                if (xi != this._segmentsW && yi != this._segmentsH) {
                    base = xi + yi * tw;
                    var mult: number = this._doubleSided ? 2 : 1;

                    indices[numIndices++] = base * mult;
                    indices[numIndices++] = (base + tw) * mult;
                    indices[numIndices++] = (base + tw + 1) * mult;
                    indices[numIndices++] = base * mult;
                    indices[numIndices++] = (base + tw + 1) * mult;
                    indices[numIndices++] = (base + 1) * mult;

                    //设置反面索引数据
                    if (this._doubleSided) {
                        indices[numIndices++] = (base + tw + 1) * mult + 1;
                        indices[numIndices++] = (base + tw) * mult + 1;
                        indices[numIndices++] = base * mult + 1;
                        indices[numIndices++] = (base + 1) * mult + 1;
                        indices[numIndices++] = (base + tw + 1) * mult + 1;
                        indices[numIndices++] = base * mult + 1;
                    }
                }
            }
        }

        target.setVAData(GLAttribute.position, vertexPositionData, vertexPositionStride)
        target.setVAData(GLAttribute.normal, vertexNormalData, vertexNormalStride)
        target.setVAData(GLAttribute.tangent, vertexTangentData, vertexTangentStride)

        target.indices = indices;

        return target;
    }
}