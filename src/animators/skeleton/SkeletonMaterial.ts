namespace feng3d
{
    export type SkeletonMaterial = Material & { uniforms: SkeletonUniforms; };

    export interface MaterialFactory
    {
        create(shader: "skeleton", raw?: SkeletonMaterialRaw): SkeletonMaterial;
    }

    export interface MaterialRawMap
    {
        skeleton: SkeletonMaterialRaw
    }

    export interface SkeletonMaterialRaw extends MaterialBaseRaw
    {
        shaderName?: "skeleton",
        uniforms?: SkeletonUniformsRaw;
    }

    export interface SkeletonUniformsRaw
    {
        __class__?: "feng3d.SkeletonUniforms",
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

    export class SkeletonUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["skeleton"].cls = SkeletonUniforms;
}