import { WebGLRenderer } from '../WebGLRenderer';
import { Texture } from '../data/Texture';
import { TextureMagFilter, TextureMinFilter, TextureWrap } from './WebGLEnums';
import { WebGLUniform } from './WebGLUniforms';

/**
 * WebGL纹理
 */
export class WebGLTextures
{
    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    /**
     * 此处用于缓存
     */
    private _texturesCache = new WeakMap<Texture, {
        texture: WebGLTexture,
        version: number,
        minFilter?: TextureMinFilter,
        magFilter?: TextureMagFilter,
        wrapS?: TextureWrap,
        wrapT?: TextureWrap,
        anisotropy?: number,
    }>();

    active(data: Texture, activeInfo?: WebGLUniform)
    {
        const { webGLContext } = this._webGLRenderer;

        if (activeInfo)
        {
            // 激活纹理编号
            webGLContext.activeTexture(activeInfo.textureID);
        }

        const texture = this.get(data);

        // 绑定纹理
        webGLContext.bindTexture(data.textureTarget, texture);

        this.setTextureParameters(data);

        if (activeInfo)
        {
            // 设置纹理所在采样编号
            webGLContext.uniform1i(activeInfo.location, activeInfo.textureID);
        }

        return texture;
    }

    private setTextureParameters(texture: Texture)
    {
        const { webGLContext, extensions, capabilities, isWebGL2 } = this._webGLRenderer;
        const { _texturesCache: textures } = this;

        const { textureTarget, type, minFilter, magFilter, wrapS, wrapT, anisotropy } = texture;

        const cache = textures.get(texture);

        // 设置纹理参数
        if (cache.minFilter !== minFilter)
        {
            webGLContext.texParameteri(textureTarget, 'TEXTURE_MIN_FILTER', minFilter);
            cache.minFilter = minFilter;
        }
        if (cache.magFilter !== magFilter)
        {
            webGLContext.texParameteri(textureTarget, 'TEXTURE_MAG_FILTER', magFilter);
            cache.magFilter = magFilter;
        }
        if (cache.wrapS !== wrapS)
        {
            webGLContext.texParameteri(textureTarget, 'TEXTURE_WRAP_S', wrapS);
            cache.wrapS = wrapS;
        }
        if (cache.wrapT !== wrapT)
        {
            webGLContext.texParameteri(textureTarget, 'TEXTURE_WRAP_T', wrapT);
            cache.wrapT = wrapT;
        }

        if (cache.anisotropy !== anisotropy)
        {
            const extension = extensions.getExtension('EXT_texture_filter_anisotropic');
            if (extension)
            {
                const ext1 = extensions.getExtension('OES_texture_float_linear');

                if (type === 'FLOAT' && !ext1) return; // verify extension for WebGL 1 and WebGL 2
                // verify extension for WebGL 1 only
                if (isWebGL2 === false && type === 'HALF_FLOAT')
                {
                    const ext2 = extensions.getExtension('OES_texture_half_float_linear');
                    if (!ext2)
                    {
                        return;
                    }
                }

                if (anisotropy > 1)
                {
                    webGLContext.texParameterf(textureTarget, 'TEXTURE_MAX_ANISOTROPY_EXT', Math.min(anisotropy, capabilities.maxAnisotropy));
                }
            }
            cache.anisotropy = anisotropy;
        }
    }

    /**
     * 获取顶点属性缓冲
     * @param data 数据
     */
    get(data: Texture)
    {
        const { webGLContext } = this._webGLRenderer;
        const { _texturesCache: textures } = this;

        let cache = textures.get(data);
        if (cache && data.version !== cache.version)
        {
            this.clear(data);
            cache = null;
        }
        if (!cache)
        {
            const texture = webGLContext.createTexture(); // Create a texture object

            // 设置图片y轴方向
            webGLContext.pixelStorei('UNPACK_FLIP_Y_WEBGL', data.flipY);
            webGLContext.pixelStorei('UNPACK_PREMULTIPLY_ALPHA_WEBGL', data.premulAlpha);
            // 绑定纹理
            webGLContext.bindTexture(data.textureTarget, texture);

            // 设置纹理图片
            data.setTextureData(this._webGLRenderer.webGLContext);

            if (data.generateMipmap)
            {
                webGLContext.generateMipmap(data.textureTarget);
            }

            cache = { texture, version: data.version };
            textures.set(data, cache);
        }

        return cache.texture;
    }

    /**
     * 清除纹理
     */
    private clear(data: Texture)
    {
        const { webGLContext } = this._webGLRenderer;
        const { _texturesCache: textures } = this;

        const tex = textures.get(data);
        if (tex)
        {
            webGLContext.deleteTexture(tex.texture);
            textures.delete(data);
        }
    }
}
