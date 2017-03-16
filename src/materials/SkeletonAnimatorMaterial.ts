module feng3d
{

    /**
     * 粒子材质（为了使用独立的着色器，暂时设置粒子材质）
     * @author feng 2017-01-09
     */
    export class SkeletonAnimatorMaterial extends Material
    {

        /**
         * 纹理数据
         */
        public texture: Texture2D;

        constructor()
        {
            super();
            this.shaderName = "skeleton";
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.uniforms[RenderDataID.s_texture] = this.texture;
            super.updateRenderData(renderContext, renderData);
        }
    }
}