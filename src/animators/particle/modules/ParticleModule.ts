namespace feng3d
{
    /**
     * 粒子模块
     */
    export class ParticleModule
    {
        protected _particleSystem: ParticleSystem

        constructor(particleSystem: ParticleSystem)
        {
            this._particleSystem = particleSystem;
        }
    }
}