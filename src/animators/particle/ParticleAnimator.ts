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

        /**
         * 周期
         */
        public cycle: number = 10000;

        private isDirty = true;

        /**
		 * 生成粒子
		 */
        private generateParticles() {

            var components = this.getComponentsByClass(ParticleComponent);

            for (var i = 0; i < this.numParticles; i++) {
                var particle = <Particle>{};
                particle.index = i;
                particle.total = this.numParticles;
                components.forEach(element => {
                    element.generateParticle(particle);
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
                this.generateParticles();
                this.isDirty = false;
            }

            this.time = ((getTimer() - this.startTime) / 1000) % this.cycle;
            this.renderData.uniforms[RenderDataID.u_particleTime] = this.time;
            this.renderData.instanceCount = this.numParticles;

            super.updateRenderData(renderContext);
        }

        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle: Particle) {

            for (var attribute in particle) {
                this.collectionParticleAttribute("a_particle_" + attribute, particle.index, particle[attribute]);
            }
        }

        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据      
         */
        private collectionParticleAttribute(attributeID: string, index: number, data: Vector3D | number | Color) {

            var attributes = this.renderData.attributes;
            var attributeRenderData = attributes[attributeID];
            var vector3DData: Float32Array;
            if (typeof data == "number") {
                if (!attributeRenderData) {
                    attributeRenderData = attributes[attributeID] = new AttributeRenderData(new Float32Array(this.numParticles), 1, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index] = data;
            } else if (data instanceof Vector3D) {
                if (!attributeRenderData) {
                    attributeRenderData = attributes[attributeID] = new AttributeRenderData(new Float32Array(this.numParticles * 3), 3, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            } else if (data instanceof Color) {
                if (!attributeRenderData) {
                    attributeRenderData = attributes[attributeID] = new AttributeRenderData(new Float32Array(this.numParticles * 4), 4, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 2] = data.a;
            } else {
                throw new Error(`无法处理${getClassName(data)}粒子属性`);
            }
        }
    }
}