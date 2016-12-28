module feng3d {

    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export class TextureMaterial extends Material {

        /**
         * 纹理数据
         */
        public texture: TextureInfo;

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            super.activate(renderData, camera);
            //
            renderData.shaderMacro.DIFFUSE_INPUT_TYPE = 2;
            renderData.shaderMacro.NEED_UV++;
            renderData.shaderMacro.NEED_UV_V++;
            this.renderData.uniforms[RenderDataID.s_texture] = this.texture;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.shaderMacro.DIFFUSE_INPUT_TYPE = 0;
            renderData.shaderMacro.NEED_UV--;
            renderData.shaderMacro.NEED_UV_V--;
            super.deactivate(renderData);
        }
    }
}