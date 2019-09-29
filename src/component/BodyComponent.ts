namespace feng3d
{
    export class BodyComponent extends Behaviour
    {
        __class__: "feng3d.BodyComponent" = "feng3d.BodyComponent";

        body: CANNON.Body;

        runEnvironment = RunEnvironment.feng3d;

        @oav()
        @serialize
        mass = 5;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            var radius = 1; // m
            this.body = new CANNON.Body({
                mass: this.mass, // kg
                position: new Vector3(0, 10, 0), // m
                shape: new CANNON.Sphere(radius)
            });
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