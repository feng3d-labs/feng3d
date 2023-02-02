import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { EventEmitter } from '../event/EventEmitter';
import { oav } from '../objectview/ObjectView';
import { RegisterTexture } from '../renderer/data/Texture';
import { TexImage2DTarget, TextureType } from '../renderer/gl/WebGLEnums';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { $set } from '../serialization/Serialization';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { watcher } from '../watcher/watcher';
import { imageDatas, ImageDatas, Texture2D } from './Texture2D';
import { TextureInfo } from './TextureInfo';

export interface TextureCubeEventMap
{
    /**
     * 加载完成
     */
    loadCompleted: any;
}

export type TextureCubeImageName = 'positive_x_url' | 'positive_y_url' | 'positive_z_url' | 'negative_x_url' | 'negative_y_url' | 'negative_z_url';

declare module '../renderer/data/Texture'
{
    interface TextureMap extends TextureCubeMap { }
}

export interface TextureCubeMap 
{
    TextureCube: TextureCube
}

/**
 * 立方体纹理
 */
@RegisterTexture('TextureCube')
export class TextureCube extends TextureInfo
{
    declare emitter: EventEmitter<TextureCubeEventMap>;

    textureType: TextureType = 'TEXTURE_CUBE_MAP';

    assetType = AssetType.texturecube;

    static ImageNames: TextureCubeImageName[] = ['positive_x_url', 'positive_y_url', 'positive_z_url', 'negative_x_url', 'negative_y_url', 'negative_z_url'];

    @oav({ component: 'OAVCubeMap', priority: 1 })
    OAVCubeMap = '';

    /**
     * 原始数据
     */
    @SerializeProperty()
    rawData: { type: 'texture', textures: Texture2D[] } | { type: 'path', paths: string[] };

    noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

    constructor()
    {
        super();
        watcher.watch(this as TextureCube, 'sources', this.invalidate, this);
    }

    static default: TextureCube;

    sources: TexImageSource[];

    setTextureData(webGLRenderer: WebGLRenderer)
    {
        const data = this;

        const sources = data.sources || [imageDatas.white, imageDatas.white, imageDatas.white, imageDatas.white, imageDatas.white, imageDatas.white];

        const faces: TexImage2DTarget[] = [
            'TEXTURE_CUBE_MAP_POSITIVE_X', 'TEXTURE_CUBE_MAP_POSITIVE_Y', 'TEXTURE_CUBE_MAP_POSITIVE_Z',
            'TEXTURE_CUBE_MAP_NEGATIVE_X', 'TEXTURE_CUBE_MAP_NEGATIVE_Y', 'TEXTURE_CUBE_MAP_NEGATIVE_Z'
        ];
        for (let i = 0; i < faces.length; i++)
        {
            webGLRenderer.webGLContext.texImage2D(faces[i], 0, data.format, data.format, data.type, sources[i]);
        }
    }
}

TextureCube.default = $set(new TextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('Default-TextureCube', TextureCube.default);
