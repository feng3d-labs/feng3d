namespace feng3d
{
    /**
     * 粒子速度组件

     */
    export class ParticlePosition extends ParticleComponent
    {
        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            var baseRange = 1;
            var x = (Math.random() - 0.5) * baseRange;
            var y = (Math.random() - 0.5) * baseRange;
            var z = (Math.random() - 0.5) * baseRange;
            particle.position = new Vector3(x, y, z);
        }
    }
}