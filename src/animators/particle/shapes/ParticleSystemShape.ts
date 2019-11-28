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
         * 计算粒子的发射位置与方向
         * 
         * @param particle 
         * @param position 
         * @param dir 
         */
        calcParticlePosDir(particle: Particle, position: Vector3, dir: Vector3)
        {

        }
    }
}