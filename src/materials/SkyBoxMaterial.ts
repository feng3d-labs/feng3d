module feng3d
{

    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    export class SkyBoxMaterial extends Material
    {
        public skyBoxTextureCube: TextureCube;
        private skyBoxSize: Vector3D;

        constructor(images: string[])
        {
            super();
            this.shaderName = "skybox";
            this.skyBoxSize = new Vector3D();
            this.skyBoxTextureCube = new TextureCube(images);

            Watcher.watch(this, ["skyBoxTextureCube"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            this.skyBoxSize.x = this.skyBoxSize.y = this.skyBoxSize.z = renderContext.camera.far / Math.sqrt(3);
            //
            renderData.uniforms[RenderDataID.s_skyboxTexture] = this.skyBoxTextureCube;
            renderData.uniforms[RenderDataID.u_skyBoxSize] = this.skyBoxSize;
            super.updateRenderData(renderContext, renderData);
        }
    }
}