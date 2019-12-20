namespace feng3d
{
    export interface UniformsTypes { terrain: TerrainUniforms }

    export class TerrainUniforms extends StandardUniforms
    {
        __class__: "feng3d.TerrainUniforms";

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture1 = Texture2D.default;

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture2 = Texture2D.default;

        @serialize
        @oav({ block: "terrain" })
        s_splatTexture3 = Texture2D.default;

        @serialize
        @oav({ block: "terrain" })
        s_blendTexture = Texture2D.default;

        @serialize
        @oav({ block: "terrain" })
        u_splatRepeats = new Vector4(1, 1, 1, 1);
    }

    shaderConfig.shaders["terrain"].cls = TerrainUniforms;

    export interface DefaultMaterial
    {
        "Terrain-Material": Material;
    }

    Material.setDefault("Terrain-Material", { shaderName: "terrain" });
}