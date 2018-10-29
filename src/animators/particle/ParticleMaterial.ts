namespace feng3d
{

    export interface UniformsMap { particle: ParticleUniforms }

    export class ParticleUniforms extends StandardUniforms
    {
        __class__: "feng3d.ParticleUniforms" = "feng3d.ParticleUniforms";

        s_diffuse = UrlImageTexture2D.defaultParticle;
    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;

    Feng3dAssets.setAssets(Material.particle = Object.setValue(new Material(), {
        name: "Particle-Material", assetsId: "Particle-Material", shaderName: "particle",
        renderParams: { enableBlend: true, depthMask: false },
        hideFlags: HideFlags.NotEditable,
    }));
}