namespace feng3d
{
    /**
     * 物理世界
     */
    export class World extends Behaviour
    {
        __class__: "feng3d.World" = "feng3d.World";

        runEnvironment = RunEnvironment.feng3d;

        /**
         * 重力加速度
         */
        @oav()
        @serialize
        gravity = new Vector3(0, -9.82, 0);

        /**
         * 构造3D场景
         */
        init()
        {
            super.init();

            var bodys = this.getComponentsInChildren(Rigidbody);
        }

        /**
         * 每帧执行
         */
        update(interval?: number)
        {
            // 只在
            // if (this.runEnvironment == RunEnvironment.feng3d)
            //     this.world.step(1.0 / 60.0, interval / 1000, 3);
        }
    }
}