module me.feng3d {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    export class Object3D extends Component {

        /**
         * 3D空间
         */
        get space3D(): Space3D {
            return this.getComponentByClass(Space3D);
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
            this.getOrCreateComponentByClass(Space3D);
            this.getOrCreateComponentByClass(Material);
        }

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