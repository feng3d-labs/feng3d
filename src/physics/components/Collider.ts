namespace feng3d { export interface ComponentMap { Collider: CANNON.Collider; } }

namespace CANNON
{
    /**
     * 碰撞体
     */
    @feng3d.RegisterComponent()
    export class Collider extends feng3d.Component
    {
        get shape()
        {
            return this._shape;
        }
        protected _shape: Shape;
    }
}