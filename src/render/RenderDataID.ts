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

        /**
         * 漫反射贴图
         */
        static s_texture = "s_texture";
        /**
         * 天空盒纹理
         */
        static s_skyboxTexture = "s_skyboxTexture";

        /**
         * 摄像机矩阵
         */
        static u_cameraMatrix = "u_cameraMatrix";
        /**
         * 天空盒尺寸
         */
        static u_skyBoxSize = "u_skyBoxSize";

        /**
         * 地形混合贴图
         */
        static s_blendTexture = "s_blendTexture";

        /**
         * 地形块贴图1
         */
        static s_splatTexture1 = "s_splatTexture1";
        /**
         * 地形块贴图2
         */
        static s_splatTexture2 = "s_splatTexture2";
        /**
         * 地形块贴图3
         */
        static s_splatTexture3 = "s_splatTexture3";
        /**
         * 地形块重复次数
         */
        static u_splatRepeats = "u_splatRepeats";
    }
}