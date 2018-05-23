namespace feng3d
{
    export type TerrainMaterial = Material & { uniforms: TerrainUniforms; };

    export interface MaterialFactory
    {
        create(shader: "terrain", raw?: gPartial<TerrainMaterial>): TerrainMaterial;
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