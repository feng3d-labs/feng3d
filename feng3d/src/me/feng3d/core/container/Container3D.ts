module me.feng3d {

    /**
     * 3D容器组件
     * @author feng 2016-04-26
     */
    export class Container3D extends Component {

        /**
         * 所属对象
         */
        private object3D: Object3D;

        /**
         * 父对象
         */
        private parent: Object3D = null;

        /**
         * 子对象列表
         */
        private children: Object3D[] = [];

        /**
         * 构建3D容器组件
         */
        constructor() {
            super();
            this.addEventListener(ComponentEvent.BE_ADDED_COMPONENT, this.onBeAddedComponent, this)
        }

        /**
		 * 添加子对象
		 * @param child		子对象
		 * @return			新增的子对象
		 */
        public addChild(child: Object3D): void {

            this.children.push(child);
            var childContainer3D = child.getOrCreateComponentByClass(Container3D);
            childContainer3D.dispatchEvent(new Container3DEvent(Container3DEvent.ADDED, { parent: this.object3D, child: child }));
        }

        /**
         * 处理被添加事件
         */
        private onBeAddedComponent(event: ComponentEvent): void {

            this.object3D = as(event.data.container, Object3D);
        }
    }
}