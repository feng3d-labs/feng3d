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
        @oav()
        velocity = new MinMaxCurveVector3();

        @oav({ tooltip: "模拟空间", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
        space = ParticleSystemSimulationSpace.Local;

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            var velocity = this.velocity.getValue(rateAtLifeTime);

            if (this.space == ParticleSystemSimulationSpace.World)
            {
                this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(velocity, velocity);
            }

            //
            particle.position.x += velocity.x * (time - preTime);
            particle.position.y += velocity.y * (time - preTime);
            particle.position.z += velocity.z * (time - preTime);
        }
    }
}