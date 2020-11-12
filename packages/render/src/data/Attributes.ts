namespace feng3d
{
    export interface Attributes
    {
        /**
         * 坐标
         */
        a_position: Attribute;

        /**
         * 颜色
         */
        a_color: Attribute;

        /**
         * 法线
         */
        a_normal: Attribute;

        /**
         * 切线
         */
        a_tangent: Attribute;

        /**
         * uv（纹理坐标）
         */
        a_uv: Attribute;

        /**
         * 关节索引
         */
        a_skinIndices: Attribute;

        /**
         * 关节权重
         */
        a_skinWeights: Attribute;

        /**
         * 关节索引
         */
        a_skinIndices1: Attribute;

        /**
         * 关节权重
         */
        a_skinWeights1: Attribute;
    }

}