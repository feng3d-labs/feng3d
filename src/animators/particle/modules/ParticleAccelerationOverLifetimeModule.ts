namespace feng3d
{
    /**
     * 粒子系统 加速度随时间变化模块
     * 
     * 控制每个粒子在其生命周期内的加速度。
     */
    export class ParticleAccelerationOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        acceleration = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            particle.addAcceleration.add(this.acceleration);
        }
    }
}