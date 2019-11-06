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

        @oav({ tooltip: "模拟空间", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
        space = ParticleSystemSimulationSpace.Local;

        // /**
        //  * When randomly selecting values between two curves or constants, this flag will cause a new random force to be chosen on each frame.
        //  * 当在两条曲线或常数之间随机选择值时，此标志将导致在每一帧上选择一个新的随机力。
        //  */
        // // @oav({ tooltip: "When randomly selecting values between two curves or constants, this flag will cause a new random force to be chosen on each frame." })
        // @oav({ tooltip: "当在两条曲线或常数之间随机选择值时，此标志将导致在每一帧上选择一个新的随机力。" })
        // randomized = false;

        private _preForce = new Vector3();
        private _currentForce = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            //
            this._currentForce.copy(this.force.getValue(rateAtLifeTime));

            if (this.space == ParticleSystemSimulationSpace.World)
            {
                this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(this._currentForce, this._currentForce);
            }

            //
            particle.velocity.x += (this._currentForce.x + this._preForce.x) * 0.5 * (time - preTime);
            particle.velocity.y += (this._currentForce.y + this._preForce.y) * 0.5 * (time - preTime);
            particle.velocity.z += (this._currentForce.z + this._preForce.z) * 0.5 * (time - preTime);

            this._preForce = this._currentForce.clone();
        }
    }
}