namespace CANNON
{
    /**
     * 形状类型
     */
    export enum ShapeType
    {
        /**
         * 球形
         */
        SPHERE = 1,
        /**
         * 平面
         */
        PLANE = 2,
        /**
         * 盒子
         */
        BOX = 4,
        COMPOUND = 8,
        CONVEXPOLYHEDRON = 16,
        HEIGHTFIELD = 32,
        PARTICLE = 64,
        CYLINDER = 128,
        TRIMESH = 256
    }
}