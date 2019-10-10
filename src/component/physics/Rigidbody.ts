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
            this.body = new CANNON.Body({
                mass: this.mass, // kg
            });

            this.body.position = this.transform.position;

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
                this.transform.position = this.body.position;
            }
        }
    }
}