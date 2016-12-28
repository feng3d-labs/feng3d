module feng3d {

    /**
     * 渲染数据编号
     * @author feng 2016-06-20
     */
    export class RenderDataID {

        /**
         * 顶点索引
         */
        static index = "index";

        /**
         * 模型矩阵
         */
        static u_modelMatrix = "u_modelMatrix";

        /**
         * 世界投影矩阵
         */
        static u_viewProjection = "u_viewProjection";

        static u_diffuseInput = "u_diffuseInput";

        static s_texture = "s_texture";
        /**
         * 天空盒纹理
         */
        static s_skyboxTexture = "s_skyboxTexture";

        /**
         * 摄像机矩阵
         */
        static u_cameraMatrix = "u_cameraMatrix";
    }
}