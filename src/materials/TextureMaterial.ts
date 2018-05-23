namespace feng3d
{
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export type TextureMaterial = Material & { uniforms: TextureUniforms; };
    export interface MaterialFactory
    {
        create(shader: "texture", raw?: gPartial<TextureMaterial>): TextureMaterial;
    }
    export interface MaterialRawMap
    {
        texture: gPartial<TextureMaterial>
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