module feng3d {

    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    export class SkyBoxMaterial extends Material {

        public skyBoxTextureCube: TextureCube;
        private skyBoxSize: Vector3D;

        constructor(images: HTMLImageElement[]) {
            super();
            this.renderData.shaderName = "skybox";
            this.skyBoxSize = new Vector3D();
            this.skyBoxTextureCube = new TextureCube(images);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(camera: Camera3D) {
            
            super.updateRenderData(camera);

            //
            this.skyBoxSize.x = this.skyBoxSize.y = this.skyBoxSize.z = camera.lens.far / Math.sqrt(3);
            //
            this.renderData.uniforms[RenderDataID.s_skyboxTexture] = this.skyBoxTextureCube;
            this.renderData.uniforms[RenderDataID.u_skyBoxSize] = this.skyBoxSize;
        }
    }
}