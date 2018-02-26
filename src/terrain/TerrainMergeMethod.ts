namespace feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMergeMethod extends RenderDataHolder
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
            //
            this.createUniformData("s_blendTexture", this.blendTexture);
            this.createUniformData("s_splatMergeTexture", this.splatMergeTexture);
            this.createUniformData("u_splatMergeTextureSize", this.splatMergeTexture.size);
            this.createUniformData("u_splatRepeats", this.splatRepeats);
            //
            this.createUniformData("u_imageSize", new Vector2(2048.0, 1024.0));
            this.createUniformData("u_tileSize", new Vector2(512.0, 512.0));
            this.createUniformData("u_maxLod", 7);
            this.createUniformData("u_uvPositionScale", 0.001);
            this.createUniformData("u_tileOffset", [
                new Vector4(0.5, 0.5, 0.0, 0.0),
                new Vector4(0.5, 0.5, 0.5, 0.0),
                new Vector4(0.5, 0.5, 0.0, 0.5),
            ]);
            this.createUniformData("u_lod0vec", new Vector4(0.5, 1, 0, 0));
            this.createBoolMacro("HAS_TERRAIN_METHOD", true);
            this.createBoolMacro("USE_TERRAIN_MERGE", true);
        }
    }
}