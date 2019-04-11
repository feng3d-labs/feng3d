namespace feng3d
{
    /**
     * 阴影类型
     */
    export enum ShadowType
    {
        /**
         * 没有阴影
         */
        No_Shadows = 0,
        /**
         * 硬阴影
         */
        Hard_Shadows = 1,
        /**
         * PCF 阴影
         */
        PCF_Shadows = 2,
        /**
         * PCF 软阴影
         */
        PCF_Soft_Shadows = 3,
    }
}