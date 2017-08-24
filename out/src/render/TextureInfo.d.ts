declare namespace feng3d {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    abstract class TextureInfo {
        /**
         * 纹理类型
         */
        textureType: number;
        protected _textureType: number;
        /**
         * 图片数据
         */
        pixels: HTMLCanvasElement | ImageData | HTMLImageElement | HTMLVideoElement | ImageData[] | HTMLVideoElement[] | HTMLImageElement[] | HTMLCanvasElement[];
        protected _pixels: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData[] | HTMLVideoElement[] | HTMLImageElement[] | HTMLCanvasElement[];
        /**
         * 纹理宽度
         */
        width: any;
        protected _width: number;
        /**
         * 纹理高度
         */
        height: any;
        protected _height: number;
        /**
         * 纹理尺寸
         */
        size: Point;
        protected _size: Point;
        /**
         * 格式
         */
        format: number;
        protected _format: number;
        /**
         * 数据类型
         */
        type: number;
        _type: number;
        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;
        private _generateMipmap;
        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY: boolean;
        private _flipY;
        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        premulAlpha: boolean;
        private _premulAlpha;
        minFilter: number;
        magFilter: number;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS: number;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT: number;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;
        /**
         * 纹理缓冲
         */
        protected _textureMap: Map<GL, WebGLTexture>;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 构建纹理
         */
        constructor();
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
        /**
         * 使纹理失效
         */
        protected invalidate(): void;
        /**
         * 激活纹理
         * @param gl
         */
        active(gl: GL): void;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getTexture(gl: GL): WebGLTexture;
        /**
         * 初始化纹理
         */
        private initTexture2D(gl);
        /**
         * 初始化纹理
         */
        private initTextureCube(gl);
        /**
         * 清理纹理
         */
        private clear();
    }
}
