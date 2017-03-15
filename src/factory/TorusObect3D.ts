module feng3d
{

    /**
     * 圆环3D对象
     * @author feng 2017-02-06
     */
    export class TorusObect3D extends Object3D
    {
        public torusGeometry: TorusGeometry;

        /**
         * 构建3D对象
         */
        constructor(name = "torus")
        {
            super(name);
            var mesh = this.getOrCreateComponentByClass(Model);
            this.torusGeometry = mesh.geometry = new TorusGeometry();
            this.getOrCreateComponentByClass(Model).material = new StandardMaterial();
        }
    }
}