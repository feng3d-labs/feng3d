namespace feng3d
{
    /**
     * 粒子系统 发射边
     */
    export class ParticleSystemShapeEdge extends ParticleSystemShape
    {
        /**
         * 边长的一半。
         */
        @serialize
        @oav({ tooltip: "边长的一半。" })
        radius = 1;

        /**
         * The mode used for generating particles around the arc.
         * 在弧线周围产生粒子的模式。
         */
        @serialize
        @oav({ tooltip: "在弧线周围产生粒子的模式。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeMultiModeValue } })
        arcMode = ParticleSystemShapeMultiModeValue.Random;

        /**
         * Control the gap between emission points around the arc.
         * 控制弧线周围发射点之间的间隙。
         */
        @serialize
        @oav({ tooltip: "控制弧线周围发射点之间的间隙。" })
        arcSpread = 0;

        /**
         * When using one of the animated modes, how quickly to move the emission position around the arc.
         * 当使用一个动画模式时，如何快速移动发射位置周围的弧。
         */
        @serialize
        @oav({ tooltip: "当使用一个动画模式时，如何快速移动发射位置周围的弧。" })
        arcSpeed = serialization.setValue(new MinMaxCurve(), { constant: 1, constant1: 1 });

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;
            var arc = 360 * this.radius;
            // 在圆心的方向
            var radiusAngle = 0;
            if (this.arcMode == ParticleSystemShapeMultiModeValue.Random)
            {
                radiusAngle = Math.random() * arc;
            } else if (this.arcMode == ParticleSystemShapeMultiModeValue.Loop)
            {
                var totalAngle = particle.birthTime * this.arcSpeed.getValue(particle.birthRateAtDuration) * 360;
                radiusAngle = totalAngle % arc;
            } else if (this.arcMode == ParticleSystemShapeMultiModeValue.PingPong)
            {
                var totalAngle = particle.birthTime * this.arcSpeed.getValue(particle.birthRateAtDuration) * 360;
                radiusAngle = totalAngle % arc;
                if (Math.floor(totalAngle / arc) % 2 == 1)
                {
                    radiusAngle = arc - radiusAngle;
                }
            }
            // else if (this.arcMode == ParticleSystemShapeMultiModeValue.BurstSpread)
            // {
            // }
            if (this.arcSpread > 0)
            {
                radiusAngle = Math.floor(radiusAngle / arc / this.arcSpread) * arc * this.arcSpread;
            }
            radiusAngle = radiusAngle / arc;

            // 计算位置
            var dir = new Vector3(0, 1, 0);
            var p = new Vector3(this.radius * (radiusAngle * 2 - 1), 0, 0);

            //
            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}