namespace feng3d
{
    export interface UniformsMap { terrain: TerrainUniforms }

    export class TerrainUniforms extends StandardUniforms
    {
        __class__: "feng3d.TerrainUniforms" = "feng3d.TerrainUniforms";

        @serializeAssets
        @oav({ block: "terrain" })
        s_splatTexture1 = UrlImageTexture2D.default;

        @serializeAssets
        @oav({ block: "terrain" })
        s_splatTexture2 = UrlImageTexture2D.default;

        @serializeAssets
        @oav({ block: "terrain" })
        s_splatTexture3 = UrlImageTexture2D.default;

        @serializeAssets
        @oav({ block: "terrain" })
        s_blendTexture = UrlImageTexture2D.default;

        @serialize
        @oav({ block: "terrain" })
        u_splatRepeats = new Vector4(1, 1, 1, 1);
    }

    shaderConfig.shaders["terrain"].cls = TerrainUniforms;

    Feng3dAssets.setAssets(Material.terrain = Object.setValue(new Material(), { name: "Terrain-Material", assetsId: "Terrain-Material", shaderName: "terrain", hideFlags: HideFlags.NotEditable }));
}