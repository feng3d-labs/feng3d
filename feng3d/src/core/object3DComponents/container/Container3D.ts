module feng3d {

    /**
     * 3D容器组件
     * @author feng 2016-04-26
     */
    export class Container3D extends Object3DComponent {

        /**
         * 父对象
         */
        public get parent() {

            return this._parent;
        }

        /**
         * 构建3D容器组件
         */
        constructor() {
            super();
        }

        /**
		 * 添加子对象
		 * @param child		子对象
		 * @return			新增的子对象
		 */
        public addChild(child: Object3D): void {

            this.addChildAt(child, this.children.length);
        }

        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        public addChildAt(child: Object3D, index: number): void {

            assert(-1 < index && index <= this.children.length, "添加子对象的索引越界！");
            this.children.splice(index, 0, child);
            child.dispatchEvent(new Container3DEvent(Container3DEvent.ADDED, { parent: this.object3D, child: child }, true));
        }

        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        public removeChild(child: Object3D): number {

            var childIndex = this.children.indexOf(child);
            assert(-1 < childIndex && childIndex < this.children.length, "删除的子对象不存在！");
            this.removeChildAt(childIndex);
            return childIndex;
        }

        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        public getChildIndex(child: Object3D): number {

            return this.children.indexOf(child);
        }

        /**
		 * 移出指定索引的子对象
		 * @param childIndex	子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(childIndex: number): Object3D {

            var child: Object3D = this.children[childIndex];
            assert(-1 < childIndex && childIndex < this.children.length, "删除的索引越界！");
            this.children.splice(childIndex, 1);
            child.dispatchEvent(new Container3DEvent(Container3DEvent.REMOVED, { parent: this.object3D, child: child }, true));
            return child;
        }

		/**
		 * 获取子对象
		 * @param index         子对象索引
		 * @return              指定索引的子对象
		 */
        public getChildAt(index: number): Object3D {

            return this.children[index];
        }

        /**
         * 获取子对象数量
         */
        public get numChildren(): number {
            
            return this.children.length;
        }

        /******************************************************************************************************************************
         * @protected
         ******************************************************************************************************************************/

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void {

            //TODO 此处可以提供一个方法，向父组件中添加事件，当自身添加到父组件时自动添加监听，当自身从父组件移除时自动移除监听
            this.object3D.addEventListener(Container3DEvent.ADDED, this.onAddedContainer3D, this);
            this.object3D.addEventListener(Container3DEvent.REMOVED, this.onRemovedContainer3D, this);
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void {

            this.object3D.addEventListener(Container3DEvent.ADDED, this.onAddedContainer3D, this);
            this.object3D.addEventListener(Container3DEvent.REMOVED, this.onRemovedContainer3D, this);
        }

        /******************************************************************************************************************************
         * @private
         ******************************************************************************************************************************/

        /**
         * 父对象
         */
        private _parent: Object3D = null;

        /**
         * 子对象列表
         */
        private children: Object3D[] = [];

        /**
         * 处理添加子对象事件
         */
        private onAddedContainer3D(event: Container3DEvent): void {

            if (event.data.child == this.object3D) {
                this._parent = event.data.parent;
            }
        }

        /**
         * 处理删除子对象事件
         */
        private onRemovedContainer3D(event: Container3DEvent): void {

            if (event.data.child == this.object3D) {
                this._parent = null;
            }
        }
    }
}