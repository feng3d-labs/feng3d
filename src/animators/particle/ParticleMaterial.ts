namespace feng3d
{

    export interface UniformsMap { particle: ParticleUniforms }

    export class ParticleUniforms extends StandardUniforms
    {
        __class__: "feng3d.ParticleUniforms" = "feng3d.ParticleUniforms";

        s_diffuse = Texture2D.defaultParticle;
    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;

    AssetData.addAssetData("Particle-Material", Material.particle = serialization.setValue(new Material(), {
        name: "Particle-Material", assetId: "Particle-Material", shaderName: "particle",
        renderParams: { enableBlend: true, depthMask: false, sfactor: BlendFactor.ONE, dfactor: BlendFactor.ONE_MINUS_SRC_COLOR, cullFace: CullFace.NONE },
        hideFlags: HideFlags.NotEditable,
    }));
}