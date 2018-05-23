namespace feng3d
{
    export type ParticleMaterial = Material & { uniforms: ParticleUniforms; };

    export interface MaterialFactory
    {
        create(shader: "particle", raw?: gPartial<ParticleMaterial>): ParticleMaterial;
    }

    export interface MaterialRawMap
    {
        particle: gPartial<ParticleMaterial>
    }

    export class ParticleUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;
}