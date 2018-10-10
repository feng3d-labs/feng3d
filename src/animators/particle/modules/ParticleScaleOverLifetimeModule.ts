namespace feng3d
{
    /**
     * 粒子系统 缩放随时间变化模块
     */
    export class ParticleScaleOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        scale = new Vector3(1, 1, 1);

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number)
        {
            particle.scale.multiply(this.scale);
        }
    }
}