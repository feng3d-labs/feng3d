module feng3d {

    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticlePositionComponent extends ParticleAnimatorComponent {

        /**
		 * 创建粒子属性
         * @param particle                  粒子
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(particle: Particle, numParticles: number) {

            var baseRange = 100;
            var x = Math.random() * baseRange;
            var y = Math.random() * baseRange;
            var z = Math.random() * baseRange;
            particle.position = new Vector3D(x, y, z);
        }
    }
}