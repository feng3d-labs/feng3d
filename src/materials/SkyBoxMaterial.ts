module feng3d {

    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    export class SkyBoxMaterial extends Material {

        public skyBoxTextureCube: TextureCube;

        constructor() {
            super();
            this.shaderName = "skybox";
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            super.activate(renderData);
            //
            renderData.uniforms[RenderDataID.s_skyboxTexture] = this.skyBoxTextureCube;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.uniforms[RenderDataID.s_skyboxTexture] = null
            super.deactivate(renderData);
        }
    }
}