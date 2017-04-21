module feng3d
{

    /**
     * 立方体3D对象
     * @author feng 2017-02-06
     */
    export class CubeObject3D extends GameObject
    {
        /**
         * 构建3D对象
         */
        constructor(width = 100, name = "cube")
        {
            super(name);
            var model = new Model();
            model.geometry = new CubeGeometry(width, width, width);
            model.material = new StandardMaterial();
            this.addComponent(model);
        }
    }
}