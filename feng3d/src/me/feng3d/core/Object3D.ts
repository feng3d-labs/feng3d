module feng3d {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    export class Object3D extends Component {

        /**
         * 3D空间
         */
        public get space3D(): Space3D {

            return this.getOrCreateComponentByClass(Space3D);
        }

        /**
         * 容器
         */
        private get container3D() {

            return this.getOrCreateComponentByClass(Container3D);
        }

        /**
         * 场景空间
         */
        private get sceneSpace3D() {

            return this.getOrCreateComponentByClass(SceneSpace3D);
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

            this.getOrCreateComponentByClass(Material);
        }

        /********************
         * 
         * Container3D 组件中方法
         * 
         *******************/
        /**
         * 父对象
         */
        public get parent() { return this.container3D.parent; }

        /**
		 * 添加子对象
		 * @param child		子对象
		 * @return			新增的子对象
		 */
        public addChild(child: Object3D): void { this.container3D.addChild(child); }

        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        public addChildAt(child: Object3D, index: number): void { this.container3D.addChildAt(child, index); }

        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        public removeChild(child: Object3D): number { return this.container3D.removeChild(child); }

        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        public getChildIndex(child: Object3D): number { return this.container3D.getChildIndex(child); }

        /**
		 * 移出指定索引的子对象
		 * @param childIndex	子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(childIndex: number): Object3D { return this.container3D.removeChildAt(childIndex); }

        /**
		 * 获取子对象
		 * @param index         子对象索引
		 * @return              指定索引的子对象
		 */
        public getChildAt(index: number): Object3D { return this.container3D.getChildAt(index); }

        /**
         * 获取子对象数量
         */
        public get numChildren(): number { return this.container3D.numChildren; };

        /*********************
         * 
         *********************/

        /**
         * 场景空间变换矩阵
         */
        public get sceneTransform3D(): Matrix3D { return this.sceneSpace3D.sceneTransform3D; }

        /**
		 * 通知场景变换改变
		 */
        public notifySceneTransformChange() { this.sceneSpace3D.notifySceneTransformChange(); }

        /*********************
         * 
         *********************/
        /**
         * 创建
         */
        static createPrimitive(type: PrimitiveType): Object3D {

            var object3D = new Object3D();
            switch (type) {
                case PrimitiveType.Plane:
                    object3D.addComponent(primitives.createPlane());
                    break;
                case PrimitiveType.Cube:
                    object3D.addComponent(primitives.createCube());
                    break;
                case PrimitiveType.Sphere:
                    object3D.addComponent(primitives.createSphere());
                    break;
                case PrimitiveType.Capsule:
                    object3D.addComponent(primitives.createCapsule());
                    break;
                case PrimitiveType.Cylinder:
                    object3D.addComponent(primitives.createCylinder());
                    break;
                default:
                    throw `无法创建3D基元对象 ${type}`;
            }
            return object3D;
        }
    }
}