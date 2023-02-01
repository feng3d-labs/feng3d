import { EventEmitter } from '../../event/EventEmitter';
import { oav } from '../../objectview/ObjectView';
import { mathUtil } from '../../polyfill/MathUtil';
import { Constructor, gPartial } from '../../polyfill/Types';
import { getInstance } from '../../serialization/getInstance';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { TextureDataType, TextureFormat, TextureMagFilter, TextureMinFilter, TextureType, TextureWrap } from '../gl/WebGLEnums';
import { UniformInfo } from '../gl/WebGLShaders';
import { WebGLRenderer } from '../WebGLRenderer';

declare module '../../serialization/Serializable'
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
export class Texture
{
    /**
     * 事件发射器
     */
    readonly emitter = new EventEmitter(this);

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

    /**
     * 纹理类型
     */
    textureType: TextureType;

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
    @SerializeProperty()
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
    @SerializeProperty()
    @oav()
    anisotropy = 1;

    /**
     * 是否失效，值为true时重新创建 WebGLTexture
     */
    version = 0;

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
        watcher.watch(this as Texture, 'format', this.invalidate, this);
        watcher.watch(this as Texture, 'type', this.invalidate, this);
        watcher.watch(this as Texture, 'generateMipmap', this.invalidate, this);
        watcher.watch(this as Texture, 'flipY', this.invalidate, this);
        watcher.watch(this as Texture, 'premulAlpha', this.invalidate, this);
        watcher.watch(this as Texture, 'OFFSCREEN_WIDTH', this.invalidate, this);
        watcher.watch(this as Texture, 'OFFSCREEN_HEIGHT', this.invalidate, this);
    }

    /**
     * 使纹理失效
     */
    invalidate()
    {
        this.version++;
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

    active(webGLRenderer: WebGLRenderer, activeInfo?: UniformInfo)
    {
        const { gl } = webGLRenderer;

        if (activeInfo)
        {
            // 激活纹理编号
            gl.activeTexture(gl[`TEXTURE${activeInfo.textureID}`]);
        }
        const data = this;

        const texture = this.getTexture(webGLRenderer, data);

        const textureType = gl[data.textureType];

        // 绑定纹理
        gl.bindTexture(textureType, texture);

        this.setTextureParameters(webGLRenderer, data);

        if (activeInfo)
        {
            // 设置纹理所在采样编号
            gl.uniform1i(activeInfo.location, activeInfo.textureID);
        }

        return texture;
    }

    private setTextureParameters(webGLRenderer: WebGLRenderer, texture: Texture)
    {
        const { gl, extensions, capabilities, textures } = webGLRenderer;

        const { textureType, type, minFilter, magFilter, wrapS, wrapT, anisotropy } = texture;

        const cache = textures.get(texture);

        const textureTarget = gl[textureType];

        // 设置纹理参数
        if (cache.minFilter !== minFilter)
        {
            gl.texParameteri(textureTarget, gl.TEXTURE_MIN_FILTER, gl[minFilter]);
            cache.minFilter = minFilter;
        }
        if (cache.magFilter !== magFilter)
        {
            gl.texParameteri(textureTarget, gl.TEXTURE_MAG_FILTER, gl[magFilter]);
            cache.magFilter = magFilter;
        }
        if (cache.wrapS !== wrapS)
        {
            gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_S, gl[wrapS]);
            cache.wrapS = wrapS;
        }
        if (cache.wrapT !== wrapT)
        {
            gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_T, gl[wrapT]);
            cache.wrapT = wrapT;
        }

        if (cache.anisotropy !== anisotropy)
        {
            if (extensions.has('EXT_texture_filter_anisotropic') === true)
            {
                const extension = extensions.get('EXT_texture_filter_anisotropic');

                if (type === 'FLOAT' && extensions.has('OES_texture_float_linear') === false) return; // verify extension for WebGL 1 and WebGL 2
                if (capabilities.isWebGL2 === false && (type === 'HALF_FLOAT' && extensions.has('OES_texture_half_float_linear') === false)) return; // verify extension for WebGL 1 only

                if (anisotropy > 1)
                {
                    gl.texParameterf(textureTarget, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(anisotropy, capabilities.maxAnisotropy));
                }
            }
            cache.anisotropy = anisotropy;
        }
    }

    /**
     * 获取顶点属性缓冲
     * @param data 数据
     */
    private getTexture(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl, textures } = webGLRenderer;

        let cache = textures.get(data);
        if (cache && data.version !== cache.version)
        {
            data.clear(webGLRenderer, data);
            cache = null;
        }
        if (!cache)
        {
            const texture = gl.createTexture(); // Create a texture object
            if (!texture)
            {
                console.error('createTexture 失败！');
                throw '';
            }

            //
            const textureType = gl[data.textureType];

            // 设置图片y轴方向
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, data.flipY ? 1 : 0);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, data.premulAlpha ? 1 : 0);
            // 绑定纹理
            gl.bindTexture(textureType, texture);

            // 设置纹理图片
            switch (textureType)
            {
                case gl.TEXTURE_CUBE_MAP:
                    if (data.isRenderTarget)
                    {
                        this.renderTexImageCube(webGLRenderer, data);
                    }
                    else
                    {
                        this.texImageCube(webGLRenderer, data);
                    }
                    break;
                case gl.TEXTURE_2D:
                    if (data.isRenderTarget)
                    {
                        this.renderTexImage2D(webGLRenderer, data);
                    }
                    else
                    {
                        this.texImage2D(webGLRenderer, data);
                    }
                    break;
                default:
                    throw '';
            }

            if (data.generateMipmap)
            {
                gl.generateMipmap(textureType);
            }

            cache = { texture, version: data.version };
            textures.set(data, cache);
        }

        return cache.texture;
    }

    private renderTexImageCube(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl } = webGLRenderer;

        const format = gl[data.format];
        const type = gl[data.type];

        const faces = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (let i = 0; i < faces.length; i++)
        {
            gl.texImage2D(faces[i], 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
        }
    }

    private texImageCube(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl } = webGLRenderer;

        const format = gl[data.format];
        const type = gl[data.type];

        const pixels: TexImageSource[] = data.activePixels as any;
        const faces = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (let i = 0; i < faces.length; i++)
        {
            gl.texImage2D(faces[i], 0, format, format, type, pixels[i]);
        }
    }

    private renderTexImage2D(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl } = webGLRenderer;

        const format = gl[data.format];
        const type = gl[data.type];

        gl.texImage2D(gl.TEXTURE_2D, 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
    }

    private texImage2D(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl } = webGLRenderer;

        const format = gl[data.format];
        const type = gl[data.type];
        const _pixel: TexImageSource = data.activePixels as any;

        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, _pixel);
    }

    /**
     * 清除纹理
     */
    private clear(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl, textures } = webGLRenderer;

        const tex = textures.get(data);
        if (tex)
        {
            gl.deleteTexture(tex.texture);
            textures.delete(data);
        }
    }
}
