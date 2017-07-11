namespace feng3d
{

    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    export class SkyBoxMaterial extends Material
    {
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
        private _texture: TextureCube;

        constructor(images: string[] = null)
        {
            super();
            this.shaderName = "skybox";
            if (images)
            {
                this.texture = new TextureCube(images);
            }
            //
            this.createUniformData("s_skyboxTexture", () => this.texture);
        }
    }
}