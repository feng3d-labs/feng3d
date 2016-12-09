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
        }

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