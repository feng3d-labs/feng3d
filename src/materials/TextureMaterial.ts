namespace feng3d
{
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export type TextureMaterial = Material & { uniforms: TextureUniforms; };
    export interface MaterialFactory
    {
        create(shader: "texture", raw?: TextureMaterialRaw): TextureMaterial;
    }

    export interface MaterialRawMap
    {
        texture: TextureMaterialRaw
    }

    export interface TextureMaterialRaw extends MaterialBaseRaw
    {
        shaderName?: "texture",
        uniforms?: TextureUniformsRaw;
    }

    export interface TextureUniformsRaw
    {
        __class__?: "feng3d.TextureUniforms",
        u_color?: Color4 | Color4Raw
        s_texture?: Texture2D | Texture2DRaw
    }

    export class TextureUniforms
    {
        /** 
         * 颜色
         */
        @serialize
        @oav()
        u_color = new Color4();

        /**
         * 纹理数据
         */
        @oav()
        @serialize
        s_texture = new Texture2D();
    }

    shaderConfig.shaders["texture"].cls = TextureUniforms;
}