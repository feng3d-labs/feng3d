namespace feng3d
{
    /**
     * 粒子系统 缩放随时间变化模块
     */
    export class ParticleScaleOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        scale = Object.setValue(new MinMaxCurveVector3(), { xCurve: { constant: 1, constant1: 1, curveMultiplier: 1 }, yCurve: { constant: 1, constant1: 1, curveMultiplier: 1 }, zCurve: { constant: 1, constant1: 1, curveMultiplier: 1 } });

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            particle.scale.multiply(this.scale.getValue(rateAtLifeTime));
        }
    }
}