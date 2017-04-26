module feng3d
{

    /**
     * 圆环3D对象
     * @author feng 2017-02-06
     */
    export class TorusObect3D extends GameObject
    {
        public torusGeometry: TorusGeometry;

        /**
         * 构建3D对象
         */
        constructor(name = "torus")
        {
            super(name);
            var model = new Model();
            this.torusGeometry = model.geometry = new TorusGeometry();
            model.material = new StandardMaterial();
            this.addComponent(model);
        }
    }
}