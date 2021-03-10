namespace feng3d
{
    /**
     * 3D组件
     * GameObject必须拥有Transform组件的
     */
    export class Component3D extends Component
    {
        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        get transform()
        {
            return this._gameObject && this._gameObject.transform;
        }


    }
}