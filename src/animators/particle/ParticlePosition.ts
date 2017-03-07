module feng3d
{
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticlePosition extends ParticleComponent
    {
        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        public generateParticle(particle: Particle)
        {
            var baseRange = 100;
            var x = (Math.random() - 0.5) * baseRange;
            var y = (Math.random() - 0.5) * baseRange;
            var z = (Math.random() - 0.5) * baseRange;
            particle.position = new Vector3D(x, y, z);

            particle.position = new Vector3D();
        }
    }
}