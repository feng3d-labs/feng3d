import { mathUtil } from '@feng3d/polyfill';
import { Vector2 } from '@feng3d/math';
import { TextureFormat, TextureMagFilter, TextureMinFilter } from '../renderer/gl/WebGLEnums';
import { watcher } from '@feng3d/watcher';
import { TextureCube } from './TextureCube';

/**
 * 渲染目标纹理
 */
export class RenderTargetTextureCube extends TextureCube
{
    width = 1024;

    height = 1024;

    format: TextureFormat = 'RGBA';

    minFilter: TextureMinFilter = 'NEAREST';

    magFilter: TextureMagFilter = 'NEAREST';

    /**
     * 是否为2的幂贴图
     */
    get isPowerOfTwo()
    {
        if (this.width === 0 || !mathUtil.isPowerOfTwo(this.width))
        {
            return false;
        }
        if (this.height === 0 || !mathUtil.isPowerOfTwo(this.height))
        {
            return false;
        }

        return true;
    }

    constructor()
    {
        super();
        watcher.watch(this as RenderTargetTextureCube, 'width', this.invalidate, this);
        watcher.watch(this as RenderTargetTextureCube, 'height', this.invalidate, this);
    }

    getSize()
    {
        return new Vector2(this.width, this.height);
    }
}
