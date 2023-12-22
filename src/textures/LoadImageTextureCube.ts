import { RegisterTexture } from '../renderer/data/Texture';
import { ImageUtil } from '../utils/ImageUtil';
import { watcher } from '@feng3d/watcher';
import { SourceTextureCube } from './SourceTextureCube';
import { TextureCube, TextureCubeSources } from './TextureCube';
import { loader } from '@feng3d/filesystem';

declare module './TextureCube'
{
    interface TextureCubeMap
    {
        LoadImageTextureCube: LoadImageTextureCube;
    }
}

@RegisterTexture('LoadImageTextureCube')
export class LoadImageTextureCube extends SourceTextureCube
{
    declare __class__: 'LoadImageTexture2D';

    /**
     * 默认贴图
     */
    defaultSources
        = {
            TEXTURE_CUBE_MAP_POSITIVE_X: ImageUtil.get('white'),
            TEXTURE_CUBE_MAP_POSITIVE_Y: ImageUtil.get('white'),
            TEXTURE_CUBE_MAP_POSITIVE_Z: ImageUtil.get('white'),
            TEXTURE_CUBE_MAP_NEGATIVE_X: ImageUtil.get('white'),
            TEXTURE_CUBE_MAP_NEGATIVE_Y: ImageUtil.get('white'),
            TEXTURE_CUBE_MAP_NEGATIVE_Z: ImageUtil.get('white'),
        };

    /**
     * 加载中贴图
     */
    loadingSources = {
        TEXTURE_CUBE_MAP_POSITIVE_X: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_POSITIVE_Y: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_POSITIVE_Z: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_NEGATIVE_X: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_NEGATIVE_Y: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_NEGATIVE_Z: ImageUtil.get('white'),
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
