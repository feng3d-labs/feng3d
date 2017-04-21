module feng3d
{

    /**
     * 胶囊体3D对象
     * @author feng 2017-02-06
     */
    export class CapsuleObject3D extends GameObject
    {

        /**
         * 构建3D对象
         */
        constructor(name = "capsule")
        {
            super(name);
            var model = this.getOrCreateComponentByClass(Model);
            model.geometry = new CapsuleGeometry();
            model.material = new StandardMaterial();
        }
    }
}