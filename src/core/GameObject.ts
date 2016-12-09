module feng3d {
    /**
     * 游戏对象
     * @author feng 2016-04-26
     */
    export class GameObject extends Component {

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
         * 容器
         */
        private get container3D() {

            return this.getOrCreateComponentByClass(Container3D);
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

            this.getOrCreateComponentByClass(Container3D);
            this.getOrCreateComponentByClass(Transform);
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
        public addChild(child: GameObject): void { this.container3D.addChild(child); }

        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        public addChildAt(child: GameObject, index: number): void { this.container3D.addChildAt(child, index); }

        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        public removeChild(child: GameObject): number { return this.container3D.removeChild(child); }

        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        public getChildIndex(child: GameObject): number { return this.container3D.getChildIndex(child); }

        /**
		 * 移出指定索引的子对象
		 * @param childIndex	子对象索引
		 * @return				被移除对象
		 */
        public removeChildAt(childIndex: number): GameObject { return this.container3D.removeChildAt(childIndex); }

        /**
		 * 获取子对象
		 * @param index         子对象索引
		 * @return              指定索引的子对象
		 */
        public getChildAt(index: number): GameObject { return this.container3D.getChildAt(index); }

        /**
         * 获取子对象数量
         */
        public get numChildren(): number { return this.container3D.numChildren; };

        /*********************
         * 
         *********************/
        /**
         * 创建
         */
        static createPrimitive(type: PrimitiveType): GameObject {

            var object3D = new GameObject();
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