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
            this.shaderName = "skybox";
            this.skyBoxSize = new Vector3D();
            this.skyBoxTextureCube = new TextureCube(images);
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            super.activate(renderData, camera);
            //
            this.skyBoxSize.x = this.skyBoxSize.y = this.skyBoxSize.z = camera.lens.far / Math.sqrt(3);
            //
            renderData.uniforms[RenderDataID.s_skyboxTexture] = this.skyBoxTextureCube;
            renderData.uniforms[RenderDataID.u_skyBoxSize] = this.skyBoxSize;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            delete renderData.uniforms[RenderDataID.s_skyboxTexture];
            delete renderData.uniforms[RenderDataID.u_skyBoxSize];
            super.deactivate(renderData);
        }
    }
}