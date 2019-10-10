namespace feng3d
{
    export class BodyComponent extends Behaviour
    {
        __class__: "feng3d.BodyComponent" = "feng3d.BodyComponent";

        shapeType = CANNON.ShapeType.SPHERE;

        body: CANNON.Body;

        runEnvironment = RunEnvironment.feng3d;

        @oav()
        @serialize
        mass = 5;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            this.body = new CANNON.Body({
                mass: this.mass, // kg
            });

            switch (this.shapeType)
            {
                case CANNON.ShapeType.SPHERE:
                    var radius = 1;
                    this.body.addShape(new CANNON.Sphere(radius));
                    break;
                case CANNON.ShapeType.PLANE:
                    this.body.addShape(new CANNON.Plane());
                    break;
                default:
                    break;
            }

            this.body.position = this.transform.position;
        }

        /**
         * 每帧执行
         */
        update(interval?: number)
        {
            var scene3D = this.getComponentsInParents(Scene3D)[0];
            if (scene3D)
            {
                this.transform.position = this.body.position;
            }
        }
    }
}