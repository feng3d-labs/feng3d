namespace feng3d
{

    export interface MaterialMap { TextureMaterial: TextureMaterial }

    /**
     * 纹理材质
     */
    export class TextureMaterial extends Material
    {
        __class__: "feng3d.TextureMaterial" = "feng3d.TextureMaterial";

        uniforms: TextureUniforms;

        constructor()
        {
            super();
            this.shaderName = "texture";
            this.uniforms = new TextureUniforms();
        }
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
        s_texture = new UrlImageTexture2D();
    }

    shaderConfig.shaders["texture"].cls = TextureUniforms;
}