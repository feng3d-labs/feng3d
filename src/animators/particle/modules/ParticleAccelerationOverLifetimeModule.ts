namespace feng3d
{
    /**
     * 粒子系统 加速度随时间变化模块
     * 
     * 控制每个粒子在其生命周期内的加速度。
     */
    export class ParticleAccelerationOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav()
        acceleration = new MinMaxCurveVector3();

        @oav({ tooltip: "模拟空间", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
        space = ParticleSystemSimulationSpace.Local;

        private _preAcceleration = new Vector3();
        private _currentAcceleration = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            //
            this._currentAcceleration.copy(this.acceleration.getValue(rateAtLifeTime));

            if (this.space == ParticleSystemSimulationSpace.World)
            {
                this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(this._currentAcceleration, this._currentAcceleration);
            }

            //
            particle.velocity.x += (this._currentAcceleration.x + this._preAcceleration.x) * 0.5 * (time - preTime);
            particle.velocity.y += (this._currentAcceleration.y + this._preAcceleration.y) * 0.5 * (time - preTime);
            particle.velocity.z += (this._currentAcceleration.z + this._preAcceleration.z) * 0.5 * (time - preTime);

            this._preAcceleration = this._currentAcceleration.clone();
        }
    }
}