import { loader } from '../filesystem/base/Loader';
import { RegisterTexture } from '../renderer/data/Texture';
import { watcher } from '../watcher/watcher';
import { imageDatas, Texture2D } from './Texture2D';

declare module './Texture2D'
{
    interface Texture2DMap { LoadImageTexture2D: LoadImageTexture2D }
}

@RegisterTexture('LoadImageTexture2D')
export class LoadImageTexture2D extends Texture2D
{
    declare __class__: 'LoadImageTexture2D';

    /**
     * 默认贴图
     */
    defaultSource = imageDatas.white;

    /**
     * 加载中贴图
     */
    loadingSource = imageDatas.white;

    /**
     * 图片路径。
     */
    url: string;

    /**
     * 是否正在加载。
     */
    isloading = false;

    constructor(url = '')
    {
        super();
        watcher.watch(this as LoadImageTexture2D, 'url', this._onUrlChanged, this);
        this.source = this.defaultSource;

        this.url = url;
    }

    private async _onUrlChanged()
    {
        const loadUrl = this.url;
        if (!loadUrl)
        {
            this.source = this.defaultSource;

            return;
        }

        this.source = this.loadingSource;
        this.isloading = true;

        const image = await loader.loadImage(this.url);
        if (loadUrl === this.url)
        {
            this.source = image;
            this.isloading = false;
        }
    }
}
