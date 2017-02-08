module feng3d {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    export class Object3D extends RenderDataHolder {

        private _object3DID: number;
        private _uid: string;

        private _transform: Transform;
        /**
         * 父对象
         */
        private _parent: Object3D = null;

        /**
         * 子对象列表
         */
        private _children: Object3D[] = [];

        private _scene: Scene3D;

        /**
         * 唯一标识符
         */
        public get uid() {

            return this._uid;
        }

        public get object3DID() {

            return this._object3DID;
        }

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
            this._transform && this.addComponentAt(this._transform, 0);
        }

        /**
         * 构建3D对象
         */
        constructor(name?: string) {

            super();

            this._uid = getUID(this);
            this._object3DID = object3DAutoID++;
            object3DMap[this._object3DID] = this;
            this.name = name || this._uid;
            //
            this.transform = new Transform();
            //
            this.renderData.uniforms[RenderDataID.u_objectID] = this._object3DID;
            //
            this.addEventListener(Object3DEvent.ADDED, this.onAdded, this);
            this.addEventListener(Object3DEvent.REMOVED, this.onRemoved, this);
        }

        /**
         * 父对象
         */
        public get parent() {

            return this._parent;
        }

        private _setParent(value: Object3D) {

            if (this._parent == value)
                return;
            this._parent = value;

            if (this._parent == null)
                this._setScene(null);
            else if (is(this.parent, Scene3D))
                this._setScene(<Scene3D>this.parent);
            else
                this._setScene(this.parent.scene);
        }

        /**
         * 场景
         */
        public get scene() {

            return this._scene;
        }

        private _setScene(value: Scene3D) {

            if (this._scene == value)
                return;

            if (this._scene) {
                this.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_FROM_SCENE, { object3d: this, scene: this._scene }));
                this._scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_FROM_SCENE, { object3d: this, scene: this._scene }));
            }
            this._scene = value;
            if (this._scene) {
                this.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_TO_SCENE, { object3d: this, scene: this._scene }));
                this._scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_TO_SCENE, { object3d: this, scene: this._scene }));
            }
            this._children.forEach(child => {
                child._setScene(this._scene);
            });
        }

        /**
		 * 添加子对象
		 * @param child		子对象
		 * @return			新增的子对象
		 */
        public addChild(child: Object3D): void {

            this.addChildAt(child, this._children.length);
        }

        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        public addChildAt(child: Object3D, index: number): void {

            assert(-1 < index && index <= this._children.length, "添加子对象的索引越界！");
            this._children.splice(index, 0, child);
            child.dispatchEvent(new Object3DEvent(Object3DEvent.ADDED, { parent: this, child: child }, true));
        }

        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        public removeChild(child: Object3D): number {

            var childIndex = this._children.indexOf(child);
            assert(-1 < childIndex && childIndex < this._children.length, "删除的子对象不存在！");
            this.removeChildAt(childIndex);
            return childIndex;
        }

        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        public getChildIndex(child: Object3D): number {

            return this._children.indexOf(child);
        }

        /**
		 * 移出指定索引的子对象
		 * @param childIndex	子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(childIndex: number): Object3D {

            var child: Object3D = this._children[childIndex];
            assert(-1 < childIndex && childIndex < this._children.length, "删除的索引越界！");
            this._children.splice(childIndex, 1);
            child.dispatchEvent(new Object3DEvent(Object3DEvent.REMOVED, { parent: this, child: child }, true));
            return child;
        }

		/**
		 * 获取子对象
		 * @param index         子对象索引
		 * @return              指定索引的子对象
		 */
        public getChildAt(index: number): Object3D {

            return this._children[index];
        }

        /**
         * 获取子对象数量
         */
        public get numChildren(): number {

            return this._children.length;
        }

        /**
         * 处理添加子对象事件
         */
        private onAdded(event: Object3DEvent): void {

            if (event.data.child == this) {
                this._setParent(event.data.parent);
            }
        }

        /**
         * 处理删除子对象事件
         */
        private onRemoved(event: Object3DEvent): void {

            if (event.data.child == this) {
                this._setParent(null);
            }
        }

        public static getObject3D(id: number) {
            return object3DMap[id];
        }
    }

    var object3DAutoID = 0;
    var object3DMap: { [id: number]: Object3D } = {};
}