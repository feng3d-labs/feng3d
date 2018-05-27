namespace feng3d
{
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticleVelocity extends ParticleComponent
    {
        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            var baseVelocity = 1;

            var x = (Math.random() - 0.5) * baseVelocity;
            var y = baseVelocity;
            var z = (Math.random() - 0.5) * baseVelocity;

            particle.velocity = new Vector3(x, y, z);
        }
    }
}