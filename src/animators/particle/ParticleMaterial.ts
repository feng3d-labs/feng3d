namespace feng3d
{

    export interface UniformsMap { particle: ParticleUniforms }

    export class ParticleUniforms extends StandardUniforms
    {
        __class__: "feng3d.ParticleUniforms" = "feng3d.ParticleUniforms";

        s_diffuse = Texture2D.defaultParticle;
    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;

    rs.setDefaultAssetData(Material.particle = Object.setValue(new Material(), {
        name: "Particle-Material", assetId: "Particle-Material", shaderName: "particle",
        renderParams: { enableBlend: true, depthMask: false },
        hideFlags: HideFlags.NotEditable,
    }));
}