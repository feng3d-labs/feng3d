module feng3d {

    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    export class TextureInfo {

        public textureType: number;

        public autoGenerateMip: boolean;

        public pixels?: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
    }

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo {

        constructor() {
            super();
            this.textureType = WebGLRenderingContext.TEXTURE_2D;
        }
    }
}