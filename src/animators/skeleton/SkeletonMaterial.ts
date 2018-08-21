namespace feng3d
{
    export interface MaterialMap { SkeletonMaterial: SkeletonMaterial }

    export class SkeletonMaterial extends Material
    {
        __class__: "feng3d.SkeletonMaterial" = "feng3d.SkeletonMaterial";

        shaderName: "skeleton" = "skeleton";

        uniforms = new SkeletonUniforms();
    }

    export class SkeletonUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["skeleton"].cls = SkeletonUniforms;
}