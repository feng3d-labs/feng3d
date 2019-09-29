namespace feng3d
{
    export class BodyComponent extends Behaviour
    {
        __class__: "feng3d.BodyComponent" = "feng3d.BodyComponent";

        @oav()
        body: CANNON.Body;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            var radius = 1; // m
            this.body = new CANNON.Body({
                mass: 5, // kg
                position: new CANNON.Vec3(0, 10, 0), // m
                shape: new CANNON.Sphere(radius)
            });
        }

        /**
         * 每帧执行
         */
        update(interval?: number)
        {
            var scene3D = this.getComponentsInParents(Scene3D)[0];
            if (scene3D && scene3D.runEnvironment == RunEnvironment.feng3d)
            {
                this.transform.x = this.body.position.x;
                this.transform.y = this.body.position.y;
                this.transform.z = this.body.position.z;
            }
        }
    }
}