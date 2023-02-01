import { Texture } from '../data/Texture';
import { TextureMagFilter, TextureMinFilter, TextureWrap } from './WebGLEnums';

/**
 * WebGL纹理
 */
export class WebGLTextures
{
    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    textures = new WeakMap<Texture, {
        texture: WebGLTexture,
        minFilter?: TextureMinFilter,
        magFilter?: TextureMagFilter,
        wrapS?: TextureWrap,
        wrapT?: TextureWrap,
        anisotropy?: number,
    }>();
}
