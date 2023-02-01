import { mathUtil } from '../polyfill/MathUtil';
import { TextureFormat, TextureMagFilter, TextureMinFilter } from '../renderer/gl/WebGLEnums';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

/**
 * 渲染目标纹理
 */
export class RenderTargetTexture2D extends Texture2D
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
        watcher.watch(this as RenderTargetTexture2D, 'OFFSCREEN_WIDTH', this.invalidate, this);
        watcher.watch(this as RenderTargetTexture2D, 'OFFSCREEN_HEIGHT', this.invalidate, this);
    }

    /**
     * 纹理尺寸
     */
    getSize()
    {
        return { x: this.OFFSCREEN_WIDTH, y: this.OFFSCREEN_HEIGHT };
    }

    setTextureData(webGLRenderer: WebGLRenderer)
    {
        const { gl } = webGLRenderer;
        const data = this;

        const format = gl[data.format];
        const type = gl[data.type];

        gl.texImage2D(gl.TEXTURE_2D, 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
    }
}
