module feng3d {

    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export class TextureMaterial extends Material {

        /**
         * 纹理数据
         */
        public texture: Texture2D;

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(camera: Camera3D) {

            super.updateRenderData(camera);

            this.renderData.uniforms[RenderDataID.s_texture] = this.texture;
            this.renderData.shaderMacro.valueMacros.DIFFUSE_INPUT_TYPE = 2;
            this.renderData.shaderMacro.addMacros.NEED_UV = 1;
            this.renderData.shaderMacro.addMacros.NEED_UV_V = 1;
        }
    }
}