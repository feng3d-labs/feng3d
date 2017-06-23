namespace feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMethod extends RenderDataHolder
    {
        public get splatTexture1()
        {
            return this._splatTexture1;
        }
        public set splatTexture1(value)
        {
            this._splatTexture1 = value;
        }
        private _splatTexture1: Texture2D;

        public get splatTexture2()
        {
            return this._splatTexture2;
        }
        public set splatTexture2(value)
        {
            this._splatTexture2 = value;
        }
        private _splatTexture2: Texture2D;

        public get splatTexture3()
        {
            return this._splatTexture3;
        }
        public set splatTexture3(value)
        {
            this._splatTexture3 = value;
        }
        private _splatTexture3: Texture2D;

        public get blendTexture()
        {
            return this._blendTexture;
        }
        public set blendTexture(value)
        {
            this._blendTexture = value;
        }
        private _blendTexture: Texture2D;

        public get splatRepeats()
        {
            return this._splatRepeats;
        }
        public set splatRepeats(value)
        {
            this._splatRepeats = value;
        }
        private _splatRepeats: Vector3D;

        /**
         * 构建材质
         */
        constructor(blendUrl: string = "", splatUrls = ["", "", ""], splatRepeats = new Vector3D(1, 1, 1, 1))
        {
            super();

            this.blendTexture = new Texture2D(blendUrl);
            this.splatTexture1 = new Texture2D(splatUrls[0] || "");
            this.splatTexture2 = new Texture2D(splatUrls[1] || "");
            this.splatTexture3 = new Texture2D(splatUrls[2] || "");

            this.splatTexture1.generateMipmap = true;
            this.splatTexture1.minFilter = GL.LINEAR_MIPMAP_LINEAR;
            this.splatTexture1.wrapS = GL.REPEAT;
            this.splatTexture1.wrapT = GL.REPEAT;

            this.splatTexture2.generateMipmap = true;
            this.splatTexture2.minFilter = GL.LINEAR_MIPMAP_LINEAR;
            this.splatTexture2.wrapS = GL.REPEAT;
            this.splatTexture2.wrapT = GL.REPEAT;

            this.splatTexture3.generateMipmap = true;
            this.splatTexture3.minFilter = GL.LINEAR_MIPMAP_LINEAR;
            this.splatTexture3.wrapS = GL.REPEAT;
            this.splatTexture3.wrapT = GL.REPEAT;

            this.splatRepeats = splatRepeats;

            //
            this.createUniformData("s_blendTexture", () => this.blendTexture);
            this.createUniformData("s_splatTexture1", () => this.splatTexture1);
            this.createUniformData("s_splatTexture2", () => this.splatTexture2);
            this.createUniformData("s_splatTexture3", () => this.splatTexture3);
            this.createUniformData("u_splatRepeats", () => this.splatRepeats);
            this.createBoolMacro("HAS_TERRAIN_METHOD", () =>
            {
                return this.blendTexture.checkRenderData()
                    && this.splatTexture1.checkRenderData()
                    && this.splatTexture2.checkRenderData()
                    && this.splatTexture3.checkRenderData();
            });
        }
    }
}