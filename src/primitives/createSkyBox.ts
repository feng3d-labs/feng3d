module feng3d.primitives {
    /**
     * 创建天空盒
     */
    export function createSkyBox(): Geometry {

        var geometry = new Geometry();

        //八个顶点，32个number
        var vertexPositionData = new Float32Array([ //
            -1, 1, -1,//
            1, 1, -1, //
            1, 1, 1, //
            -1, 1, 1, //
            -1, -1, -1,//
            1, -1, -1, //
            1, -1, 1,//
            -1, -1, 1 //
        ]);
        geometry.setVAData(GLAttribute.position, vertexPositionData, 3);

        //6个面，12个三角形，36个顶点索引
        var indices = new Uint16Array([ //
            0, 1, 2, 2, 3, 0, //
            6, 5, 4, 4, 7, 6, //
            2, 6, 7, 7, 3, 2, //
            4, 5, 1, 1, 0, 4, //
            4, 0, 3, 3, 7, 4, //
            2, 1, 5, 5, 6, 2 //
        ]);
        geometry.setIndices(indices);
        return geometry;
    }
}