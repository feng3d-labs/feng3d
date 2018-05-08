namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export type ColorMaterial = Material & { uniforms: ColorUniforms; };
    export interface MaterialFactory
    {
        create(shader: "color", raw?: ColorMaterialRaw): ColorMaterial;
    }

    export interface MaterialRawMap
    {
        color: ColorMaterialRaw
    }

    export interface ColorMaterialRaw extends MaterialBaseRaw
    {
        shaderName?: "color",
        uniforms?: ColorUniformsRaw;
    }

    export interface ColorUniformsRaw
    {
        __class__?: "feng3d.ColorUniforms",
        u_diffuseInput?: Color4 | Color4Raw
    }

    export class ColorUniforms
    {
        /** 
         * 颜色
         */
        @serialize
        @oav()
        u_diffuseInput = new Color4();
    }

    shaderConfig.shaders["color"].cls = ColorUniforms;
}