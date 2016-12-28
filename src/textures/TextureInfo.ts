module feng3d {

    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    export class TextureInfo {

        public textureType: number;

        public autoGenerateMip: boolean;

        // ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
        public pixels: HTMLImageElement | HTMLImageElement[];
    }
}