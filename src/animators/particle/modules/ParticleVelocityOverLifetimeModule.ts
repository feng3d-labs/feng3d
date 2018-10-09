namespace feng3d
{
    /**
     * 粒子系统 速度随时间变化模块
     */
    export class ParticleVelocityOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        velocity = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            particle.velocity
        }
    }
}