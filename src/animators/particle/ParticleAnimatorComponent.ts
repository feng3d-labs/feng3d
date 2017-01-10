module feng3d {

    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    export class ParticleAnimatorComponent extends RenderDataHolder {

        /**
         * 单个粒子数据
         */
        protected data: Float32Array;

        /**
         * 粒子属性数据编号
         */
        protected vaID: string;

        /**
         * 粒子属性长度
         */
        protected vaLength: number;

        /**
		 * 创建粒子属性
         * @param numParticles              粒子数量
         * @param vertexNumPerParticle      一个粒子的顶点数
		 */
        public generatePropertyOfOneParticle(numParticles: number, vertexNumPerParticle: number) {

            throw onerror("必须在子类中实现该函数");
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {

            super.updateRenderData(renderContext);

            this.renderData.attributes[this.vaID] = new AttributeRenderData(this.data, this.vaLength, 1);
        }
    }
}