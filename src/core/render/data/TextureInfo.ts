import { dataTransform } from '../../../polyfill/DataTransform';
import { Texture } from '../../../renderer/data/Texture';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { HideFlags } from '../../core/HideFlags';
import { imageDatas } from '../../textures/Texture2D';

/**
 * 纹理信息
 */
export abstract class TextureInfo<T> extends Texture<T>
{
    name: string;

    /**
     * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
     */
    @SerializeProperty
    hideFlags = HideFlags.None;

    /**
     * 纹理尺寸
     */
    getSize()
    {
        if (this.isRenderTarget)
        {
            return { x: this.OFFSCREEN_WIDTH, y: this.OFFSCREEN_HEIGHT };
        }
        let pixels = this.activePixels;
        if (!pixels)
        {
            return { x: 1, y: 1 };
        }
        if (!Array.isArray(pixels))
        {
            pixels = [pixels];
        }
        if (pixels.length === 0)
        {
            return { x: 1, y: 1 };
        }
        const pixel = pixels[0];

        return { x: pixel.width, y: pixel.height };
    }

    /**
     *
     */
    get dataURL()
    {
        this.updateActivePixels();
        if (!this._dataURL)
        {
            if (this._activePixels instanceof ImageData)
            {
                this._dataURL = dataTransform.imageDataToDataURL(this._activePixels);
            }
            else if (this._activePixels instanceof HTMLImageElement)
            {
                this._dataURL = dataTransform.imageToDataURL(this._activePixels);
            }
            else if (this._activePixels instanceof HTMLCanvasElement)
            {
                this._dataURL = dataTransform.canvasToDataURL(this._activePixels);
            }
        }

        return this._dataURL;
    }
    protected _dataURL: string;

    protected updateActivePixels()
    {
        const old = this._activePixels;
        if (this.checkRenderData(this._pixels))
        {
            this._activePixels = this._pixels;
        }
        else if (Array.isArray(this.noPixels))
        {
            this._activePixels = this.noPixels.map((v) => imageDatas[v]);
        }
        else
        {
            this._activePixels = imageDatas[this.noPixels];
        }
        if (old !== this._activePixels) this._dataURL = null;
    }

    /**
     * 判断数据是否满足渲染需求
     */
    private checkRenderData(pixels: TexImageSource | TexImageSource[])
    {
        if (!pixels) return false;
        if (!Array.isArray(pixels))
        {
            pixels = [pixels];
        }

        if (pixels.length === 0) return false;
        for (let i = 0; i < pixels.length; i++)
        {
            const element = pixels[i];
            if (!element) return false;
            if (element.width === 0)
            {
                return false;
            }
            if (element.height === 0)
            {
                return false;
            }
        }

        return true;
    }
}
