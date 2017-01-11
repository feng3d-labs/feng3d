module feng3d {

    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    export class ParticlePositionComponent extends ParticleAnimatorComponent {

        /**
         * 速度
         */
        public velocity: Vector3D = new Vector3D();

        constructor() {

            super();
            this.vaID = RenderDataID.a_particlePosition;
            this.vaLength = 3;
        }

        /**
		 * 创建粒子属性
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(numParticles: number) {

            var baseRange = 100;
            this.data = new Float32Array(numParticles * this.vaLength);
            for (var i = 0; i < numParticles; i++) {
                var x = Math.random() * baseRange;
                var y = Math.random() * baseRange;
                var z = Math.random() * baseRange;
                var index = i * this.vaLength;
                this.data[index] = x;
                this.data[index + 1] = y;
                this.data[index + 2] = z;
            }
        }
    }
}