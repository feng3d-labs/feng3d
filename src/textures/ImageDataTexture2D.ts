import { watcher } from '../watcher/watcher';
import { SourceTexture2D } from './SourceTexture2D';

export class ImageDataTexture2D extends SourceTexture2D
{
    imageData: ImageData;

    constructor()
    {
        super();
        watcher.watch(this as ImageDataTexture2D, 'imageData', this._onImageDataChanged, this);
    }

    private _onImageDataChanged()
    {
        this.source = this.imageData;
    }
}
