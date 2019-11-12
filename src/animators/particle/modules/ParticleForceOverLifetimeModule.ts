namespace feng3d
{
    /**
     * 粒子系统 作用在粒子上的力随时间变化模块
     * 
     * 控制每个粒子在其生命周期内的力。
     * Script interface for the Force Over Lifetime module.
     */
    export class ParticleForceOverLifetimeModule extends ParticleModule
    {
        /**
         * 作用在粒子上的力
         */
        @serialize
        @oav()
        force = new MinMaxCurveVector3();

        /**
         * Are the forces being applied in local or world space?
         * 这些力是作用于局部空间还是世界空间
         */
        // @oav({ tooltip: "Are the forces being applied in local or world space?", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        @oav({ tooltip: "这些力是作用于局部空间还是世界空间?", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace1 } })
        space = ParticleSystemSimulationSpace1.Local;

        // /**
        //  * When randomly selecting values between two curves or constants, this flag will cause a new random force to be chosen on each frame.
        //  * 当在两条曲线或常数之间随机选择值时，此标志将导致在每一帧上选择一个新的随机力。
        //  */
        // // @oav({ tooltip: "When randomly selecting values between two curves or constants, this flag will cause a new random force to be chosen on each frame." })
        // @oav({ tooltip: "当在两条曲线或常数之间随机选择值时，此标志将导致在每一帧上选择一个新的随机力。" })
        // randomized = false;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[_ForceOverLifetime_rate] = Math.random();
            particle[_ForceOverLifetime_preForce] = new Vector3();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            var preForce: Vector3 = particle[_ForceOverLifetime_preForce];
            particle.acceleration.sub(preForce);
            preForce.init(0, 0, 0);
            if (!this.enabled) return;

            var force = this.force.getValue(rateAtLifeTime, particle[_ForceOverLifetime_rate]);
            if (this.space == ParticleSystemSimulationSpace1.World)
            {
                this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(force, force);
            }
            particle.acceleration.add(force);
            preForce.copy(force);
        }
    }
    var _ForceOverLifetime_rate = "_ForceOverLifetime_rate";
    var _ForceOverLifetime_preForce = "_ForceOverLifetime_preVelocity";
}