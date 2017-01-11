module feng3d {

    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticleVelocityComponent extends ParticleAnimatorComponent {

        /**
         * 速度
         */
        public velocity: Vector3D = new Vector3D();

        constructor() {

            super();
            this.vaID = RenderDataID.a_particleVelocity;
            this.vaLength = 3;
        }

        /**
		 * 创建粒子属性
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(numParticles: number) {

            var baseVelocity = 1;
            this.data = new Float32Array(numParticles * this.vaLength);
            for (var i = 0; i < numParticles; i++) {
                var x = (Math.random() - 0.5) * baseVelocity;
                var y = (Math.random() - 0.5) * baseVelocity;
                var z = (Math.random() - 0.5) * baseVelocity;
                var index = i * this.vaLength;
                this.data[index] = x;
                this.data[index + 1] = y;
                this.data[index + 2] = z;
            }
        }
    }
}