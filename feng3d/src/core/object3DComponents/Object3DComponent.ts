module feng3d {

    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    export class Object3DComponent extends Component {

        /**
         * 父组件
         */
        protected _parentComponent: Object3D;

        /**
         * 所属对象
         */
        public get object3D(): Object3D { return this._parentComponent; }

        /**
         * 构建3D对象组件
         */
        constructor() {
            super();
        }
    }
}