namespace feng3d
{
    export type ParticleMaterial = Material & { uniforms: ParticleUniforms; };

    export interface MaterialFactory
    {
        create(shader: "particle", raw?: ParticleMaterialRaw): ParticleMaterial;
    }

    export interface MaterialRawMap
    {
        particle: ParticleMaterialRaw
    }

    export interface ParticleMaterialRaw extends MaterialBaseRaw
    {
        shaderName?: "particle",
        uniforms?: ParticleUniformsRaw;
    }

    export interface ParticleUniformsRaw
    {
        __class__?: "feng3d.ParticleUniforms",
        s_ambient?: Texture2DRaw;
        s_diffuse?: Texture2DRaw,
        s_envMap?: TextureCubeRaw,
        s_normal?: Texture2DRaw,
        s_specular?: Texture2DRaw,
        u_ambient?: Color3Raw,
        u_diffuse?: Color3Raw,
        u_reflectivity?: number,
        u_specular?: Color3Raw
    }

    export class ParticleUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;
}