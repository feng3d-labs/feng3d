namespace CANNON
{
    /**
     * 形状类型
     */
    export enum ShapeType
    {
        SPHERE = 1,
        PLANE = 2,
        BOX = 4,
        COMPOUND = 8,
        CONVEXPOLYHEDRON = 16,
        HEIGHTFIELD = 32,
        PARTICLE = 64,
        CYLINDER = 128,
        TRIMESH = 256
    }
}