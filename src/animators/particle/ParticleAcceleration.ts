module feng3d {

    /**
     * 粒子加速度组件
     * @author feng 2017-01-09
     */
    export class ParticleAcceleration extends ParticleComponent {

        /**
         * 加速度
         */
        acceleration = new Vector3D(0, -9.8, 0);

        constructor() {

            super();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {

            this.renderData.uniforms[RenderDataID.u_particleAcceleration] = this.acceleration;
        }
    }
}