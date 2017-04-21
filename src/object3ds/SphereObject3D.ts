module feng3d
{
    /**
     * 球体3D对象
     * @author feng 2017-02-06
     */
    export class SphereObject3D extends GameObject
    {

        /**
         * 构建3D对象
         */
        constructor(name = "sphere")
        {
            super(name);
            var model = this.getOrCreateComponentByClass(Model);
            model.geometry = new SphereGeometry();
            model.material = new StandardMaterial();
        }
    }
}