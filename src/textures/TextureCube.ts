module feng3d
{

    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    export class TextureCube extends TextureInfo
    {

        public pixels: HTMLImageElement[];

        constructor(images: HTMLImageElement[])
        {
            super();
            this.textureType = Context3D.TEXTURE_CUBE_MAP;
            this.pixels = images;
        }
    }
}