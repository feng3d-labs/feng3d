module feng3d
{

    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    export class ParticleComponent extends RenderDataHolder
    {

        /**
         * 优先级
         */
        priority = 0;

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle)
        {

        }

        setRenderState(particleAnimator: ParticleAnimator)
        {

        }
    }
}