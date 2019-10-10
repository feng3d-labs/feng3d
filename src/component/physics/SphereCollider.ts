namespace feng3d
{
    /**
     * 球形碰撞体
     */
    export class SphereCollider extends Collider
    {
        /**
         * 半径
         */
        @oav()
        @serialize
        get radius()
        {
            return this._radius;
        }
        set radius(v)
        {
            this._radius = v;
            if (this._shape)
                this._shape.radius = v;
        }

        private _radius = 0.5;

        readonly shape: CANNON.Sphere;
        protected _shape: CANNON.Sphere;

        init()
        {
            this._shape = new CANNON.Sphere(this._radius);
        }
    }
}