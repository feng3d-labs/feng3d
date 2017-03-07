module feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMaterial extends Material
    {

        public diffuseTexture: Texture2D;

        public splatTexture1: Texture2D;
        public splatTexture2: Texture2D;
        public splatTexture3: Texture2D;

        public blendTexture: Texture2D;
        public splatRepeats: Vector3D;

        /**
         * 构建材质
         */
        constructor()
        {

            super();
            this.shaderName = "terrain";
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext)
        {

            super.updateRenderData(renderContext);

            this._renderData.uniforms[RenderDataID.s_texture] = this.diffuseTexture;
            this._renderData.uniforms[RenderDataID.s_blendTexture] = this.blendTexture;
            this._renderData.uniforms[RenderDataID.s_splatTexture1] = this.splatTexture1;
            this._renderData.uniforms[RenderDataID.s_splatTexture2] = this.splatTexture2;
            this._renderData.uniforms[RenderDataID.s_splatTexture3] = this.splatTexture3;
            this._renderData.uniforms[RenderDataID.u_splatRepeats] = this.splatRepeats;
        }
    }
}