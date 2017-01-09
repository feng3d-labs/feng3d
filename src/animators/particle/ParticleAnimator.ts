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
        public time: number;

        /**
         * 播放速度
         */
        public playbackSpeed: number = 1;

        /**
		 * 粒子数量
		 */
        public numParticles: number = 1000;

        /**
		 * 生成粒子动画数据
		 */
        private generateAnimationSubGeometries(geometry: Geometry) {

            var vertexNumPerParticle = 1;
            var components = this.getComponentsByClass(ParticleAnimatorComponent);
            components.forEach(element => {
                element.generatePropertyOfOneParticle(this.numParticles, vertexNumPerParticle);
            });

        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {

            this.generateAnimationSubGeometries(null);
            super.updateRenderData(renderContext);
        }
    }
}