namespace feng3d
{
    /**
     * 粒子系统 发射形状
     */
    export class ParticleSystemShape
    {
        protected _module: ParticleShapeModule;

        constructor(module: ParticleShapeModule)
        {
            this._module = module;
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {

        }
    }
}