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

        readonly shape: CANNON.Box;
        protected _shape: CANNON.Box;

        init()
        {
            var halfExtents = new CANNON.Vec3(this.width / 2, this.height / 2, this.depth / 2);
            this._shape = new CANNON.Box(halfExtents);
        }
    }
}