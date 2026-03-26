import { loader } from '@feng3d/filesystem';
import { ImageUtil, RegisterTexture } from '@feng3d/renderer';
import { watcher } from '@feng3d/watcher';
import { SourceTexture2D } from './SourceTexture2D';

declare module '@feng3d/renderer'
{
    interface Texture2DMap { LoadImageTexture2D: LoadImageTexture2D }
}

@RegisterTexture('LoadImageTexture2D')
export class LoadImageTexture2D extends SourceTexture2D
{
    declare __class__: 'LoadImageTexture2D';

    /**
     * 默认贴图
     */
    defaultSource = ImageUtil.get('white');

    /**
     * 加载中贴图
     */
    loadingSource = ImageUtil.get('white');

    /**
     * 图片路径。
     */
    url: string;

    /**
     * 是否正在加载。
     */
    isloading = false;

    constructor()
    {
        super();
        watcher.watch(this as LoadImageTexture2D, 'url', this._onUrlChanged, this);
        this.source = this.defaultSource;
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
