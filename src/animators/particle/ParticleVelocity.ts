module feng3d {

    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticleVelocity extends ParticleComponent {

        constructor() {

            super();
            this.renderData.attributes[RenderDataID.a_particleVelocity] = this.attributeRenderData = new AttributeRenderData(null, 3, 1);
        }

        /**
		 * 创建粒子属性
         * @param particle                  粒子
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(particle: Particle, numParticles: number) {

            var baseVelocity = 100;

            var x = (Math.random() - 0.5) * baseVelocity;
            var y = (Math.random() - 0.5) * baseVelocity;
            var z = (Math.random() - 0.5) * baseVelocity;

            var velocity = particle.velocity = new Vector3D(x, y, z);
            //
            var data = this.attributeRenderData.getOrCreateData(numParticles);
            data[particle.index * 3] = velocity.x;
            data[particle.index * 3 + 1] = velocity.y;
            data[particle.index * 3 + 2] = velocity.z;
        }
    }
}