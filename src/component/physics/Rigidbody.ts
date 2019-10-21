namespace feng3d
{
    /**
     * 刚体
     */
    export class Rigidbody extends Behaviour
    {
        __class__: "feng3d.Rigidbody" = "feng3d.Rigidbody";

        runEnvironment = RunEnvironment.feng3d;

        @oav({ tooltip: "质量" })
        @serialize
        mass = 0;

        /**
         * 位移
         */
        get position()
        {
            return this.transform.position;
        }

        set position(v)
        {
            this.transform.position = v;
        }

        /**
         * 速度
         */
        @oav({ tooltip: "速度" })
        @serialize
        velocity = new feng3d.Vector3();

        /**
         * 是否受重力影响
         */
        @oav({ tooltip: "是否受重力影响" })
        @serialize
        useGravity = true;

    }
}