module me.feng3d {

    /**
     * 3D容器组件
     * @author feng 2016-04-26
     */
    export class Container3D extends Object3DComponent {

        /**
         * 获取父对象
         * @param object3D  显示对象
         * @return          父对象
         */
        public static getParent(object3D: Object3D): Object3D {
            var container3D = this.getContainer3D(object3D);
            return container3D.parent;
        }

        /**
         * 获取容器
         */
        public static getContainer3D(object3D: Object3D): Container3D {
            return object3D.getOrCreateComponentByClass(Container3D);
        }

        /**
         * 移除对象
         * @param   object3D    显示对象
         */
        public static removeChild(object3D: Object3D): void {

            var parent = Container3D.getParent(object3D);
            if (parent == null) {
                return;
            }
            var parentContainer3D = this.getContainer3D(parent);
            parentContainer3D.removeChild(object3D);
        }

        /**
         * 构建3D容器组件
         */
        constructor() {
            super();
            this.addEventListener(Container3DEvent.ADDED, this.onAddedContainer3D, this);
            this.addEventListener(Container3DEvent.REMOVED, this.onRemovedContainer3D, this);
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
            child.dispatchEvent(new Container3DEvent(Container3DEvent.ADDED, { parent: this.object3D, child: child }));
        }

        /**
         * 移除子对象
         * @param   child   子对象
         * 
         */
        public removeChild(child: Object3D): number {

            var childIndex = this.children.indexOf(child);
            this.removeChildInternal(childIndex, child);
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

        //------------------------------------------
        //@private
        //------------------------------------------
        /**
         * 父对象
         */
        private parent: Object3D = null;

        /**
         * 子对象列表
         */
        private children: Object3D[] = [];

        /**
		 * 内部移除子对象
		 * @param childIndex	移除子对象所在索引
		 * @param child			移除子对象
		 */
        private removeChildInternal(childIndex: number, child: Object3D) {

            assert(-1 < childIndex && childIndex < this.children.length, "删除的子对象不存在或者索引越界！");
            this.children.splice(childIndex, 1);
            child.dispatchEvent(new Container3DEvent(Container3DEvent.REMOVED, { parent: this.object3D, child: child }));
        }

        /**
         * 处理添加子对象事件
         */
        private onAddedContainer3D(event: Container3DEvent): void {

            if (event.data.child == this.object3D) {
                this.parent = event.data.parent;
            }
        }

        /**
         * 处理删除子对象事件
         */
        private onRemovedContainer3D(event: Container3DEvent): void {

            if (event.data.child == this.object3D) {
                this.parent = null;
            }
        }
    }
}