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
         * 构建3D对象组件
         */
        constructor() {
            super();
            this.addEventListener(ComponentEvent.ADDED_COMPONENT, this.onBeAddedComponent, this);
        }

        //------------------------------------------
        //@private
        //------------------------------------------
        private _object3D: Object3D;

        /**
         * 处理被添加事件
         */
        private onBeAddedComponent(event: ComponentEvent): void {

            var data: { container: IComponent, child: IComponent } = event.data;
            if (data.child == this) {
                this._object3D = as(data.container, Object3D);
            }
        }
    }
}