import { Texture } from '../data/Texture';
import { WebGLRenderer } from '../WebGLRenderer';
import { TextureMagFilter, TextureMinFilter, TextureWrap } from './WebGLEnums';
import { UniformInfo } from './WebGLShaders';

/**
 * WebGL纹理
 */
export class WebGLTextures
{
    readonly webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this.webGLRenderer = webGLRenderer;
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

    active(data: Texture, activeInfo?: UniformInfo)
    {
        const { webGLRenderer } = this;
        const { gl } = webGLRenderer;

        if (activeInfo)
        {
            // 激活纹理编号
            gl.activeTexture(gl[`TEXTURE${activeInfo.textureID}`]);
        }

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
        const { gl, extensions, capabilities } = webGLRenderer;
        const { _texturesCache: textures } = this;

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
        const { gl } = webGLRenderer;
        const { _texturesCache: textures } = this;

        let cache = textures.get(data);
        if (cache && data.version !== cache.version)
        {
            this.clear(webGLRenderer, data);
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
            data.setTextureData(webGLRenderer);

            if (data.generateMipmap)
            {
                gl.generateMipmap(textureType);
            }

            cache = { texture, version: data.version };
            textures.set(data, cache);
        }

        return cache.texture;
    }

    /**
     * 清除纹理
     */
    private clear(webGLRenderer: WebGLRenderer, data: Texture)
    {
        const { gl } = webGLRenderer;
        const { _texturesCache: textures } = this;

        const tex = textures.get(data);
        if (tex)
        {
            gl.deleteTexture(tex.texture);
            textures.delete(data);
        }
    }
}
