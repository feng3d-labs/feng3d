import { Vector2 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { Constructor, gPartial } from '@feng3d/polyfill';
import { Serializable, SerializeProperty, getInstance } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { WebGLContext } from '../WebGLContext';
import { TextureDataType, TextureFormat, TextureMagFilter, TextureMinFilter, TextureTarget, TextureWrap } from '../gl/WebGLEnums';

declare module '@feng3d/serialization'
{
    interface SerializableMap extends TextureMap { }
}

export interface TextureMap { }

/**
 * 注册纹理
 *
 * 使用 @RegisterTexture 注册纹理，配合扩展 TextureMap 接口后可使用 Texture.create 方法构造纹理。
 *
 * 将同时使用 @Serializable 进行注册为可序列化。
 *
 * @param texture 纹理类名称，默认使用类名称。
 *
 * @see Serializable
 */
export function RegisterTexture<K extends keyof TextureMap>(texture: K)
{
    return (constructor: Constructor<TextureMap[K]>) =>
    {
        Serializable(texture)(constructor as any);
    };
}

/**
 * 纹理
 */
export abstract class Texture
{
    /**
     * 构造纹理。
     *
     * @param geometry 纹理类名称。
     * @param params 纹理参数。
     *
     * @returns 纹理实例。
     */
    static create<K extends keyof TextureMap>(geometry: K, params?: gPartial<TextureMap[K]>): TextureMap[K]
    {
        const instance = getInstance(geometry, params as any);

        return instance;
    }

    name: string;

    /**
     * 纹理类型
     */
    textureTarget: TextureTarget;

    /**
     * 格式
     */
    @SerializeProperty()
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
    @SerializeProperty()
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
    @SerializeProperty()
    @oav()
    generateMipmap = true;

    /**
     * 对图像进行Y轴反转。默认值为false
     */
    @SerializeProperty()
    @oav()
    flipY = false;

    /**
     * 将图像RGB颜色值得每一个分量乘以A。默认为false
     */
    @SerializeProperty()
    @oav()
    premulAlpha = false;

    @SerializeProperty()
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['LINEAR', 'NEAREST', 'NEAREST_MIPMAP_NEAREST', 'LINEAR_MIPMAP_NEAREST', 'NEAREST_MIPMAP_LINEAR', 'LINEAR_MIPMAP_LINEAR'] } })
    minFilter: TextureMinFilter = 'LINEAR_MIPMAP_LINEAR';

    @SerializeProperty()
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['LINEAR', 'NEAREST'] } })
    magFilter: TextureMagFilter = 'LINEAR';

    /**
     * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
     */
    @SerializeProperty()
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['REPEAT', 'CLAMP_TO_EDGE', 'MIRRORED_REPEAT'] } })
    wrapS: TextureWrap = 'REPEAT';

    /**
     * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式。
     */
    @SerializeProperty()
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ['REPEAT', 'CLAMP_TO_EDGE', 'MIRRORED_REPEAT'] } })
    wrapT: TextureWrap = 'REPEAT';

    /**
     * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为1。
     */
    @SerializeProperty()
    @oav()
    anisotropy = 1;

    /**
     * 是否失效，值为true时重新创建 WebGLTexture
     */
    version = 0;

    constructor()
    {
        watcher.watch(this as Texture, 'format', this.invalidate, this);
        watcher.watch(this as Texture, 'type', this.invalidate, this);
        watcher.watch(this as Texture, 'generateMipmap', this.invalidate, this);
        watcher.watch(this as Texture, 'flipY', this.invalidate, this);
        watcher.watch(this as Texture, 'premulAlpha', this.invalidate, this);
    }

    /**
     * 使纹理失效
     */
    invalidate()
    {
        this.version++;
    }

    abstract setTextureData(webGLContext: WebGLContext): void;

    /**
     * 纹理尺寸。
     */
    abstract getSize(): Vector2;
}
