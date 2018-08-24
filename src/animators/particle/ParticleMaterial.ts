namespace feng3d
{

    export interface MaterialMap { ParticleMaterial: ParticleMaterial }

    export class ParticleMaterial extends Material
    {
        __class__: "feng3d.ParticleMaterial" = "feng3d.ParticleMaterial";

        uniforms: ParticleUniforms;

        constructor()
        {
            super();
            this.shaderName = "particle";
            this.uniforms = new ParticleUniforms();
        }
    }

    export class ParticleUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;
}