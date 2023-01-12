import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

export class ImageDataTexture2D extends Texture2D
{
    imageData: ImageData;

    constructor()
    {
        super();
        watcher.watch(this as ImageDataTexture2D, 'imageData', this._imageDataChanged, this);
    }

    private _imageDataChanged()
    {
        this._pixels = this.imageData;
        this.invalidate();
    }
}
