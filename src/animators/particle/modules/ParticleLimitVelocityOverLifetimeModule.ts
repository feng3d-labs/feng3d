namespace feng3d
{
    /**
     * Limit Velocity Over Lifetime module.
     * 基于时间轴限制速度模块。
     */
    export class ParticleLimitVelocityOverLifetimeModule extends ParticleModule
    {

        /**
         * 作用在粒子上的力
         */
        @serialize
        @oav()
        limit = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { constant: 1, constant1: 1 }, yCurve: { constant: 1, constant1: 1 }, zCurve: { constant: 1, constant1: 1 } });

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[rateLimitVelocityOverLifetime] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {

        }
    }

    var rateLimitVelocityOverLifetime = "_rateLimitVelocityOverLifetime";
}