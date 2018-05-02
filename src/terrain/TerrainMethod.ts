namespace feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMethod extends RenderDataHolder
    {
        get splatTexture1()
        {
            return this._splatTexture1;
        }
        set splatTexture1(value)
        {
            if (this._splatTexture1 == value)
                return;
            if (this._splatTexture1)
                this._splatTexture1.off("loaded", this.ontextureChanged, this)
            this._splatTexture1 = value;
            if (this._splatTexture1)
                this._splatTexture1.on("loaded", this.ontextureChanged, this)
        }
        private _splatTexture1: Texture2D;

        get splatTexture2()
        {
            return this._splatTexture2;
        }
        set splatTexture2(value)
        {
            if (this._splatTexture2 == value)
                return;
            if (this._splatTexture2)
                this._splatTexture2.off("loaded", this.ontextureChanged, this)
            this._splatTexture2 = value;
            if (this._splatTexture2)
                this._splatTexture2.on("loaded", this.ontextureChanged, this)
        }
        private _splatTexture2: Texture2D;

        get splatTexture3()
        {
            return this._splatTexture3;
        }
        set splatTexture3(value)
        {
            if (this._splatTexture3 == value)
                return;
            if (this._splatTexture3)
                this._splatTexture3.off("loaded", this.ontextureChanged, this)
            this._splatTexture3 = value;
            if (this._splatTexture3)
                this._splatTexture3.on("loaded", this.ontextureChanged, this)
        }
        private _splatTexture3: Texture2D;

        get blendTexture()
        {
            return this._blendTexture;
        }
        set blendTexture(value)
        {
            if (this._blendTexture == value)
                return;
            if (this._blendTexture)
                this._blendTexture.off("loaded", this.ontextureChanged, this)
            this._blendTexture = value;
            if (this._blendTexture)
                this._blendTexture.on("loaded", this.ontextureChanged, this)
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
        private _splatRepeats = new Vector4(1, 1, 1, 1);

        /**
         * 构建材质
         */
        constructor()
        {
            super();

            this.blendTexture = new Texture2D();
            this.splatTexture1 = new Texture2D();
            this.splatTexture2 = new Texture2D();
            this.splatTexture3 = new Texture2D();

            this.splatTexture1.generateMipmap = true;
            this.splatTexture1.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.splatTexture1.wrapS = TextureWrap.REPEAT;
            this.splatTexture1.wrapT = TextureWrap.REPEAT;

            this.splatTexture2.generateMipmap = true;
            this.splatTexture2.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.splatTexture2.wrapS = TextureWrap.REPEAT;
            this.splatTexture2.wrapT = TextureWrap.REPEAT;

            this.splatTexture3.generateMipmap = true;
            this.splatTexture3.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.splatTexture3.wrapS = TextureWrap.REPEAT;
            this.splatTexture3.wrapT = TextureWrap.REPEAT;

            //
            this.createUniformData("s_blendTexture", () => this.blendTexture);
            this.createUniformData("s_splatTexture1", () => this.splatTexture1);
            this.createUniformData("s_splatTexture2", () => this.splatTexture2);
            this.createUniformData("s_splatTexture3", () => this.splatTexture3);
            this.createUniformData("u_splatRepeats", () => this.splatRepeats);
        }

        private ontextureChanged()
        {
            this.createBoolMacro("B_HAS_TERRAIN_METHOD",
                this.blendTexture.checkRenderData()
                && this.splatTexture1.checkRenderData()
                && this.splatTexture2.checkRenderData()
                && this.splatTexture3.checkRenderData()
            );
        }
    }
}