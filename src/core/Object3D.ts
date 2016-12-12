module feng3d {
    /**
     * 游戏对象
     * @author feng 2016-04-26
     */
    export class Object3D extends Component {

        /**
         * 父对象
         */
        private _parent: Object3D = null;

        /**
         * 子对象列表
         */
        private children: Object3D[] = [];

        /**
         * 变换
         */
        public get transform(): Transform {

            return this.getOrCreateComponentByClass(Transform);
        }

        public set transform(value: Transform) {

            assert(value != null, "3D空间不能为null");
            this.removeComponent(this.transform);
            this.addComponent(value);
        }

        /**
         * 构建3D对象
         */
        constructor(name?: string, conponents: Component[] = null) {

            super();

            this.name = name || getClassName(this);
            conponents && conponents.forEach(element => {
                this.addComponent(element);
            });

            this.getOrCreateComponentByClass(Transform);
            this.getOrCreateComponentByClass(Material);
            //
            this.addEventListener(Container3DEvent.ADDED, this.onAddedContainer3D, this);
            this.addEventListener(Container3DEvent.REMOVED, this.onRemovedContainer3D, this);
        }

        /**
         * 创建
         */
        static createPrimitive(type: PrimitiveType): Object3D {

            var object3D = new Object3D();
            var mesh = object3D.getOrCreateComponentByClass(Mesh);
            var geometry = primitives.createCube();
            switch (type) {
                case PrimitiveType.Plane:
                    object3D.name = "plane";
                    geometry = primitives.createPlane();
                    break;
                case PrimitiveType.Cube:
                    object3D.name = "cube";
                    geometry = primitives.createCube();
                    break;
                case PrimitiveType.Sphere:
                    object3D.name = "sphere";
                    geometry = primitives.createSphere();
                    break;
                case PrimitiveType.Capsule:
                    object3D.name = "capsule";
                    geometry = primitives.createCapsule();
                    break;
                case PrimitiveType.Cylinder:
                    object3D.name = "cylinder";
                    geometry = primitives.createCylinder();
                    break;
                default:
                    throw `无法创建3D基元对象 ${type}`;
            }
            mesh.geometry = geometry;
            return object3D;
        }


        /**
         * 父对象
         */
        public get parent() {

            return this._parent;
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
            child.dispatchEvent(new Container3DEvent(Container3DEvent.ADDED, { parent: this, child: child }, true));
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
            child.dispatchEvent(new Container3DEvent(Container3DEvent.REMOVED, { parent: this, child: child }, true));
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
        private onAddedContainer3D(event: Container3DEvent): void {

            if (event.data.child == this) {
                this._parent = event.data.parent;
            }
        }

        /**
         * 处理删除子对象事件
         */
        private onRemovedContainer3D(event: Container3DEvent): void {

            if (event.data.child == this) {
                this._parent = null;
            }
        }
    }
}