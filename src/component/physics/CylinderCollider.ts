namespace feng3d
{
    /**
     * 圆柱体碰撞体
     */
    export class CylinderCollider extends Collider
    {
        /**
         * 顶部半径
         */
        @oav()
        @serialize
        topRadius = 0.5;

        /**
         * 底部半径
         */
        @oav()
        @serialize
        bottomRadius = 0.5;

        /**
         * 高度
         */
        @oav()
        @serialize
        height = 2;

        /**
         * 横向分割数
         */
        @oav()
        @serialize
        segmentsW = 16;

        init()
        {
        }
    }
}