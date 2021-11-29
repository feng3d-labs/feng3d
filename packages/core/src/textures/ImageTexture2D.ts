import { watch } from "@feng3d/watcher";
import { Texture2D } from "./Texture2D";

/**
 * 2D纹理
 */
export class ImageTexture2D extends Texture2D
{
    // __class__: "feng3d.ImageTexture2D" = "feng3d.ImageTexture2D";

    @watch("_imageChanged")
    get image(): HTMLImageElement
    {
        return this._pixels as any;
    }

    private _imageChanged()
    {
        this._pixels = this.image;
        this.invalidate();
    }
}
