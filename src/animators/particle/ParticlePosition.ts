module feng3d {

    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticlePosition extends ParticleComponent {

        constructor() {

            super();
            this.renderData.attributes[RenderDataID.a_particlePosition] = this.attributeRenderData = new AttributeRenderData(null, 3, 1);
        }

        /**
		 * 创建粒子属性
         * @param particle                  粒子
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(particle: Particle, numParticles: number) {


            var baseRange = 100;
            var x = (Math.random() - 0.5) * baseRange;
            var y = (Math.random() - 0.5) * baseRange;
            var z = (Math.random() - 0.5) * baseRange;
            var position = particle.position = new Vector3D(x, y, z);
            var position = particle.position = new Vector3D();
            //
            var data = this.attributeRenderData.getOrCreateData(numParticles);
            data[particle.index * 3] = position.x;
            data[particle.index * 3 + 1] = position.y;
            data[particle.index * 3 + 2] = position.z;
        }
    }
}