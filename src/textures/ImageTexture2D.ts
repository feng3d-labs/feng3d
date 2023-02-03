import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

/**
 * 2D纹理
 */
export class ImageTexture2D extends Texture2D
{
    declare __class__: 'ImageTexture2D';

    imageSource: HTMLImageElement;

    constructor()
    {
        super();
        watcher.watch(this as ImageTexture2D, 'imageSource', this._imageChanged, this);
    }

    private _imageChanged()
    {
        this.source = this.imageSource;
    }
}
