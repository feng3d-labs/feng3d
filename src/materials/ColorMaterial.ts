namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export type ColorMaterial = Material & { uniforms: ColorUniforms; };
    export interface MaterialFactory
    {
        create(shader: "color", raw?: Partial<ColorMaterial>): ColorMaterial;
    }
    export interface MaterialRawMap
    {
        color: Partial<ColorMaterial>
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