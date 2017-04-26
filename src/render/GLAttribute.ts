module feng3d
{
    /**
     * opengl顶点属性名称
     */
    export class GLAttribute
    {
        /**
         * 坐标
         */
        public static a_position = "a_position";

        /**
         * 颜色
         */
        public static a_color = "a_color";

        /**
         * 法线
         */
        public static a_normal = "a_normal";

        /**
         * 切线
         */
        public static a_tangent = "a_tangent";

        /**
         * uv（纹理坐标）
         */
        public static a_uv = "a_uv";

        /**
         * 关节索引
         */
        public static a_jointindex0 = "a_jointindex0";

        /**
         * 关节权重
         */
        public static a_jointweight0 = "a_jointweight0";

        /**
         * 关节索引
         */
        public static a_jointindex1 = "a_jointindex1";

        /**
         * 关节权重
         */
        public static a_jointweight1 = "a_jointweight1";
    }
}