import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { oav } from '../objectview/ObjectView';
import { RegisterTexture } from '../renderer/data/Texture';
import { TexImage2DTarget, TextureType } from '../renderer/gl/WebGLEnums';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { $set } from '../serialization/Serialization';
import { watcher } from '../watcher/watcher';
import { imageDatas } from './Texture2D';
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
 * 立方体纹理贴图
 */
export type TextureCubeSources = {
    TEXTURE_CUBE_MAP_POSITIVE_X: TexImageSource,
    TEXTURE_CUBE_MAP_POSITIVE_Y: TexImageSource,
    TEXTURE_CUBE_MAP_POSITIVE_Z: TexImageSource,
    TEXTURE_CUBE_MAP_NEGATIVE_X: TexImageSource,
    TEXTURE_CUBE_MAP_NEGATIVE_Y: TexImageSource,
    TEXTURE_CUBE_MAP_NEGATIVE_Z: TexImageSource,
};

/**
 * 立方体纹理
 */
@RegisterTexture('TextureCube')
export class TextureCube extends TextureInfo
{
    textureType: TextureType = 'TEXTURE_CUBE_MAP';

    /**
     * 立方体六个面。
     */
    static faces: TexImage2DTarget[] = [
        'TEXTURE_CUBE_MAP_POSITIVE_X', 'TEXTURE_CUBE_MAP_POSITIVE_Y', 'TEXTURE_CUBE_MAP_POSITIVE_Z',
        'TEXTURE_CUBE_MAP_NEGATIVE_X', 'TEXTURE_CUBE_MAP_NEGATIVE_Y', 'TEXTURE_CUBE_MAP_NEGATIVE_Z'
    ];

    @oav({ component: 'OAVCubeMap', priority: 1 })
    OAVCubeMap = '';

    constructor()
    {
        super();
        watcher.watch(this as TextureCube, 'sources', this.invalidate, this);
    }

    static default: TextureCube;

    sources: TextureCubeSources;

    setTextureData(webGLRenderer: WebGLRenderer)
    {
        const data = this;

        const sources = data.sources || {
            TEXTURE_CUBE_MAP_POSITIVE_X: imageDatas.white,
            TEXTURE_CUBE_MAP_POSITIVE_Y: imageDatas.white,
            TEXTURE_CUBE_MAP_POSITIVE_Z: imageDatas.white,
            TEXTURE_CUBE_MAP_NEGATIVE_X: imageDatas.white,
            TEXTURE_CUBE_MAP_NEGATIVE_Y: imageDatas.white,
            TEXTURE_CUBE_MAP_NEGATIVE_Z: imageDatas.white,
        };

        TextureCube.faces.forEach((face) =>
        {
            webGLRenderer.webGLContext.texImage2D(face, 0, data.format, data.format, data.type, sources[face]);
        });
    }
}

TextureCube.default = $set(new TextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('Default-TextureCube', TextureCube.default);
