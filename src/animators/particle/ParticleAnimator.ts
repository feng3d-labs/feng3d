module feng3d {

    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    export class ParticleAnimator extends Object3DComponent {

        /**
         * 是否正在播放
         */
        public isPlaying: boolean;

        /**
         * 粒子时间
         */
        public time: number = 0;

        /**
         * 起始时间
         */
        public startTime: number = 0;

        /**
         * 播放速度
         */
        public playbackSpeed: number = 1;

        /**
		 * 粒子数量
		 */
        public numParticles: number = 1000;

        private isDirty = true;

        /**
		 * 生成粒子动画数据
		 */
        private generateAnimationSubGeometries() {

            var components = this.getComponentsByClass(ParticleAnimatorComponent);

            for (var i = 0; i < this.numParticles; i++) {
                var particle = new Particle();
                particle.index = i;
                components.forEach(element => {
                    element.generatePropertyOfOneParticle(particle, this.numParticles);
                });
                this.collectionParticle(particle);
            }
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {

            if (this.isDirty) {

                this.startTime = getTimer();
                this.generateAnimationSubGeometries();
                this.isDirty = false;
            }

            this.time = (getTimer() - this.startTime) % 3000;
            this.renderData.uniforms[RenderDataID.u_particleTime] = this.time;
            this.renderData.instanceCount = this.numParticles;

            super.updateRenderData(renderContext);
        }

        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle: Particle) {

            var attributes = this.renderData.attributes;
            var attributeRenderData: AttributeRenderData;
            var vector3DData: Float32Array;
            if (particle.position) {
                attributeRenderData = attributes[RenderDataID.a_particlePosition];
                if (!attributeRenderData) {
                    attributeRenderData = attributes[RenderDataID.a_particlePosition] = new AttributeRenderData(new Float32Array(this.numParticles * 3), 3, 1)
                }
                vector3DData = attributes[RenderDataID.a_particlePosition].data;
                vector3DData[particle.index * 3] = particle.position.x;
                vector3DData[particle.index * 3 + 1] = particle.position.y;
                vector3DData[particle.index * 3 + 2] = particle.position.z;
            }

            if (particle.velocity) {
                attributeRenderData = attributes[RenderDataID.a_particleVelocity];
                if (!attributeRenderData) {
                    attributeRenderData = attributes[RenderDataID.a_particleVelocity] = new AttributeRenderData(new Float32Array(this.numParticles * 3), 3, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[particle.index * 3] = particle.velocity.x;
                vector3DData[particle.index * 3 + 1] = particle.velocity.y;
                vector3DData[particle.index * 3 + 2] = particle.velocity.z;
            }
        }
    }
}