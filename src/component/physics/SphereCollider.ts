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

        private _radius = 1;

        get shape()
        {
            return this._shape;
        }
        private _shape: CANNON.Sphere;

        init(gameobject: GameObject)
        {
            super.init(gameobject);

            this._shape = new CANNON.Sphere(this._radius);
        }
    }
}