import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

export class ImageDataTexture2D extends Texture2D
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
