module feng3d {

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo {

        public pixels: HTMLImageElement;

        constructor(pixels: HTMLImageElement) {
            super();
            this.textureType = WebGL2RenderingContext.TEXTURE_2D;
            this.pixels = pixels;
        }
    }
}