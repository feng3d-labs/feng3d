namespace feng3d
{
    /**
     * 用于表示欧拉角的旋转顺序
     */
    export enum RotationOrder
    {
        /**
         * 依次按XYZ轴旋转。
         * 
         * feng3d默认旋转顺序。
         * 
         * playcanvas默认旋转顺序。
         */
        XYZ,
        /**
         * 依次按ZXY轴旋转。
         * 
         * unity默认旋转顺序。
         */
        ZXY,
        /**
         * 依次按ZYX轴旋转。
         * 
         * three.js默认旋转顺序。
         */
        ZYX,
    }
}