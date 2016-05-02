module me.feng3d.primitives {

    /**
     * 创建立方几何体
     * @param width 宽度
     */
    export function createCube(width = 100, height = 100, depth = 100, segmentsW = 1, segmentsH = 1, segmentsD = 1, tile6 = true, elements = [GLAttribute.position, GLAttribute.uv, GLAttribute.normal, GLAttribute.tangent]) {

        var geometry = new Geometry();
        elements.forEach(element => {
            switch (element) {
                case GLAttribute.position:
                    var vertexPositionData = buildPosition(width, height, depth, segmentsW, segmentsH, segmentsD);
                    geometry.setVAData(element, vertexPositionData, 3);
                    break;
                case GLAttribute.normal:
                    var vertexNormalData = buildNormal(segmentsW, segmentsH, segmentsD);
                    geometry.setVAData(element, vertexNormalData, 3)
                    break;
                case GLAttribute.tangent:
                    var vertexTangentData = buildTangent(segmentsW, segmentsH, segmentsD);
                    geometry.setVAData(element, vertexTangentData, 3)
                    break;
                case GLAttribute.uv:
                    var uvData = buildUVs(segmentsW, segmentsH, segmentsD, tile6);
                    geometry.setVAData(element, uvData, 2);
                    break;
                default:
                    throw (`不支持为平面创建顶点属性 ${element}`);
            }
        });

        var indices = buildIndices(segmentsW, segmentsH, segmentsD);
        geometry.indices = indices;

        return geometry;
    }

    function buildPosition(width = 100, height = 100, depth = 100, segmentsW = 1, segmentsH = 1, segmentsD = 1) {

        var vertexPositionData = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 3);

        var i: number, j: number;

        var hw: number, hh: number, hd: number; // halves
        var dw: number, dh: number, dd: number; // deltas

        var outer_pos: number;

        // Indices
        var positionIndex: number = 0;

        // half cube dimensions
        hw = width / 2;
        hh = height / 2;
        hd = depth / 2;

        // Segment dimensions
        dw = width / segmentsW;
        dh = height / segmentsH;
        dd = depth / segmentsD;

        for (i = 0; i <= segmentsW; i++) {
            outer_pos = -hw + i * dw;

            for (j = 0; j <= segmentsH; j++) {
                // front
                vertexPositionData[positionIndex++] = outer_pos;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = -hd;

                // back
                vertexPositionData[positionIndex++] = outer_pos;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = hd;
            }
        }

        for (i = 0; i <= segmentsW; i++) {
            outer_pos = -hw + i * dw;

            for (j = 0; j <= segmentsD; j++) {
                // top
                vertexPositionData[positionIndex++] = outer_pos;
                vertexPositionData[positionIndex++] = hh;
                vertexPositionData[positionIndex++] = -hd + j * dd;

                // bottom
                vertexPositionData[positionIndex++] = outer_pos;
                vertexPositionData[positionIndex++] = -hh;
                vertexPositionData[positionIndex++] = -hd + j * dd;
            }
        }

        for (i = 0; i <= segmentsD; i++) {
            outer_pos = hd - i * dd;

            for (j = 0; j <= segmentsH; j++) {
                // left
                vertexPositionData[positionIndex++] = -hw;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = outer_pos;

                // right
                vertexPositionData[positionIndex++] = hw;
                vertexPositionData[positionIndex++] = -hh + j * dh;
                vertexPositionData[positionIndex++] = outer_pos;
            }
        }

        return vertexPositionData;
    }

    function buildNormal(segmentsW = 1, segmentsH = 1, segmentsD = 1) {
        var vertexNormalData = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 3);

        var i: number, j: number;

        // Indices
        var normalIndex: number = 0;

        for (i = 0; i <= segmentsW; i++) {

            for (j = 0; j <= segmentsH; j++) {
                // front
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = -1;

                // back
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 1;
            }
        }

        for (i = 0; i <= segmentsW; i++) {

            for (j = 0; j <= segmentsD; j++) {
                // top
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 1;
                vertexNormalData[normalIndex++] = 0;

                // bottom
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = -1;
                vertexNormalData[normalIndex++] = 0;
            }
        }

        for (i = 0; i <= segmentsD; i++) {

            for (j = 0; j <= segmentsH; j++) {
                // left
                vertexNormalData[normalIndex++] = -1;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;

                // right
                vertexNormalData[normalIndex++] = 1;
                vertexNormalData[normalIndex++] = 0;
                vertexNormalData[normalIndex++] = 0;
            }
        }
        return new Float32Array(vertexNormalData);
    }

    function buildTangent(segmentsW = 1, segmentsH = 1, segmentsD = 1) {

        var vertexTangentData = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 3);

        var i: number, j: number;

        // Indices
        var tangentIndex: number = 0;

        for (i = 0; i <= segmentsW; i++) {

            for (j = 0; j <= segmentsH; j++) {
                // front
                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;

                // back
                vertexTangentData[tangentIndex++] = -1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
            }
        }

        for (i = 0; i <= segmentsW; i++) {

            for (j = 0; j <= segmentsD; j++) {
                // top
                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;

                // bottom
                vertexTangentData[tangentIndex++] = 1;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
            }
        }

        for (i = 0; i <= segmentsD; i++) {

            for (j = 0; j <= segmentsH; j++) {
                // left
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = -1;

                // right
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 0;
                vertexTangentData[tangentIndex++] = 1;
            }
        }

        return vertexTangentData;
    }

    function buildIndices(segmentsW = 1, segmentsH = 1, segmentsD = 1) {

        var indices: number[] = [];

        var tl: number, tr: number, bl: number, br: number;
        var i: number, j: number, inc: number = 0;

        var fidx: number = 0;

        for (i = 0; i <= segmentsW; i++) {

            for (j = 0; j <= segmentsH; j++) {
                // front
                // back
                if (i && j) {
                    tl = 2 * ((i - 1) * (segmentsH + 1) + (j - 1));
                    tr = 2 * (i * (segmentsH + 1) + (j - 1));
                    bl = tl + 2;
                    br = tr + 2;

                    indices[fidx++] = tl;
                    indices[fidx++] = bl;
                    indices[fidx++] = br;
                    indices[fidx++] = tl;
                    indices[fidx++] = br;
                    indices[fidx++] = tr;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = br + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tl + 1;
                }
            }
        }

        inc += 2 * (segmentsW + 1) * (segmentsH + 1);

        for (i = 0; i <= segmentsW; i++) {

            for (j = 0; j <= segmentsD; j++) {
                // top
                // bottom
                if (i && j) {
                    tl = inc + 2 * ((i - 1) * (segmentsD + 1) + (j - 1));
                    tr = inc + 2 * (i * (segmentsD + 1) + (j - 1));
                    bl = tl + 2;
                    br = tr + 2;

                    indices[fidx++] = tl;
                    indices[fidx++] = bl;
                    indices[fidx++] = br;
                    indices[fidx++] = tl;
                    indices[fidx++] = br;
                    indices[fidx++] = tr;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = br + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tl + 1;
                }
            }
        }

        inc += 2 * (segmentsW + 1) * (segmentsD + 1);

        for (i = 0; i <= segmentsD; i++) {

            for (j = 0; j <= segmentsH; j++) {
                // left
                // right

                if (i && j) {
                    tl = inc + 2 * ((i - 1) * (segmentsH + 1) + (j - 1));
                    tr = inc + 2 * (i * (segmentsH + 1) + (j - 1));
                    bl = tl + 2;
                    br = tr + 2;

                    indices[fidx++] = tl;
                    indices[fidx++] = bl;
                    indices[fidx++] = br;
                    indices[fidx++] = tl;
                    indices[fidx++] = br;
                    indices[fidx++] = tr;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = br + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tr + 1;
                    indices[fidx++] = bl + 1;
                    indices[fidx++] = tl + 1;
                }
            }
        }

        return indices;
    }

    function buildUVs(segmentsW = 1, segmentsH = 1, segmentsD = 1, tile6 = true) {
        var i: number, j: number, uidx: number;
        var data = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 2);

        var u_tile_dim: number, v_tile_dim: number;
        var u_tile_step: number, v_tile_step: number;
        var tl0u: number, tl0v: number;
        var tl1u: number, tl1v: number;
        var du: number, dv: number;

        if (tile6) {
            u_tile_dim = u_tile_step = 1 / 3;
            v_tile_dim = v_tile_step = 1 / 2;
        }
        else {
            u_tile_dim = v_tile_dim = 1;
            u_tile_step = v_tile_step = 0;
        }

        // Create planes two and two, the same way that they were
        // constructed in the this.buildGeometry() function. First calculate
        // the top-left UV coordinate for both planes, and then loop
        // over the points, calculating the UVs from these numbers.

        // When this.tile6 is true, the layout is as follows:
        //       .-----.-----.-----. (1,1)
        //       | Bot |  T  | Bak |
        //       |-----+-----+-----|
        //       |  L  |  F  |  R  |
        // (0,0)'-----'-----'-----'

        uidx = 0;

        // FRONT / BACK
        tl0u = 1 * u_tile_step;
        tl0v = 1 * v_tile_step;
        tl1u = 2 * u_tile_step;
        tl1v = 0 * v_tile_step;
        du = u_tile_dim / segmentsW;
        dv = v_tile_dim / segmentsH;
        for (i = 0; i <= segmentsW; i++) {
            for (j = 0; j <= segmentsH; j++) {
                data[uidx++] = tl0u + i * du;
                data[uidx++] = tl0v + (v_tile_dim - j * dv);
                data[uidx++] = tl1u + (u_tile_dim - i * du);
                data[uidx++] = tl1v + (v_tile_dim - j * dv);
            }
        }

        // TOP / BOTTOM
        tl0u = 1 * u_tile_step;
        tl0v = 0 * v_tile_step;
        tl1u = 0 * u_tile_step;
        tl1v = 0 * v_tile_step;
        du = u_tile_dim / segmentsW;
        dv = v_tile_dim / segmentsD;
        for (i = 0; i <= segmentsW; i++) {
            for (j = 0; j <= segmentsD; j++) {
                data[uidx++] = tl0u + i * du;
                data[uidx++] = tl0v + (v_tile_dim - j * dv);
                data[uidx++] = tl1u + i * du;
                data[uidx++] = tl1v + j * dv;
            }
        }

        // LEFT / RIGHT
        tl0u = 0 * u_tile_step;
        tl0v = 1 * v_tile_step;
        tl1u = 2 * u_tile_step;
        tl1v = 1 * v_tile_step;
        du = u_tile_dim / segmentsD;
        dv = v_tile_dim / segmentsH;
        for (i = 0; i <= segmentsD; i++) {
            for (j = 0; j <= segmentsH; j++) {
                data[uidx++] = tl0u + i * du;
                data[uidx++] = tl0v + (v_tile_dim - j * dv);
                data[uidx++] = tl1u + (u_tile_dim - i * du);
                data[uidx++] = tl1v + (v_tile_dim - j * dv);
            }
        }

        return data;
    }
}