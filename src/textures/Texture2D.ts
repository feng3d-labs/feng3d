module feng3d
{

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo
    {
        public url = "";

        constructor(url: string)
        {
            super();
            this.textureType = GL.TEXTURE_2D;
            this.pixels = new Image();
            this.pixels.addEventListener("load", this.invalidate.bind(this));
            this.pixels.src = url;
            Binding.bindProperty(this, ["url"], this.pixels, "src");
        }
    }
}