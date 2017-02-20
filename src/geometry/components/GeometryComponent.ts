module feng3d
{

    /**
     * 几何体组件
     * @author feng 2016-10-16
     */
    export class GeometryComponent extends Component
    {

        /**
         * 父组件
         */
        protected _parentComponent: Geometry;

        /**
         * 所属对象
         */
        public get geometry(): Geometry { return this._parentComponent; }

        /**
         * 构建几何体组件
         */
        constructor()
        {
            super();
        }
    }
}