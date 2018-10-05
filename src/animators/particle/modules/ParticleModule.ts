namespace feng3d
{
    /**
     * 粒子模块
     */
    export class ParticleModule extends ParticleComponent
    {
        protected _particleSystem: ParticleSystem

        constructor(particleSystem: ParticleSystem)
        {
            super();
            this._particleSystem = particleSystem;
        }
    }
}