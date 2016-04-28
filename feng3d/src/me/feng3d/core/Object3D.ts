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
        constructor(name?: string) {
            super();

            this.name = name || getClassName(this);
            this.getOrCreateComponentByClass(Space3D);
        }
    }
}