namespace feng3d
{
    /**
     * 碰撞体
     */
    export class Collider extends Component
    {
        get shape()
        {
            return this._shape;
        }
        protected _shape: CANNON.Shape;
    }
}