import { TextureFormat, TextureMinFilter, TextureMagFilter } from '../renderer/gl/WebGLEnums';
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

    isRenderTarget = true;

    constructor()
    {
        super();
        watcher.watch(this as RenderTargetTexture2D, 'OFFSCREEN_WIDTH', this.invalidate, this);
        watcher.watch(this as RenderTargetTexture2D, 'OFFSCREEN_HEIGHT', this.invalidate, this);
    }
}
