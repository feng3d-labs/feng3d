module me.feng3d.primitives {

    /**
     * 创建圆柱体
     */
    export function createCylinder(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1,
        topClosed = true, bottomClosed = true, surfaceClosed = true, yUp = true,
        elements = [GLAttribute.position, GLAttribute.uv, GLAttribute.normal, GLAttribute.tangent]): Geometry {

        var geometry = new Geometry();

        var geometryData = buildGeometry(topRadius, bottomRadius, height, segmentsW, segmentsH,
            topClosed, bottomClosed, surfaceClosed, yUp);

        elements.forEach(element => {
            switch (element) {
                case GLAttribute.position:
                    var vertexPositionData = geometryData[element];
                    geometry.setVAData(element, vertexPositionData, 3);
                    break;
                case GLAttribute.normal:
                    var vertexNormalData = geometryData[element];
                    geometry.setVAData(element, vertexNormalData, 3);
                    break;
                case GLAttribute.tangent:
                    var vertexTangentData = geometryData[element];
                    geometry.setVAData(element, vertexTangentData, 3);
                    break;
                case GLAttribute.uv:
                    var uvData = buildUVs(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
                    geometry.setVAData(element, uvData, 2);
                    break;
                default:
                    throw (`不支持为胶囊体创建顶点属性 ${element}`);
            }
        });

        var indices = buildIndices(topRadius, bottomRadius, height, segmentsW, segmentsH,
            topClosed, bottomClosed, surfaceClosed);
        geometry.indices = indices;

        return geometry;
    }

    /**
     * 计算几何体顶点数
     */
    function getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed) {
        var numVertices: number = 0;
        if (surfaceClosed)
            numVertices += (segmentsH + 1) * (segmentsW + 1);
        if (topClosed)
            numVertices += 2 * (segmentsW + 1);
        if (bottomClosed)
            numVertices += 2 * (segmentsW + 1);
        return numVertices
    }

    /**
     * 计算几何体三角形数量
     */
    function getNumTriangles(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed) {
        var numTriangles: number = 0;
        if (surfaceClosed)
            numTriangles += segmentsH * segmentsW * 2;
        if (topClosed)
            numTriangles += segmentsW;
        if (bottomClosed)
            numTriangles += segmentsW;
        return numTriangles;
    }

    /**
     * 构建几何体数据
     */
    function buildGeometry(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1,
        topClosed = true, bottomClosed = true, surfaceClosed = true, yUp = true) {
        var i: number, j: number, index: number = 0;
        var x: number, y: number, z: number, radius: number, revolutionAngle: number;
        var dr: number, latNormElev: number, latNormBase: number;

        var comp1: number, comp2: number;
        var startIndex: number = 0;
        var t1: number, t2: number;

        var numVertices: number = getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);

        var vertexPositionData = new Float32Array(numVertices * 3);
        var vertexNormalData = new Float32Array(numVertices * 3);
        var vertexTangentData = new Float32Array(numVertices * 3);

        var revolutionAngleDelta: number = 2 * Math.PI / segmentsW;

        // 顶部
        if (topClosed && topRadius > 0) {
            z = -0.5 * height;

            for (i = 0; i <= segmentsW; ++i) {
                // 中心顶点
                if (yUp) {
                    t1 = 1;
                    t2 = 0;
                    comp1 = -z;
                    comp2 = 0;
                }
                else {
                    t1 = 0;
                    t2 = -1;
                    comp1 = 0;
                    comp2 = z;
                }

                addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);

                // 旋转顶点
                revolutionAngle = i * revolutionAngleDelta;
                x = topRadius * Math.cos(revolutionAngle);
                y = topRadius * Math.sin(revolutionAngle);

                if (yUp) {
                    comp1 = -z;
                    comp2 = y;
                }
                else {
                    comp1 = y;
                    comp2 = z;
                }

                if (i == segmentsW) {
                    addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5],
                        0, t1, t2, 1, 0, 0);
                }
                else {
                    addVertex(x, comp1, comp2,
                        0, t1, t2, 1, 0, 0);
                }
            }
        }

        // 底部
        if (bottomClosed && bottomRadius > 0) {
            z = 0.5 * height;
            startIndex = index;
            for (i = 0; i <= segmentsW; ++i) {
                // 中心顶点
                if (yUp) {
                    t1 = -1;
                    t2 = 0;
                    comp1 = -z;
                    comp2 = 0;
                }
                else {
                    t1 = 0;
                    t2 = 1;
                    comp1 = 0;
                    comp2 = z;
                }

                addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);

                // 旋转顶点
                revolutionAngle = i * revolutionAngle;
                x = bottomRadius * Math.cos(revolutionAngle);
                y = bottomRadius * Math.sin(revolutionAngle);

                if (yUp) {
                    comp1 = -z;
                    comp2 = y;
                }
                else {
                    comp1 = y;
                    comp2 = z;
                }

                if (i == segmentsW) {
                    addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2],
                        0, t1, t2, 1, 0, 0);
                }
                else {
                    addVertex(x, comp1, comp2,
                        0, t1, t2, 1, 0, 0);
                }
            }
        }

        // 侧面
        dr = bottomRadius - topRadius;
        latNormElev = dr / height;
        latNormBase = (latNormElev == 0) ? 1 : height / dr;

        if (surfaceClosed) {
            var a: number, b: number, c: number, d: number;
            var na0: number, na1: number, naComp1: number, naComp2: number;

            for (j = 0; j <= segmentsH; ++j) {
                radius = topRadius - ((j / segmentsH) * (topRadius - bottomRadius));
                z = -(height / 2) + (j / segmentsH * height);

                startIndex = index;
                for (i = 0; i <= segmentsW; ++i) {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = radius * Math.cos(revolutionAngle);
                    y = radius * Math.sin(revolutionAngle);
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);

                    if (yUp) {
                        t1 = 0;
                        t2 = -na0;
                        comp1 = -z;
                        comp2 = y;
                        naComp1 = latNormElev;
                        naComp2 = na1;
                    }
                    else {
                        t1 = -na0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                        naComp1 = na1;
                        naComp2 = latNormElev;
                    }

                    if (i == segmentsW) {
                        addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2],
                            na0, latNormElev, na1,
                            na1, t1, t2);
                    }
                    else {
                        addVertex(x, comp1, comp2,
                            na0, naComp1, naComp2,
                            -na1, t1, t2);
                    }
                }
            }
        }

        var result = {};
        result[GLAttribute.position] = vertexPositionData;
        result[GLAttribute.normal] = vertexNormalData;
        result[GLAttribute.tangent] = vertexTangentData;
        return result;

        function addVertex(px: number, py: number, pz: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number) {
            vertexPositionData[index] = px;
            vertexPositionData[index + 1] = py;
            vertexPositionData[index + 2] = pz;

            vertexNormalData[index] = nx;
            vertexNormalData[index + 1] = ny;
            vertexNormalData[index + 2] = nz;

            vertexTangentData[index] = tx;
            vertexTangentData[index + 1] = ty;
            vertexTangentData[index + 2] = tz;

            index += 3;
        }
    }

    /**
     * 构建顶点索引
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     */
    function buildIndices(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1,
        topClosed = true, bottomClosed = true, surfaceClosed = true) {

        var i: number, j: number, index: number = 0;
        var numTriangles: number = getNumTriangles(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);

        var indices = new Uint16Array(numTriangles * 3);
        var numIndices = 0;
        // 顶部
        if (topClosed && topRadius > 0) {
            for (i = 0; i <= segmentsW; ++i) {
                index += 2;
                if (i > 0)
                    addTriangleClockWise(index - 1, index - 3, index - 2);
            }
        }

        // 底部
        if (bottomClosed && bottomRadius > 0) {
            for (i = 0; i <= segmentsW; ++i) {
                index += 2;
                if (i > 0)
                    addTriangleClockWise(index - 2, index - 3, index - 1);
            }
        }

        // 侧面
        if (surfaceClosed) {
            var a: number, b: number, c: number, d: number;
            for (j = 0; j <= segmentsH; ++j) {
                for (i = 0; i <= segmentsW; ++i) {
                    index++;
                    if (i > 0 && j > 0) {
                        a = index - 1;
                        b = index - 2;
                        c = b - segmentsW - 1;
                        d = a - segmentsW - 1;

                        addTriangleClockWise(a, b, c);
                        addTriangleClockWise(a, c, d);
                    }
                }
            }
        }

        return indices;

        function addTriangleClockWise(cwVertexIndex0: number, cwVertexIndex1: number, cwVertexIndex2: number) {
            indices[numIndices++] = cwVertexIndex0;
            indices[numIndices++] = cwVertexIndex1;
            indices[numIndices++] = cwVertexIndex2;
        }
    }

    /**
     * 构建uv
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     */
    function buildUVs(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed) {
        var i: number, j: number;
        var x: number, y: number, revolutionAngle: number;
        var numVertices: number = getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed)

        var data = new Float32Array(numVertices * 2);
        var revolutionAngleDelta: number = 2 * Math.PI / segmentsW;
        var index: number = 0;

        // 顶部
        if (topClosed) {
            for (i = 0; i <= segmentsW; ++i) {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);

                // 中心顶点
                data[index++] = 0.5;
                data[index++] = 0.5;
                // 旋转顶点
                data[index++] = x;
                data[index++] = y;
            }
        }
        // 底部
        if (bottomClosed) {
            for (i = 0; i <= segmentsW; ++i) {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);

                // 中心顶点
                data[index++] = 0.5;
                data[index++] = 0.5;
                // 旋转顶点
                data[index++] = x;
                data[index++] = y;
            }
        }
        // 侧面
        if (surfaceClosed) {
            for (j = 0; j <= segmentsH; ++j) {
                for (i = 0; i <= segmentsW; ++i) {
                    // 旋转顶点
                    data[index++] = (i / segmentsW);
                    data[index++] = (j / segmentsH);
                }
            }
        }

        return data;
    }
}