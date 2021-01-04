import { watch } from "@feng3d/watcher";
import { Texture2D } from "./Texture2D";

export class ImageDataTexture2D extends Texture2D
{
    @watch("_imageDataChanged")
    imageData: ImageData;

    private _imageDataChanged()
    {
        this._pixels = this.imageData;
        this.invalidate();
    }
}
