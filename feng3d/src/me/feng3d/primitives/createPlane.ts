module me.feng3d.primitives {

    /**
     * 创建平面几何体
     * @param width 宽度
     * @param height 高度
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     * @param elements 顶点元素列表
     */
    export function createPlane(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true, elements = [GLAttribute.position, GLAttribute.uv, GLAttribute.normal, GLAttribute.tangent]): Geometry {

        var geometry = new Geometry();

        elements.forEach(element => {
            switch (element) {
                case GLAttribute.position:
                    var vertexPositionData = buildPosition(width, height, segmentsW, segmentsH, yUp);
                    geometry.setVAData(element, vertexPositionData, 3);
                    break;
                case GLAttribute.normal:
                    var vertexNormalData = buildNormal(segmentsW, segmentsH, yUp);
                    geometry.setVAData(element, vertexNormalData, 3)
                    break;
                case GLAttribute.tangent:
                    var vertexTangentData = buildTangent(segmentsW, segmentsH, yUp);
                    geometry.setVAData(element, vertexTangentData, 3)
                    break;
                case GLAttribute.uv:
                    var uvData = buildUVs(segmentsW, segmentsH);
                    geometry.setVAData(element, uvData, 2);
                    break;
                default:
                    throw (`不支持为平面创建顶点属性 ${element}`);
            }
        });

        var indices = buildIndices(segmentsW, segmentsH, yUp);
        geometry.indices = indices;

        return geometry;
    }

    /**
     * 构建顶点坐标
     * @param width 宽度
     * @param height 高度
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     */
    function buildPosition(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true) {

        var vertexPositionData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
        var x: number, y: number;
        var positionIndex: number = 0;
        for (var yi: number = 0; yi <= segmentsH; ++yi) {
            for (var xi: number = 0; xi <= segmentsW; ++xi) {
                x = (xi / segmentsW - .5) * width;
                y = (yi / segmentsH - .5) * height;

                //设置坐标数据
                vertexPositionData[positionIndex++] = x;
                if (yUp) {
                    vertexPositionData[positionIndex++] = 0;
                    vertexPositionData[positionIndex++] = y;
                }
                else {
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
    function buildNormal(segmentsW = 1, segmentsH = 1, yUp = true) {

        var vertexNormalData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);

        var normalIndex: number = 0;
        for (var yi: number = 0; yi <= segmentsH; ++yi) {
            for (var xi: number = 0; xi <= segmentsW; ++xi) {

                //设置法线数据
                vertexNormalData[normalIndex++] = 0;
                if (yUp) {
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                }
                else {
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
    function buildTangent(segmentsW = 1, segmentsH = 1, yUp = true) {

        var vertexTangentData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
        var tangentIndex: number = 0;
        for (var yi: number = 0; yi <= segmentsH; ++yi) {
            for (var xi: number = 0; xi <= segmentsW; ++xi) {

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
    function buildIndices(segmentsW = 1, segmentsH = 1, yUp = true) {

        var indices = new Uint16Array(segmentsH * segmentsW * 6);
        var tw: number = segmentsW + 1;

        var numIndices = 0;
        var base: number;
        for (var yi: number = 0; yi <= segmentsH; ++yi) {
            for (var xi: number = 0; xi <= segmentsW; ++xi) {

                //生成索引数据
                if (xi != segmentsW && yi != segmentsH) {
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
    function buildUVs(segmentsW = 1, segmentsH = 1) {
        var data = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 2);
        var stride: number = 2;

        var index: number = 0;

        for (var yi: number = 0; yi <= this._segmentsH; ++yi) {
            for (var xi: number = 0; xi <= this._segmentsW; ++xi) {
                data[index++] = xi / this._segmentsW;
                data[index++] = 1 - yi / this._segmentsH;

                if (this._doubleSided) {
                    data[index++] = xi / this._segmentsW;
                    data[index++] = 1 - yi / this._segmentsH;
                }
            }
        }

        return data;
    }
}