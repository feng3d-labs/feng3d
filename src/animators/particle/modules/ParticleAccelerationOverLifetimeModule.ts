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
        acceleration = new Vector3();

        private _preAcceleration = new Vector3();
        private _currentAcceleration = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number)
        {
            //
            this._preAcceleration.copy(this.acceleration);
            this._currentAcceleration.copy(this.acceleration);

            //
            particle.velocity.x += (this._currentAcceleration.x + this._preAcceleration.x) * 0.5 * (time - preTime);
            particle.velocity.y += (this._currentAcceleration.y + this._preAcceleration.y) * 0.5 * (time - preTime);
            particle.velocity.z += (this._currentAcceleration.z + this._preAcceleration.z) * 0.5 * (time - preTime);
        }
    }
}