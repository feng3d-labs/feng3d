namespace feng3d
{
    /**
     * 粒子系统 颜色随时间变化模块
     */
    export class ParticleColorOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        color = new MinMaxGradient();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            particle.color.multiply(this.color.getValue(rateAtLifeTime));
        }
    }
}