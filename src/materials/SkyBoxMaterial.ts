module feng3d
{

    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    export class SkyBoxMaterial extends Material
    {
        public texture: TextureCube;

        constructor(images: string[] = null)
        {
            super();
            this.shaderName = "skybox";
            if (images)
            {
                this.texture = new TextureCube(images);
            }

            Watcher.watch(this, ["skyBoxTextureCube"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms.s_skyboxTexture = this.texture;
            super.updateRenderData(renderContext, renderData);
        }
    }
}