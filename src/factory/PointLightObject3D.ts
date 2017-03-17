module feng3d
{
    /**
     * 点光源3D对象
     * @author feng 2017-03-10
     */
    export class PointLightObject3D extends Object3D
    {
        constructor(name = "PointLight")
        {
            super(name);
            //
            this.getOrCreateComponentByClass(Model).geometry = new SphereGeometry(5);
            //初始化点光源
            this.addComponent(new PointLight());
        }
    }
}