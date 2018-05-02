namespace feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMergeMethod extends EventDispatcher
    {
        get splatMergeTexture()
        {
            return this._splatMergeTexture;
        }
        set splatMergeTexture(value)
        {
            this._splatMergeTexture = value;
        }
        private _splatMergeTexture: Texture2D;

        get blendTexture()
        {
            return this._blendTexture;
        }
        set blendTexture(value)
        {
            this._blendTexture = value;
        }
        private _blendTexture: Texture2D;

        get splatRepeats()
        {
            return this._splatRepeats;
        }
        set splatRepeats(value)
        {
            this._splatRepeats = value;
        }
        private _splatRepeats: Vector4;

        /**
         * 构建材质
         */
        constructor(blendUrl = "", splatMergeUrl = "", splatRepeats = new Vector4(1, 1, 1, 1))
        {
            super();
            this.blendTexture = new Texture2D(blendUrl);

            this.splatMergeTexture = new Texture2D(splatMergeUrl || "");

            this.splatMergeTexture.minFilter = TextureMinFilter.NEAREST;
            this.splatMergeTexture.magFilter = TextureMagFilter.NEAREST;
            this.splatMergeTexture.wrapS = TextureWrap.REPEAT;
            this.splatMergeTexture.wrapT = TextureWrap.REPEAT;

            this.splatRepeats = splatRepeats;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.s_blendTexture = this.blendTexture;
            renderAtomic.uniforms.s_splatMergeTexture = this.splatMergeTexture;
            renderAtomic.uniforms.u_splatMergeTextureSize = this.splatMergeTexture.size;
            renderAtomic.uniforms.u_splatRepeats = this.splatRepeats;
            //
            renderAtomic.uniforms.u_imageSize = new Vector2(2048.0, 1024.0);
            renderAtomic.uniforms.u_tileSize = new Vector2(512.0, 512.0);
            renderAtomic.uniforms.u_maxLod = 7;
            renderAtomic.uniforms.u_uvPositionScale = 0.001;
            renderAtomic.uniforms.u_tileOffset = [
                new Vector4(0.5, 0.5, 0.0, 0.0),
                new Vector4(0.5, 0.5, 0.5, 0.0),
                new Vector4(0.5, 0.5, 0.0, 0.5),
            ];
            renderAtomic.uniforms.u_lod0vec = new Vector4(0.5, 1, 0, 0);

            renderAtomic.shaderMacro.B_HAS_TERRAIN_METHOD = true;
            renderAtomic.shaderMacro.B_USE_TERRAIN_MERGE = true;
        }
    }
}