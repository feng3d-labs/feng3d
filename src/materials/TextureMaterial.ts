namespace feng3d
{

    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export class TextureMaterial extends Material
    {
        /**
         * 纹理数据
         */
        @oav()
        @serialize()
        get texture()
        {
            return this._texture;
        }
        set texture(value)
        {
            if (this._texture == value)
                return;
            this._texture = value;
        }
        private _texture: Texture2D | ImageDataTexture;

        @oav()
        @serialize()
        color = new Color();

        constructor()
        {
            super();
            this.shaderName = "texture";
            //
            this.createUniformData("u_color", () => this.color);
            this.createUniformData("s_texture", () => this.texture);
        }
    }

    export interface Uniforms
    {
        /**
         * 
         */
        u_color: Color;
    }
}