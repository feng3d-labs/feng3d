namespace feng3d
{
    export interface MaterialMap { TerrainMaterial: TerrainMaterial }

    export class TerrainMaterial extends Material
    {
        __class__: "feng3d.TerrainMaterial" = "feng3d.TerrainMaterial";

        shaderName: "terrain" = "terrain";

        uniforms = new TerrainUniforms();
    }

    export class TerrainUniforms extends StandardUniforms
    {
        @serialize
        @oav({ block: "terrain" })
        s_splatTexture1 = new UrlImageTexture2D().value({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture2 = new UrlImageTexture2D().value({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture3 = new UrlImageTexture2D().value({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "terrain" })
        s_blendTexture = new UrlImageTexture2D();

        @serialize
        @oav({ block: "terrain" })
        u_splatRepeats = new Vector4(1, 1, 1, 1);
    }

    shaderConfig.shaders["terrain"].cls = TerrainUniforms;
}