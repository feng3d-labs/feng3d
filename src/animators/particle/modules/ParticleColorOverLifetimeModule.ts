namespace feng3d
{
    /**
     * 粒子系统 颜色随时间变化模块
     */
    export class ParticleColorOverLifetimeModule extends ParticleModule
    {
        /**
         * The gradient controlling the particle colors.
         * 控制粒子颜色的梯度。
         */
        @serialize
        // @oav({ tooltip: "The gradient controlling the particle colors." })
        @oav({ tooltip: "控制粒子颜色的梯度。" })
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