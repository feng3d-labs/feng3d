module me.feng3d {

    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    export class Object3DComponent extends Component {

        /**
         * 所属对象
         */
        public get object3D(): Object3D { return this._object3D; }

        /**
         * 构建3D容器组件
         */
        constructor() {
            super();
            this.addEventListener(ComponentEvent.BE_ADDED_COMPONENT, this.onBeAddedComponent, this);
        }

        //------------------------------------------
        //@private
        //------------------------------------------
        private _object3D: Object3D;

        /**
         * 处理被添加事件
         */
        private onBeAddedComponent(event: ComponentEvent): void {

            this._object3D = as(event.data.container, Object3D);
        }
    }
}