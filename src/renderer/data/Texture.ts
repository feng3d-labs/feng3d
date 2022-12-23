import { EventEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { mathUtil } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { TextureDataType, TextureFormat, TextureMagFilter, TextureMinFilter, TextureType, TextureWrap } from '../gl/WebGLEnums';

export class Texture<T = any> extends EventEmitter<T>
{
    /**
     * 纹理类型
     */
    textureType: TextureType;

    /**
     * 格式
     */
    @serialize
    @oav({
        component: 'OAVEnum', componentParam: {
            enumClass: ['ALPHA', 'RGB', `RGBA`, `LUMINANCE`, `LUMINANCE_ALPHA`, `DEPTH_COMPONENT`,
                `DEPTH_STENCIL`, `SRGB_EXT`, `SRGB_ALPHA_EXT`, `R8`, `R16F`, `R32F`,
                `R8UI`, `RG8`, `RG16F`, `RG32F`, `RG8UI`, `RG16UI`,
                `RG32UI`, `RGB8`, `SRGB8`, `RGB565`, `R11F_G11F_B10F`, `RGB9_E5`, `RGB16F`, `RGB32F`,
                `RGB8UI`, `RGBA8`, `RGB5_A1`, `RGB10_A2`, `RGBA4`, `RGBA16F`, `RGBA32F`, `RGBA8UI`]
        }
    })
    format: TextureFormat = 'RGBA';

    /**
     * 数据类型
     */
    @serialize
    @oav({
        component: 'OAVEnum', componentParam: {
            enumClass: ['UNSIGNED_BYTE', 'UNSIGNED_SHORT_5_6_5', 'UNSIGNED_SHORT_4_4_4_4', 'UNSIGNED_SHORT_5_5_5_1', 'UNSIGNED_SHORT',
                'UNSIGNED_INT', 'UNSIGNED_INT_24_8_WEBGL', 'FLOAT', 'HALF_FLOAT_OES', 'BYTE', 'SHORT', 'INT',
                'HALF_FLOAT', 'UNSIGNED_INT_2_10_10_10_REV', 'UNSIGNED_INT_10F_11F_11F_REV', 'UNSIGNED_INT_5_9_9_9_REV', 'UNSIGNED_INT_24_8', 'FLOAT_32_UNSIGNED_INT_24_8_REV']
        }
    })
    type: TextureDataType = 'UNSIGNED_BYTE';

    /**
     * 是否生成mipmap
     */
    @serialize
    @oav()
    generateMipmap = true;

    /**
     * 对图像进行Y轴反转。默认值为false
     */
    @serialize
    @oav()
    flipY = false;

    /**
     * 将图像RGB颜色值得每一个分量乘以A。默认为false
     */
    @serialize
    @oav()
    premulAlpha = false;

    @serialize
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['LINEAR', 'NEAREST', 'NEAREST_MIPMAP_NEAREST', 'LINEAR_MIPMAP_NEAREST', 'NEAREST_MIPMAP_LINEAR', 'LINEAR_MIPMAP_LINEAR'] } })
    minFilter: TextureMinFilter = 'LINEAR_MIPMAP_LINEAR';

    @serialize
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['LINEAR', 'NEAREST'] } })
    magFilter: TextureMagFilter = 'LINEAR';

    /**
     * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
     */
    @serialize
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['REPEAT', 'CLAMP_TO_EDGE', 'MIRRORED_REPEAT'] } })
    get wrapS()
    {
        if (!this.isPowerOfTwo)
        {
            return 'CLAMP_TO_EDGE';
        }

        return this._wrapS;
    }
    set wrapS(v)
    {
        this._wrapS = v;
    }
    private _wrapS: TextureWrap = 'REPEAT';

    /**
     * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式。
     */
    @serialize
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['REPEAT', 'CLAMP_TO_EDGE', 'MIRRORED_REPEAT'] } })
    get wrapT()
    {
        if (!this.isPowerOfTwo)
        {
            return 'CLAMP_TO_EDGE';
        }

        return this._wrapT;
    }
    set wrapT(v)
    {
        this._wrapT = v;
    }
    private _wrapT: TextureWrap = 'REPEAT';

    /**
     * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为1。
     */
    @serialize
    @oav()
    anisotropy = 1;

    /**
     * 是否失效，值为true时重新创建 WebGLTexture
     */
    invalid = true;

    /**
     * 当前使用的贴图数据
     */
    get activePixels()
    {
        this.updateActivePixels();

        return this._activePixels;
    }
    protected _activePixels: TexImageSource | TexImageSource[];

    /**
     * 是否为渲染目标纹理
     */
    isRenderTarget = false;

    OFFSCREEN_WIDTH = 1024;

    OFFSCREEN_HEIGHT = 1024;

    /**
     * 当贴图数据未加载好等情况时代替使用
     */
    noPixels: string | string[];

    /**
     * 需要使用的贴图数据
     */
    protected _pixels: TexImageSource | TexImageSource[];

    constructor()
    {
        super();
        watcher.watch(this as Texture<any>, 'format', this.invalidate, this);
        watcher.watch(this as Texture<any>, 'type', this.invalidate, this);
        watcher.watch(this as Texture<any>, 'generateMipmap', this.invalidate, this);
        watcher.watch(this as Texture<any>, 'flipY', this.invalidate, this);
        watcher.watch(this as Texture<any>, 'premulAlpha', this.invalidate, this);
        watcher.watch(this as Texture<any>, 'OFFSCREEN_WIDTH', this.invalidate, this);
        watcher.watch(this as Texture<any>, 'OFFSCREEN_HEIGHT', this.invalidate, this);
    }

    /**
     * 使纹理失效
     */
    invalidate()
    {
        this.invalid = true;
    }

    /**
     * 是否为2的幂贴图
     */
    get isPowerOfTwo()
    {
        if (this.isRenderTarget)
        {
            if (this.OFFSCREEN_WIDTH === 0 || !mathUtil.isPowerOfTwo(this.OFFSCREEN_WIDTH))
            {
                return false;
            }
            if (this.OFFSCREEN_HEIGHT === 0 || !mathUtil.isPowerOfTwo(this.OFFSCREEN_HEIGHT))
            {
                return false;
            }

            return true;
        }
        let pixels = this.activePixels;
        if (!pixels) return false;
        if (!Array.isArray(pixels))
        { pixels = [pixels]; }
        for (let i = 0; i < pixels.length; i++)
        {
            const element = pixels[i];
            if (element.width === 0 || !mathUtil.isPowerOfTwo(element.width))
            {
                return false;
            }
            if (element.height === 0 || !mathUtil.isPowerOfTwo(element.height))
            {
                return false;
            }
        }

        return true;
    }

    protected updateActivePixels()
    {
    }
}
