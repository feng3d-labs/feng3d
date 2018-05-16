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

        s_splatTexture1: Texture2D | Texture2DRaw;

        s_splatTexture2: Texture2D | Texture2DRaw

        s_splatTexture3: Texture2D | Texture2DRaw

        s_blendTexture: Texture2D | Texture2DRaw;

        u_splatRepeats: Vector4;
    }

    export class SkeletonUniforms extends StandardUniforms
    {
        @serialize
        @oav({ block: "skeleton" })
        s_splatTexture1 = new Texture2D({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "skeleton" })
        s_splatTexture2 = new Texture2D({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "skeleton" })
        s_splatTexture3 = new Texture2D({
            generateMipmap: true,
            minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        });

        @serialize
        @oav({ block: "skeleton" })
        s_blendTexture = new Texture2D();

        @serialize
        @oav({ block: "skeleton" })
        u_splatRepeats = new Vector4(1, 1, 1, 1);
    }

    shaderConfig.shaders["skeleton"].cls = SkeletonUniforms;
}