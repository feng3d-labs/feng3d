namespace feng3d { export interface ComponentMap { SphereCollider: CANNON.SphereCollider; } }

namespace CANNON
{
    /**
     * 球形碰撞体
     */
    @feng3d.AddComponentMenu("Physics/Sphere Collider")
    @feng3d.RegisterComponent()
    export class SphereCollider extends Collider
    {
        /**
         * 半径
         */
        @feng3d.oav()
        @feng3d.serialize
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

        readonly shape: Sphere;
        protected _shape: Sphere;

        init()
        {
            this._shape = new Sphere(this._radius);
        }
    }
}