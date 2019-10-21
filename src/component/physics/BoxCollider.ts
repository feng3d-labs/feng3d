namespace feng3d
{
    /**
     * 长方体碰撞体
     */
    export class BoxCollider extends Collider
    {
        /**
         * 宽度
         */
        @oav()
        @serialize
        width = 1;

        /**
         * 高度
         */
        @oav()
        @serialize
        height = 1;

        /**
         * 深度
         */
        @oav()
        @serialize
        depth = 1;

        init()
        {
            var halfExtents = new Vector3(this.width / 2, this.height / 2, this.depth / 2);

            var g = new feng3d.CubeGeometry();
            g.width = halfExtents.x * 2;
            g.height = halfExtents.y * 2;
            g.depth = halfExtents.z * 2;

        }
    }
}