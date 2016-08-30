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
		 * 移出指定索引的子对象
		 * @param childIndex	子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(childIndex: number): Object3D {
            var child: Object3D = this.getChildAt(childIndex);
            this.removeChildInternal(childIndex, child);
            return child;
        }

		/**
		 * 获取子对象
		 * @param index
		 * @return
		 */
        public getChildAt(index: number): Object3D {
            return this.children[index];
        }

        /**
		 * 内部移除子对象
		 * @param childIndex	移除子对象所在索引
		 * @param child			移除子对象
		 */
        private removeChildInternal(childIndex: number, child: Object3D) {
            this.children.splice(childIndex, 1);
        }

        /**
         * 处理被添加事件
         */
        private onBeAddedComponent(event: ComponentEvent): void {

            this.object3D = as(event.data.container, Object3D);
        }
    }
}