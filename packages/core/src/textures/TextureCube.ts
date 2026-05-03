import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { TextureType } from '@feng3d/renderer';
import { serialization } from '@feng3d/serialization';
import { Texture, TextureImageSource } from '@feng3d/webgpu';
import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { TextureInfo } from '../render/data/TextureInfo';
import { ImageDatas } from './Texture2D';

export interface TextureCubeEventMap
{
    /**
     * 加载完成
     */
    loadCompleted: any;
}

export type TextureCubeImageName = 'positive_x_url' | 'positive_y_url' | 'positive_z_url' | 'negative_x_url' | 'negative_y_url' | 'negative_z_url';

/**
 * 立方体纹理
 */
@decoratorRegisterClass()
export class TextureCube<T extends TextureCubeEventMap = TextureCubeEventMap> extends TextureInfo<T>
{
    __class__: 'TextureCube';

    texture = defaultCubeTexture;

    get urls()
    {
        return this._urls;
    }
    set urls(v)
    {
        this._urls = v;
        console.assert(v.length === 6, 'TextureCube urls length must be 6');
        console.assert(v.every(url => typeof url === 'string'), 'TextureCube urls must be string array');

        this.updateTexture();

        this.invalidate();
    }
    private _urls: [string, string, string, string, string, string];

    private async updateTexture()
    {
        this.texture = await TextureCube.loadTexture(this._urls);
    }


    textureType = TextureType.TEXTURE_CUBE_MAP;

    assetType = AssetType.texturecube;

    static ImageNames: TextureCubeImageName[] = ['positive_x_url', 'positive_y_url', 'positive_z_url', 'negative_x_url', 'negative_y_url', 'negative_z_url'];

    @oav({ component: 'OAVCubeMap', priority: 1 })
    OAVCubeMap = '';

    noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

    protected _pixels = [null, null, null, null, null, null];

    /**
     * 是否加载完成
     */
    get isLoaded() { return this._loading.length === 0; }
    private _loading = [];

    constructor()
    {
        super();
    }


    static default: TextureCube;

    static async loadTexture(imgSrcs: string[])
    {
        const imageBitmaps = await TextureCube.loadCubeMap(imgSrcs);
        const textureSource = imageBitmaps.map((v, i) =>
        {
            const item: TextureImageSource = {
                image: v, textureOrigin: [0, 0, i],
            };

            return item;
        });
        return {
            descriptor: {
                size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
                dimension: 'cube',
                format: 'rgba8unorm',
            },
            sources: textureSource,
        } as Texture;
    }

    static async loadCubeMap(imgSrcs: string[])
    {
        const promises = imgSrcs.map(async (src) =>
        {
            const response = await fetch(src);
            const blob = await response.blob();
            return createImageBitmap(blob);
        });
        const imageBitmaps = await Promise.all(promises);
        return imageBitmaps;
    }
}

TextureCube.default = serialization.setValue(new TextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('Default-TextureCube', TextureCube.default);

const defaultCubeTexture: Texture = {
    descriptor: {
        size: [1, 1, 6],
        dimension: 'cube',
        format: 'rgba8unorm',
    },
    sources: [0, 1, 2, 3, 4, 5].map((v, i) =>
    {
        const item: TextureImageSource = {
            image: new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1),
            textureOrigin: [0, 0, i],
        };

        return item;
    }),
};