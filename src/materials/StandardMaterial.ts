module feng3d {

    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    export class StandardMaterial extends Material {

        /**
         * 基本颜色
         */
        public baseColor: Color;

        /**
         * 反射率
         */
        public reflectance: number;

        /**
         * 粗糙度
         */
        public roughness: number;

        /**
         * 金属度
         */
        public metalic: number;

        /**
         * 构建
         */
        constructor() {
            super();
            this.shaderName = "standard";
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {
            super.updateRenderData(renderContext);

            this.renderData.uniforms[RenderDataID.u_baseColor] = this.baseColor.toVector3D();
            this.renderData.uniforms[RenderDataID.u_reflectance] = this.reflectance;
            this.renderData.uniforms[RenderDataID.u_roughness] = this.roughness;
            this.renderData.uniforms[RenderDataID.u_metalic] = this.metalic;
        }
    }
}