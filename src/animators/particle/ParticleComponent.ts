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
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {

        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {

        }
    }
}