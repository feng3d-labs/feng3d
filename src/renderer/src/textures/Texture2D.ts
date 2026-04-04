import { Vector2 } from '@feng3d/math';
import { watcher } from '@feng3d/watcher';
import { Texture } from '../data/Texture';
import { TextureTarget } from '../gl/WebGLEnums';
import { WebGLContext } from '../WebGLContext';

declare module '../data/Texture'
{
    interface TextureMap extends Texture2DMap { }
}

export interface Texture2DMap
{
    Texture2D: Texture2D;
}

export type Texture2DLike = Texture2DMap[keyof Texture2DMap];

declare module '../data/Uniforms'
{
    interface UniformTypeMap
    {
        texture2D: Texture2D;
        texture2DArray: Texture2D[];
    }
}

/**
 * 2D纹理
 */
export class Texture2D extends Texture
{
    textureTarget: TextureTarget = 'TEXTURE_2D';

    /**
     * One of the following objects can be used as a pixel source for the texture.
     */
    source: TexImageSource;

    constructor()
    {
        super();
        watcher.watch(this as Texture2D, 'source', this.invalidate, this);
    }

    setTextureData(webGLContext: WebGLContext)
    {
        webGLContext.texImage2D('TEXTURE_2D', 0, this.format, this.format, this.type, this.source);
    }

    getSize()
    {
        return new Vector2(this.source?.['width'] || 0, this.source?.['height'] || 0);
    }
}

