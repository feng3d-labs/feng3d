namespace feng3d
{
    /**
     * 刚体
     */
    export class Rigidbody extends Behaviour
    {
        __class__: "feng3d.Rigidbody" = "feng3d.Rigidbody";

        body: CANNON.Body;

        runEnvironment = RunEnvironment.feng3d;

        @oav()
        @serialize
        mass = 0;

        init()
        {
            this.body = new CANNON.Body({ mass: this.mass });

            this.body.position = new CANNON.Vec3(this.transform.x, this.transform.y, this.transform.z);

            var colliders = this.gameObject.getComponents(Collider);
            colliders.forEach(element =>
            {
                this.body.addShape(element.shape);
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
                this.transform.position = new Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
            }
        }
    }
}