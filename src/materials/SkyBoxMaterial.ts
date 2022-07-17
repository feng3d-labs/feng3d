namespace feng3d
{

    export interface UniformsTypes { skybox: SkyBoxUniforms }
    export class SkyBoxUniforms
    {
        __class__: "feng3d.SkyBoxUniforms";

        @serialize
        @oav({ component: "OAVPick", componentParam: { accepttype: "texturecube", datatype: "texturecube" } })
        s_skyboxTexture = TextureCube.default;
    }

    shaderConfig.shaders["skybox"].cls = SkyBoxUniforms;
}