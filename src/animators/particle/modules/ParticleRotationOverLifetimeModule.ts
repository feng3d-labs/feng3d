namespace feng3d
{
    /**
     * 粒子系统 旋转角度随时间变化模块
     */
    export class ParticleRotationOverLifetimeModule extends ParticleModule
    {
        /**
         * Set the rotation over lifetime on each axis separately.
         * 在每个轴上分别设置基于生命周期的旋转。
         */
        @serialize
        // @oav({ tooltip: "Set the rotation over lifetime on each axis separately." })
        @oav({ tooltip: "在每个轴上分别设置基于生命周期的旋转。" })
        separateAxes = false;

        /**
         * 角速度，基于生命周期的旋转。
         */
        @serialize
        @oav({ tooltip: "角速度，基于生命周期的旋转。" })
        angularVelocity = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { constant: 45, constant1: 45, curveMultiplier: 45 }, yCurve: { constant: 45, constant1: 45, curveMultiplier: 45 }, zCurve: { constant: 45, constant1: 45, curveMultiplier: 45 } });

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            var v = this.angularVelocity.getValue(rateAtLifeTime);
            if (!this.separateAxes)
            {
                v.x = v.y = 0;
            }
            particle.rotation.x += v.x * (time - preTime);
            particle.rotation.y += v.y * (time - preTime);
            particle.rotation.z += v.z * (time - preTime);
        }
    }
}