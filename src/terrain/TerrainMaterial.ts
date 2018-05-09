namespace feng3d
{
    export type TerrainMaterial = Material & { uniforms: TerrainUniforms; };

    export interface MaterialFactory
    {
        create(shader: "terrain", raw?: TerrainMaterialRaw): TerrainMaterial;
    }

    export interface MaterialRawMap
    {
        terrain: TerrainMaterialRaw
    }

    export interface TerrainMaterialRaw extends MaterialBaseRaw
    {
        shaderName?: "terrain",
        uniforms?: TerrainUniformsRaw;
    }

    export interface TerrainUniformsRaw
    {
        __class__?: "feng3d.TerrainUniforms",
        s_ambient?: Texture2DRaw;
        s_diffuse?: Texture2DRaw,
        s_envMap?: TextureCubeRaw,
        s_normal?: Texture2DRaw,
        s_specular?: Texture2DRaw,
        u_ambient?: Color3Raw,
        u_diffuse?: Color3Raw,
        u_reflectivity?: number,
        u_specular?: Color3Raw

        s_splatTexture1: Texture2D | Texture2DRaw;

        s_splatTexture2: Texture2D | Texture2DRaw

        s_splatTexture3: Texture2D | Texture2DRaw

        s_blendTexture: Texture2D | Texture2DRaw;

        u_splatRepeats: Vector4;
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