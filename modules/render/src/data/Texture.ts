namespace feng3d
{
    export interface Texture
    {
        /**
         * 纹理类型
         */
        textureType: TextureType;

        /**
         * 格式
         */
        format: TextureFormat;

        /**
         * 数据类型
         */
        type: TextureDataType;

        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;

        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY: boolean;

        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        premulAlpha: boolean;

        minFilter: TextureMinFilter;

        magFilter: TextureMagFilter;

        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS: TextureWrap;

        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT: TextureWrap;

        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;

        /**
         * 当前使用的贴图数据
         */
        activePixels: TexImageSource | TexImageSource[];

        /**
         * 是否为渲染目标纹理
         */
        isRenderTarget: boolean;

        OFFSCREEN_WIDTH: number;

        OFFSCREEN_HEIGHT: number;

        /**
         * 是否失效，值为true时重新创建 WebGLTexture
         */
        invalid: boolean;
    }
}