namespace feng3d
{

    export interface MaterialMap { ParticleMaterial: ParticleMaterial }

    export class ParticleMaterial extends Material
    {
        __class__: "feng3d.ParticleMaterial" = "feng3d.ParticleMaterial";

        shaderName: "particle" = "particle";

        uniforms = new ParticleUniforms();

        constructor(raw?: gPartial<ParticleMaterial>)
        {
            super(raw);
        }
    }

    export class ParticleUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;
}