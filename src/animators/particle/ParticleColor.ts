namespace feng3d
{
    /**
     * 粒子颜色组件
     * @author feng 2017-03-14
     */
    export class ParticleColor extends ParticleComponent
    {
        /**
         * 起始颜色
         */
        @oav()
        @serialize
        startColor = new Color4(1, 0, 0, 1);

        /**
         * 结束颜色
         */
        @oav()
        @serialize
        endColor = new Color4(0, 1, 0, 1);

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            particle.color.copyFrom(this.startColor).mix(this.endColor, particle.index / particleSystem.numParticles);
        }
    }
}