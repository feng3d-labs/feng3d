module feng3d {

    /**
     * 粒子几何体
     * @author feng 2016-04-28
     */
    export class ParticleGeometry extends Geometry {

        /**
         * 粒子数量
         */
        public numParticle = 100;

        /**
         * 单个粒子几何体
         */
        public elementGeometry: Geometry;

        private isDirty = true;

        constructor() {
            super();
            this.elementGeometry = primitives.createPlane(10, 10, 1, 1, false);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {

            super.updateRenderData(renderContext);

            if (this.isDirty) {
                this.cloneFrom(primitives.createPlane(10, 10, 1, 1, false));
                for (var i = 1; i < this.numParticle; i++) {
                    this.addGeometry(this.elementGeometry);
                }
                this.isDirty = false;
            }
        }
    }
}