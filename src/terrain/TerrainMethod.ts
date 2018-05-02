namespace feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMethod extends EventDispatcher
    {
        get splatTexture1()
        {
            return this._splatTexture1;
        }
        set splatTexture1(value)
        {
            if (this._splatTexture1 == value)
                return;
            this._splatTexture1 = value;
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
            this._splatTexture2 = value;
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
            this._splatTexture3 = value;
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
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.s_blendTexture = () => this.blendTexture;
            renderAtomic.uniforms.s_splatTexture1 = () => this.splatTexture1;
            renderAtomic.uniforms.s_splatTexture2 = () => this.splatTexture2;
            renderAtomic.uniforms.s_splatTexture3 = () => this.splatTexture3;
            renderAtomic.uniforms.u_splatRepeats = () => this.splatRepeats;

            renderAtomic.shaderMacro.HAS_TERRAIN_METHOD =
                this.blendTexture.checkRenderData()
                && this.splatTexture1.checkRenderData()
                && this.splatTexture2.checkRenderData()
                && this.splatTexture3.checkRenderData()
                ;
        }
    }
}