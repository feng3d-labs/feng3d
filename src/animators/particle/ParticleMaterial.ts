namespace feng3d
{
    export type ParticleMaterial = Material & { uniforms: ParticleUniforms; };

    export interface MaterialFactory
    {
        create(shader: "particle", raw?: Partial<ParticleMaterial>): ParticleMaterial;
    }

    export interface MaterialRawMap
    {
        particle: Partial<ParticleMaterial>
    }

    export class ParticleUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;
}