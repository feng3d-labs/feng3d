namespace feng3d
{
    /**
     * 用于表示欧拉角的旋转顺序
     * 
     * 如果顺序为XYZ，则依次按 ZYZ 轴旋转。为什么循序与定义相反？因为three.js中都这么定义，他们为什么这么定义就不清楚了。
     */
    export enum RotationOrder
    {
        /**
         * 依次按 ZYZ 轴旋转。
         *
         * feng3d默认旋转顺序。
         *
         * playcanvas默认旋转顺序。
         */
        XYZ,
        /**
         * 依次按 YXZ轴旋转。
         *
         * unity默认旋转顺序。
         */
        ZXY,
        /**
         * 依次按 XYZ 轴旋转。
         *
         * three.js默认旋转顺序。
         */
        ZYX,
        YXZ,
        YZX,
        XZY
    }
}