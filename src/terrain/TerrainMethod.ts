namespace feng3d
{
    export interface TerrainMethodRaw
    {
        __class__: "feng3d.TerrainMethod";
        splatRepeats?: Vector3;
        splatTexture1: Texture2DRaw
        splatTexture2: Texture2DRaw
        splatTexture3: Texture2DRaw
    }
    
    export interface MaterialFactory
    {
        create(shader: "terrain"): Material & { uniforms: TerrainUniforms; };
    }

    export class TerrainUniforms extends StandardUniforms
    {
        @serialize
        @oav({ block: "terrain" })
        s_splatTexture1 = new Texture2D({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture2 = new Texture2D({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture3 = new Texture2D({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "terrain" })
        s_blendTexture = new Texture2D();

        @serialize
        @oav({ block: "terrain" })
        u_splatRepeats = new Vector4(1, 1, 1, 1);
    }

    shaderConfig.shaders["terrain"].cls = TerrainUniforms;
}