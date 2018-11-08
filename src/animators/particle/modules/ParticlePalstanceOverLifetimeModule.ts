namespace feng3d
{
    /**
     * 粒子系统 角速度随时间变化模块
     */
    export class ParticlePalstanceOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav({ tooltip: "角速度" })
        palstance = Object.setValue(new MinMaxCurveVector3(), { xCurve: { constant: 45, constant1: 45, curveMultiplier: 45 }, yCurve: { constant: 45, constant1: 45, curveMultiplier: 45 }, zCurve: { constant: 45, constant1: 45, curveMultiplier: 45 } });

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            var v = this.palstance.getValue(rateAtLifeTime);

            particle.rotation.x += v.x * (time - preTime);
            particle.rotation.y += v.y * (time - preTime);
            particle.rotation.z += v.z * (time - preTime);
        }
    }
}