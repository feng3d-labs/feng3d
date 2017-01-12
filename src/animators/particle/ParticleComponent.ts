module feng3d {

    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    export class ParticleComponent extends Component {

        /**
		 * 创建粒子属性
         * @param particle                  粒子
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(particle: Particle, numParticles: number) {

            throw onerror("必须在子类中实现该函数");
        }
    }
}