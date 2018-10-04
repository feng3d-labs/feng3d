namespace feng3d
{

    /**
     * 粒子动画组件
     */
    export class ParticleComponent
    {
        /**
         * 是否开启
         */
        @oav()
        @serialize
        @watch("invalidate")
        enabled = true;

        /**
         * 数据是否变脏
         */
        isInvalid = true;

        invalidate()
        {
            this.isInvalid = true;
        }

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {

        }

        setRenderState(particleSystem: ParticleSystem, renderAtomic: RenderAtomic)
        {
            if (this.isInvalid)
            {
                particleSystem.invalidate();
                this.isInvalid = false;
            }
        }
    }
}