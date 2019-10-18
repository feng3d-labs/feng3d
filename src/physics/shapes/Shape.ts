namespace CANNON
{
    export abstract class Shape
    {
        /**
         * 编号
         */
        id: number;

        /**
         * 形状类型
         */
        type: ShapeType = 0;

        /**
         * 此形状的局部包围球半径
         */
        boundingSphereRadius = 0;

        /**
         * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
         * 是否响应碰撞
         */
        collisionResponse = true;

        collisionFilterGroup = 1;

        collisionFilterMask = -1;

        /**
         * 材质
         */
        material: Material = null;

        /**
         * 物体
         */
        body: Body = null;

        /**
         * 面数组
         */
        faces: number[][];
        /**
         * 顶点索引数组
         */
        indices: number[];
        /**
         * 顶点坐标数组
         */
        vertices: feng3d.Vector3[] | number[];
        /**
         * 面法线数组
         */
        faceNormals: feng3d.Vector3[];

        /**
         * 半径
         */
        radius: number;

        /**
         * 
         */
        constructor()
        {
            this.id = Shape.idCounter++;
        }

        /**
         * 计算包围球半径。结果存储在.boundingSphereRadius属性中
         */
        abstract updateBoundingSphereRadius(): void;

        /**
         * 得到这个形状的体积
         */
        abstract volume(): number;

        /**
         * 计算此形状在局部框架中的惯性。
         * 
         * @param mass 质量
         * @param target
         * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
         */
        abstract calculateLocalInertia(mass: number, target: feng3d.Vector3): void;

        /**
         * 计算世界包围盒
         * 
         * @param pos 世界坐标
         * @param quat 世界旋转
         * @param min 最小坐标
         * @param max 最大坐标
         */
        abstract calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3): void;

        /**
         * 编号计数器
         */
        static idCounter = 0;
    }
}