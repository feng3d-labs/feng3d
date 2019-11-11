namespace feng3d
{
    /**
     * 粒子系统 速度随时间变化模块
     * 
     * Controls the velocity of each particle during its lifetime.
     * 控制每个粒子在其生命周期内的速度。
     */
    export class ParticleVelocityOverLifetimeModule extends ParticleModule
    {
        @serialize
        // @oav({ tooltip: "Curve to control particle speed based on lifetime." })
        @oav({ tooltip: "基于寿命的粒子速度控制曲线。" })
        velocity = new MinMaxCurveVector3();

        // @oav({ tooltip: "Specifies if the velocities are in local space (rotated with the transform) or world space.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        @oav({ tooltip: "指定速度是在局部空间(与变换一起旋转)还是在世界空间。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        space = ParticleSystemSimulationSpace1.Local;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[rateVelocityOverLifetime] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            var velocity = this.velocity.getValue(rateAtLifeTime, particle[rateVelocityOverLifetime]);

            if (this.space == ParticleSystemSimulationSpace1.World)
            {
                this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(velocity, velocity);
            }

            //
            particle.position.x += velocity.x * (time - preTime);
            particle.position.y += velocity.y * (time - preTime);
            particle.position.z += velocity.z * (time - preTime);
        }
    }

    var rateVelocityOverLifetime = "_rateVelocityOverLifetime";
}