import { Texture } from '../data/Texture';
import { WebGLCapabilities } from './WebGLCapabilities';
import { TextureMagFilter, TextureMinFilter, TextureWrap } from './WebGLEnums';
import { WebGLExtensions } from './WebGLExtensions';
import { UniformInfo } from './WebGLShaders';

/**
 * WebGL纹理
 */
export class WebGLTextures
{
    gl: WebGLRenderingContext;
    extensions: WebGLExtensions;
    capabilities: WebGLCapabilities;

    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private textures = new WeakMap<Texture, {
        texture: WebGLTexture,
        minFilter?: TextureMinFilter,
        magFilter?: TextureMagFilter,
        wrapS?: TextureWrap,
        wrapT?: TextureWrap,
        anisotropy?: number,
    }>();

    constructor(gl: WebGLRenderingContext, extensions: WebGLExtensions, capabilities: WebGLCapabilities)
    {
        this.gl = gl;
        this.extensions = extensions;
        this.capabilities = capabilities;
    }

    active(data: Texture, activeInfo?: UniformInfo)
    {
        const { gl } = this;

        if (activeInfo)
        {
            // 激活纹理编号
            gl.activeTexture(gl[`TEXTURE${activeInfo.textureID}`]);
        }

        const texture = this.getTexture(data);

        const textureType = gl[data.textureType];

        // 绑定纹理
        gl.bindTexture(textureType, texture);

        this.setTextureParameters(data);

        if (activeInfo)
        {
            // 设置纹理所在采样编号
            gl.uniform1i(activeInfo.location, activeInfo.textureID);
        }

        return texture;
    }

    private setTextureParameters(texture: Texture)
    {
        const { gl, extensions, capabilities, textures } = this;

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
    private getTexture(data: Texture)
    {
        const { gl, textures } = this;

        if (data.invalid)
        {
            this.clear(data);
            data.invalid = false;
        }
        let cache = textures.get(data);
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
            const format = gl[data.format];
            const type = gl[data.type];

            // 设置图片y轴方向
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, data.flipY ? 1 : 0);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, data.premulAlpha ? 1 : 0);
            // 绑定纹理
            gl.bindTexture(textureType, texture);
            // 设置纹理图片
            switch (textureType)
            {
                case gl.TEXTURE_CUBE_MAP:
                    const pixels: TexImageSource[] = data.activePixels as any;
                    const faces = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];
                    for (let i = 0; i < faces.length; i++)
                    {
                        if (data.isRenderTarget)
                        {
                            gl.texImage2D(faces[i], 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
                        }
                        else
                        {
                            gl.texImage2D(faces[i], 0, format, format, type, pixels[i]);
                        }
                    }
                    break;
                case gl.TEXTURE_2D:
                    const _pixel: TexImageSource = data.activePixels as any;
                    if (data.isRenderTarget)
                    {
                        gl.texImage2D(textureType, 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
                    }
                    else
                    {
                        gl.texImage2D(textureType, 0, format, format, type, _pixel);
                    }
                    break;
                default:
                    throw '';
            }
            if (data.generateMipmap)
            {
                gl.generateMipmap(textureType);
            }

            cache = { texture };
            textures.set(data, cache);
        }

        return cache.texture;
    }

    /**
     * 清除纹理
     *
     * @param data
     */
    private clear(data: Texture)
    {
        const { gl, textures } = this;

        const tex = textures.get(data);
        if (tex)
        {
            gl.deleteTexture(tex.texture);
            textures.delete(data);
        }
    }
}
