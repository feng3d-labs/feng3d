import { loader } from '../filesystem/base/Loader';
import { RegisterTexture } from '../renderer/data/Texture';
import { watcher } from '../watcher/watcher';
import { imageDatas } from './Texture2D';
import { TextureCube, TextureCubeSources } from './TextureCube';

declare module './TextureCube'
{
    interface TextureCubeMap
    {
        LoadImageTextureCube: LoadImageTextureCube;
    }
}

@RegisterTexture('LoadImageTextureCube')
export class LoadImageTextureCube extends TextureCube
{
    declare __class__: 'LoadImageTexture2D';

    /**
     * 默认贴图
     */
    defaultSources
        = {
            TEXTURE_CUBE_MAP_POSITIVE_X: imageDatas.white,
            TEXTURE_CUBE_MAP_POSITIVE_Y: imageDatas.white,
            TEXTURE_CUBE_MAP_POSITIVE_Z: imageDatas.white,
            TEXTURE_CUBE_MAP_NEGATIVE_X: imageDatas.white,
            TEXTURE_CUBE_MAP_NEGATIVE_Y: imageDatas.white,
            TEXTURE_CUBE_MAP_NEGATIVE_Z: imageDatas.white,
        };

    /**
     * 加载中贴图
     */
    loadingSources = {
        TEXTURE_CUBE_MAP_POSITIVE_X: imageDatas.white,
        TEXTURE_CUBE_MAP_POSITIVE_Y: imageDatas.white,
        TEXTURE_CUBE_MAP_POSITIVE_Z: imageDatas.white,
        TEXTURE_CUBE_MAP_NEGATIVE_X: imageDatas.white,
        TEXTURE_CUBE_MAP_NEGATIVE_Y: imageDatas.white,
        TEXTURE_CUBE_MAP_NEGATIVE_Z: imageDatas.white,
    };

    /**
     * 图片路径。
     */
    urls: TextureCubeSources;

    /**
     * 是否正在加载。
     */
    isloading = false;

    constructor()
    {
        super();
        watcher.watch(this as LoadImageTextureCube, 'urls', this._onUrlsChanged, this);
        this.sources = this.defaultSources;
    }

    private async _onUrlsChanged()
    {
        const loadUrls = this.urls;
        if (!loadUrls)
        {
            this.sources = this.defaultSources;

return;
        }

        this.sources = this.loadingSources;
        this.isloading = true;

        const imagePs = TextureCube.faces.map((face) => loader.loadImage(loadUrls[face]));
        const images = await Promise.all(imagePs);

        const sources = TextureCube.faces.reduce((pv, face, i) =>
        {
            pv[face] = images[i];

            return pv;
        }, {} as TextureCubeSources);

        if (this.urls === loadUrls)
        {
            this.sources = sources;
        }
    }
}
