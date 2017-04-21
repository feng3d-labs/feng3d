module feng3d
{
    /**
     * 平面3D对象
     * @author feng 2017-02-06
     */
    export class PlaneObject3D extends GameObject
    {
        /**
         * 构建3D对象
         */
        constructor(width = 100, name = "plane")
        {
            super(name);
            var model = new Model();
            model.geometry = new PlaneGeometry(width, width);
            model.material = new StandardMaterial();
            this.addComponent(model);
        }
    }
}