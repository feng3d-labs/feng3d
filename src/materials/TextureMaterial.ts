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
        public get texture()
        {
            return this._texture;
        }
        public set texture(value)
        {
            if (this._texture == value)
                return;
            this._texture = value;
        }
        private _texture: Texture2D;

        constructor()
        {
            super();
            this.setShader("texture");
            //
            this.createUniformData("s_texture", () => this.texture);
        }
    }
}