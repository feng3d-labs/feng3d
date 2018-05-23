namespace feng3d
{
    export type SkeletonMaterial = Material & { uniforms: SkeletonUniforms; };

    export interface MaterialFactory
    {
        create(shader: "skeleton", raw?: gPartial<SkeletonMaterial>): SkeletonMaterial;
    }
    export interface MaterialRawMap
    {
        skeleton: gPartial<SkeletonMaterial>
    }
    export class SkeletonUniforms extends StandardUniforms
    {

    }

    shaderConfig.shaders["skeleton"].cls = SkeletonUniforms;
}