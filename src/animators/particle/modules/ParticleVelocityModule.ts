namespace feng3d
{
    /**
     * 粒子速度组件
     */
    export class ParticleVelocityModule extends ParticleModule
    {
        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        initParticleState(particle: Particle)
        {
            var baseVelocity = 5;

            var x = (Math.random() - 0.5) * baseVelocity;
            var y = baseVelocity;
            var z = (Math.random() - 0.5) * baseVelocity;

            particle.velocity = new Vector3(x, y, z);
        }
    }
}