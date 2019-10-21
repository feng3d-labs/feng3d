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
        }

        /**
         * 每帧执行
         */
        update(interval?: number)
        {
            // 时间
            var t = interval / 1000;
            var bodys = this.getComponentsInChildren(Rigidbody);
            bodys.forEach(body =>
            {
                // 位移
                var p = body.transform.position;
                // 速度
                var v = body.velocity;
                // 加速度
                var a = this.gravity;
                // 计算位移
                // p = p + v * t + 0.5 * a * t * t;
                p.add(v.scaleNumberTo(t)).add(a.scaleNumberTo(0.5 * t * t));
                // 计算速度
                // v = a * t;
                v.add(a.scaleNumberTo(t));
                // 更新位移与速度
                body.transform.position = p;
                body.velocity = v;
            });
        }
    }
}