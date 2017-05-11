module feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMergeMethod extends RenderDataHolder
    {
        public splatMergeTexture: Texture2D;
        public blendTexture: Texture2D;
        public splatRepeats: Vector3D;

        /**
         * 构建材质
         */
        constructor()
        {
            super();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.shaderMacro.boolMacros.HAS_TERRAIN_METHOD = true;
            renderData.shaderMacro.boolMacros.USE_TERRAIN_MERGE = true;

            renderData.uniforms[RenderDataID.s_blendTexture] = this.blendTexture;
            renderData.uniforms[RenderDataID.s_splatMergeTexture] = this.splatMergeTexture;
            renderData.uniforms[RenderDataID.s_splatMergeTexture] = this.splatMergeTexture.width;
            renderData.uniforms[RenderDataID.u_splatRepeats] = this.splatRepeats;

            super.updateRenderData(renderContext, renderData);
        }
    }
}