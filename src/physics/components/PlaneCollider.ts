namespace feng3d { export interface ComponentMap { PlaneCollider: CANNON.PlaneCollider; } }

namespace CANNON
{
    /**
     * 平面碰撞体
     */
    @feng3d.AddComponentMenu("Physics/Plane Collider")
    @feng3d.RegisterComponent()
    export class PlaneCollider extends Collider
    {
        readonly shape: Plane;
        protected _shape: Plane;

        init()
        {
            this._shape = new Plane();
        }
    }
}