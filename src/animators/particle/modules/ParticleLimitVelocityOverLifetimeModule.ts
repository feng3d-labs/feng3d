namespace feng3d
{
    /**
     * Limit Velocity Over Lifetime module.
     * 基于时间轴限制速度模块。
     */
    export class ParticleLimitVelocityOverLifetimeModule extends ParticleModule
    {
        /**
         * Set the size over lifetime on each axis separately.
         * 在每个轴上分别设置生命周期内的大小。
         */
        @serialize
        // @oav({ tooltip: "Set the size over lifetime on each axis separately." })
        @oav({ tooltip: "在每个轴上分别设置生命周期内的大小。" })
        separateAxes = false;

        /**
         * Maximum velocity.
         * 最高速度。
         */
        @serialize
        // @oav({ tooltip: "Maximum velocity." })
        @oav({ tooltip: "最高速度。" })
        limit = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { between0And1: true, constant: 1, constant1: 1 }, yCurve: { between0And1: true, constant: 1, constant1: 1 }, zCurve: { between0And1: true, constant: 1, constant1: 1 } });

        /**
         * Specifies if the velocities are in local space (rotated with the transform) or world space.
         * 指定速度是在局部空间(与变换一起旋转)还是在世界空间。
         */
        // @oav({ tooltip: "Specifies if the velocities are in local space (rotated with the transform) or world space.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        @serialize
        @oav({ tooltip: "指定速度是在局部空间(与变换一起旋转)还是在世界空间。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        space = ParticleSystemSimulationSpace1.Local;

        /**
         * Controls how much the velocity that exceeds the velocity limit should be dampened.
         * 控制多少速度，超过速度限制应该被抑制。
         */
        @serialize
        // @oav({ tooltip: "Controls how much the velocity that exceeds the velocity limit should be dampened.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        @oav({ tooltip: "控制多少速度，超过速度限制应该被抑制。" })
        dampen = 1;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[_LimitVelocityOverLifetime_rate] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            if (!this.enabled) return;

            var velocity = this.limit.getValue(rateAtLifeTime, particle[_LimitVelocityOverLifetime_rate]);
            var pVelocity = particle.velocity.clone();
            if (this.space == ParticleSystemSimulationSpace1.World)
            {
                this.particleSystem.transform.localToWorldMatrix.deltaTransformVector(pVelocity, pVelocity)
                if (this.separateAxes)
                {
                    pVelocity.clamp(velocity.negateTo(), velocity);
                } else
                {
                    pVelocity.normalize(velocity.x);
                }
                this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(pVelocity, pVelocity);
            } else
            {
                if (this.separateAxes)
                {
                    pVelocity.clamp(velocity.negateTo(), velocity);
                } else
                {
                    pVelocity.normalize(velocity.x);
                }
            }
            particle.velocity.lerpNumber(pVelocity, this.dampen);
        }
    }

    var _LimitVelocityOverLifetime_rate = "_LimitVelocityOverLifetime_rate";
}