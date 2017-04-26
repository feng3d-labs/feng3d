module feng3d
{
    /**
     * 点光源3D对象
     * @author feng 2017-03-10
     */
    export class PointLightObject3D extends GameObject
    {
        constructor(name = "PointLight")
        {
            super(name);
            //
            var model = new Model();
            model.geometry = new SphereGeometry(5);
            var material = model.material = new ColorMaterial();
            this.addComponent(model);

            //初始化点光源
            var pointLight = new PointLight();
            this.addComponent(pointLight);

            material.color = pointLight.color;
            Binding.bindProperty(pointLight, ["color"], material, "color");
        }
    }
}