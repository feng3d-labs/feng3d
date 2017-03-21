module feng3d
{

    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    export class TextureCube extends TextureInfo
    {
        constructor(images: string[])
        {
            super();
            this.textureType = GL.TEXTURE_CUBE_MAP;

            this._pixels = [];
            for (var i = 0; i < 6; i++)
            {
                this._pixels[i] = new Image();
                this._pixels[i].addEventListener("load", this.invalidate.bind(this));
                this._pixels[i].src = images[i];
            }
        }
    }
}