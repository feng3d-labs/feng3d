namespace feng3d
{

    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export class TextureMaterial extends Material
    {
        uniforms = new TextureUniforms();

        constructor()
        {
            super();
            this.shaderName = "texture";
        }
    }

    export class TextureUniforms
    {
        /** 
         * 颜色
         */
        @serialize()
        @oav()
        u_color = new Color3();

        /**
         * 纹理数据
         */
        @oav()
        @serialize()
        s_texture = new Texture2D();
    }

    shaderConfig.shaders["texture"].cls = TextureUniforms;
}