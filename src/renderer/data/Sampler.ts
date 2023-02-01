import { TextureDataType, TextureFormat, TextureMagFilter, TextureMinFilter, TextureType, TextureWrap } from "../gl/WebGLEnums";

export class Sampler
{
    /**
     * 纹理类型
     */
    textureType: TextureType;

    /**
     * 数据类型
     */
    type: TextureDataType = 'UNSIGNED_BYTE';

    /**
     * 纹理缩小过滤器
     */
    minFilter: TextureMinFilter = 'LINEAR_MIPMAP_LINEAR';

    /**
     * 纹理放大滤波器
     */
    magFilter: TextureMagFilter = 'LINEAR';

    /**
     * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
     */
    wrapS: TextureWrap = 'REPEAT';

    /**
     * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式。
     */
    wrapT: TextureWrap = 'REPEAT';

    /**
     * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为1。
     */
    anisotropy = 1;

    /**
     * 格式
     */
    format: TextureFormat = 'RGBA';

    /**
     * 对图像进行Y轴反转。默认值为false
     */
    flipY = false;

    /**
     * 将图像RGB颜色值得每一个分量乘以A。默认为false
     */
    premulAlpha = false;

    /**
     * 是否生成mipmap
     */
    generateMipmap = true;
}