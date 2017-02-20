module feng3d
{

    /**
     * 材质组件
     * @author feng 2016-11-01
     */
    export class MaterialComponent extends Component
    {

        /**
         * 父组件
         */
        protected _parentComponent: Material;

        /**
         * 所属对象
         */
        public get material(): Material { return this._parentComponent; }

        /**
         * 构建材质组件
         */
        constructor()
        {
            super();
        }
    }
}