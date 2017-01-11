module feng3d {

    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    export class TextureInfo {

        /**
         * 纹理类型
         */
        public textureType: number;
        /**
         * 内部格式
         */
        public internalformat: number = Context3D.RGB;
        /**
         * 格式
         */
        public format: number = Context3D.RGB;
        /**
         * 数据类型
         */
        public type: number = Context3D.UNSIGNED_BYTE;

        /**
         * 是否生成mipmap
         */
        public generateMipmap: boolean = true;

        /**
         * 图片y轴向
         */
        public flipY = 1;

        public minFilter = Context3D.LINEAR;

        public magFilter = Context3D.NEAREST;

        public wrapS = Context3D.CLAMP_TO_EDGE;
        public wrapT = Context3D.CLAMP_TO_EDGE;

        /**
         * 图片数据
         */
        // ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
        public pixels: HTMLImageElement | HTMLImageElement[];
    }
}