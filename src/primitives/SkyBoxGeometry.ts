module feng3d
{

    /**
     * 天空盒几何体
     * @author feng 2016-09-12
     */
    export class SkyBoxGeometry extends Geometry
    {
        /**
         * 创建天空盒
         */
        constructor()
        {
            super();

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
            this.setVAData(GLAttribute.a_position, vertexPositionData, 3);

            //6个面，12个三角形，36个顶点索引
            var indices = new Uint16Array([ //
                0, 1, 2, 2, 3, 0, //
                6, 5, 4, 4, 7, 6, //
                2, 6, 7, 7, 3, 2, //
                4, 5, 1, 1, 0, 4, //
                4, 0, 3, 3, 7, 4, //
                2, 1, 5, 5, 6, 2 //
            ]);
            this.setIndices(indices);
        }
    }
}