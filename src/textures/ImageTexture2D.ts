import { watcher } from '../watcher/watcher';
import { SourceTexture2D } from './SourceTexture2D';

/**
 * 2D纹理
 */
export class ImageTexture2D extends SourceTexture2D
{
    declare __class__: 'ImageTexture2D';

    image: HTMLImageElement;

    constructor()
    {
        super();
        watcher.watch(this as ImageTexture2D, 'image', this._imageChanged, this);
    }

    private _imageChanged()
    {
        this.source = this.image;
    }
}
