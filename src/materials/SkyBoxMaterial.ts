module feng3d
{

    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    export class SkyBoxMaterial extends Material
    {
        public skyBoxTextureCube: TextureCube;

        constructor(images: string[])
        {
            super();
            this.shaderName = "skybox";
            this.skyBoxTextureCube = new TextureCube(images);

            Watcher.watch(this, ["skyBoxTextureCube"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms[RenderDataID.s_skyboxTexture] = this.skyBoxTextureCube;
            super.updateRenderData(renderContext, renderData);
        }
    }
}