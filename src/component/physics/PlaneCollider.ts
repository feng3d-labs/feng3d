namespace feng3d
{
    /**
     * 平面碰撞体
     */
    export class PlaneCollider extends Collider
    {
        readonly shape: CANNON.Plane;
        protected _shape: CANNON.Plane;

        init()
        {
            this._shape = new CANNON.Plane();
        }
    }
}