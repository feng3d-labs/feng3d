module feng3d {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    export class Object3D extends RenderDataHolder {

        private _transform: Transform;
        /**
         * 父对象
         */
        private _parent: Object3D = null;

        /**
         * 子对象列表
         */
        private children: Object3D[] = [];

        private _scene: Scene3D;

        /**
         * 变换
         */
        public get transform(): Transform {

            return this._transform;
        }

        public set transform(value: Transform) {

            assert(value != null, "3D空间不能为null");
            this._transform && this.removeComponent(this._transform);
            this._transform = value;
            this._transform && this.addComponent(this._transform);
        }

        /**
         * 构建3D对象
         */
        constructor(name?: string) {

            super();

            this.name = name || getClassName(this);
            //
            this.transform = new Transform();
            //
            this.addEventListener(Object3DEvent.ADDED, this.onAddedContainer3D, this);
            this.addEventListener(Object3DEvent.REMOVED, this.onRemovedContainer3D, this);
        }

        /**
         * 父对象
         */
        public get parent() {

            return this._parent;
        }

        /**
         * 场景
         */
        public get scene() {

            return this._scene;
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
            child.dispatchEvent(new Object3DEvent(Object3DEvent.ADDED, { parent: this, child: child }, true));
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
            child.dispatchEvent(new Object3DEvent(Object3DEvent.REMOVED, { parent: this, child: child }, true));
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

        /**
         * 处理添加子对象事件
         */
        private onAddedContainer3D(event: Object3DEvent): void {

            if (event.data.child == this) {
                this._parent = event.data.parent;
                if (this._parent.scene) {
                    this._scene = this._parent.scene;
                    // this.dispatchEvent(new Object3DEvent(Object3DEvent.ADDED_TO_SCENE, this));
                }
            }
        }

        /**
         * 处理删除子对象事件
         */
        private onRemovedContainer3D(event: Object3DEvent): void {

            if (event.data.child == this) {
                this._parent = null;
                if(this._scene){
                    this._scene = null;
                }
            }
        }
    }
}