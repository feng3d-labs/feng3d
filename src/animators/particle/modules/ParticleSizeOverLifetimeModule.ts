namespace feng3d
{
    /**
     * 粒子系统 缩放随时间变化模块
     */
    export class ParticleSizeOverLifetimeModule extends ParticleModule
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
         * Curve to control particle size based on lifetime.
         * 基于寿命的粒度控制曲线。
         */
        @serialize
        // @oav({ tooltip: "Curve to control particle size based on lifetime." })
        @oav({ tooltip: "基于寿命的粒度控制曲线。" })
        size = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { constant: 1, constant1: 1, curveMultiplier: 1 }, yCurve: { constant: 1, constant1: 1, curveMultiplier: 1 }, zCurve: { constant: 1, constant1: 1, curveMultiplier: 1 } });

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[_SizeOverLifetime_rate] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            if (!this.enabled) return;

            var size = this.size.getValue(rateAtLifeTime, particle[_SizeOverLifetime_rate]);
            if (!this.separateAxes)
            {
                size.y = size.z = size.x;
            }
            particle.size.multiply(size);
        }
    }

    var _SizeOverLifetime_rate = "_SizeOverLifetime_rate";
}