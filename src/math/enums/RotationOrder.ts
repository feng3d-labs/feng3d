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
         * 依次按 ZYX 轴旋转。
         *
         * three.js默认旋转顺序。
         */
        XYZ = 0,
        /**
         * 依次按 YXZ 轴旋转。
         */
        ZXY = 1,
        /**
         * 依次按 XYZ 轴旋转。
         *
         * playcanvas默认旋转顺序。
         */
        ZYX = 2,
        /**
         * 依次按 ZXY 轴旋转。
         * 
         * unity默认旋转顺序。
         */
        YXZ = 3,
        /**
         * 依次按 XZY 轴旋转。
         */
        YZX = 4,
        /**
         * 依次按 YZX 轴旋转。
         */
        XZY = 5,
    }
    
    /**
     * 引擎中使用的旋转顺序。
     * 
     * unity YXZ
     * playcanvas ZYX
     * three.js XYZ
     */
    export var defaultRotationOrder = RotationOrder.YXZ;
}