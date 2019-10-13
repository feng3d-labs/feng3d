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
        type: ShapeType;

        /**
         * 此形状的局部包围球半径
         */
        boundingSphereRadius: number;

        /**
         * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
         * 是否响应碰撞
         */
        collisionResponse: boolean;

        collisionFilterGroup: number;

        collisionFilterMask: number;

        /**
         * 材质
         */
        material: Material;

        /**
         * 物体
         */
        body: Body;

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
         * @param options 
         * @author schteppe
         */
        constructor(options: { type?: ShapeType, collisionFilterGroup?: number, collisionFilterMask?: number, collisionResponse?: boolean, material?: any } = {})
        {
            this.id = Shape.idCounter++;
            this.type = options.type || 0;

            this.boundingSphereRadius = 0;
            this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;

            this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;

            this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;

            this.material = options.material ? options.material : null;
            this.body = null;
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