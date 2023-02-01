import { mathUtil } from '../polyfill/MathUtil';
import { TextureFormat, TextureMagFilter, TextureMinFilter } from '../renderer/gl/WebGLEnums';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { watcher } from '../watcher/watcher';
import { TextureCube } from './TextureCube';

/**
 * 渲染目标纹理
 */
export class RenderTargetTextureCube extends TextureCube
{
    OFFSCREEN_WIDTH = 1024;

    OFFSCREEN_HEIGHT = 1024;

    format: TextureFormat = 'RGBA';

    minFilter: TextureMinFilter = 'NEAREST';

    magFilter: TextureMagFilter = 'NEAREST';

    /**
     * 是否为2的幂贴图
     */
    get isPowerOfTwo()
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

    constructor()
    {
        super();
        watcher.watch(this as RenderTargetTextureCube, 'OFFSCREEN_WIDTH', this.invalidate, this);
        watcher.watch(this as RenderTargetTextureCube, 'OFFSCREEN_HEIGHT', this.invalidate, this);
    }

    setTextureData(webGLRenderer: WebGLRenderer)
    {
        const { gl } = webGLRenderer;
        const data = this;

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
}
