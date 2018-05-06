namespace feng3d
{

    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    export class TerrainMethod extends EventDispatcher
    {
        s_splatTexture1 = new Texture2D();

        s_splatTexture2 = new Texture2D();

        s_splatTexture3 = new Texture2D();

        s_blendTexture = new Texture2D();

        u_splatRepeats = new Vector4(1, 1, 1, 1);

        /**
         * 构建材质
         */
        constructor()
        {
            super();

            this.s_splatTexture1.generateMipmap = true;
            this.s_splatTexture1.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.s_splatTexture1.wrapS = TextureWrap.REPEAT;
            this.s_splatTexture1.wrapT = TextureWrap.REPEAT;

            this.s_splatTexture2.generateMipmap = true;
            this.s_splatTexture2.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.s_splatTexture2.wrapS = TextureWrap.REPEAT;
            this.s_splatTexture2.wrapT = TextureWrap.REPEAT;

            this.s_splatTexture3.generateMipmap = true;
            this.s_splatTexture3.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.s_splatTexture3.wrapS = TextureWrap.REPEAT;
            this.s_splatTexture3.wrapT = TextureWrap.REPEAT;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.s_blendTexture = () => this.s_blendTexture;
            renderAtomic.uniforms.s_splatTexture1 = () => this.s_splatTexture1;
            renderAtomic.uniforms.s_splatTexture2 = () => this.s_splatTexture2;
            renderAtomic.uniforms.s_splatTexture3 = () => this.s_splatTexture3;
            renderAtomic.uniforms.u_splatRepeats = () => this.u_splatRepeats;
        }
    }

    export interface MaterialFactory
    {
        create(shader: "terrain"): Material & { uniforms: TerrainUniforms; };
    }

    export class TerrainUniforms extends StandardUniforms
    {
        @serialize()
        @oav({ block: "terrain" })
        s_splatTexture1 = new Texture2D();

        @serialize()
        @oav({ block: "terrain" })
        s_splatTexture2 = new Texture2D();

        @serialize()
        @oav({ block: "terrain" })
        s_splatTexture3 = new Texture2D();

        @serialize()
        @oav({ block: "terrain" })
        s_blendTexture = new Texture2D();

        @serialize()
        @oav({ block: "terrain" })
        u_splatRepeats = new Vector4(1, 1, 1, 1);

        /**
         * 构建材质
         */
        constructor()
        {
            super();

            this.s_splatTexture1.generateMipmap = true;
            this.s_splatTexture1.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.s_splatTexture1.wrapS = TextureWrap.REPEAT;
            this.s_splatTexture1.wrapT = TextureWrap.REPEAT;

            this.s_splatTexture2.generateMipmap = true;
            this.s_splatTexture2.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.s_splatTexture2.wrapS = TextureWrap.REPEAT;
            this.s_splatTexture2.wrapT = TextureWrap.REPEAT;

            this.s_splatTexture3.generateMipmap = true;
            this.s_splatTexture3.minFilter = TextureMinFilter.LINEAR_MIPMAP_LINEAR;
            this.s_splatTexture3.wrapS = TextureWrap.REPEAT;
            this.s_splatTexture3.wrapT = TextureWrap.REPEAT;
        }
    }

    shaderConfig.shaders["terrain"].cls = TerrainUniforms;

}