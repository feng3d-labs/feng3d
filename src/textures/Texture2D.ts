module feng3d {

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D {

        public autoGenerateMip: boolean;

        public pixels?: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

    }
}