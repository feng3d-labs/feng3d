import { watcher } from '@feng3d/watcher';
import { RenderbufferInternalformat } from './gl/WebGLEnums';

/**
 * 渲染缓冲。
 */
export class RenderBuffer
{
    /**
     * A GLsizei specifying the width of the renderbuffer in pixels.
     */
    width = 1024;

    /**
     * A GLsizei specifying the height of the renderbuffer in pixels.
     */
    height = 1024;

    /**
     * A GLenum specifying the internal format of the renderbuffer.
     */
    internalformat: RenderbufferInternalformat = 'DEPTH_COMPONENT16';

    /**
     * 版本号，用于判断参数是否变化。
     */
    version: number;

    constructor()
    {
        watcher.watchs(this as RenderBuffer, ['width', 'height', 'internalformat'], this._invalidate, this);
    }

    private _invalidate()
    {
        this.version = ~~this.version + 1;
    }
}
