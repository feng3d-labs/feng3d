namespace feng3d
{

    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    export class ParticleComponent
    {
        /**
         * 是否开启
         */
        @oav()
        @serialize
        @watch("invalidate")
        enable = true;

        /**
         * 优先级
         */
        @oav()
        @serialize
        priority = 0;

        /**
         * 数据是否变脏
         */
        isDirty = true;

        invalidate()
        {
            this.isDirty = true;
        }

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle)
        {

        }

        setRenderState(particleAnimator: ParticleAnimator)
        {
            if (this.isDirty)
            {
                particleAnimator.invalidate();
                this.isDirty = false;
            }
        }
    }
}