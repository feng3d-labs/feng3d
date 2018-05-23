namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export type ColorMaterial = Material & { uniforms: ColorUniforms; };
    export interface MaterialFactory
    {
        create(shader: "color", raw?: gPartial<ColorMaterial>): ColorMaterial;
    }
    export interface MaterialRawMap
    {
        color: gPartial<ColorMaterial>
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