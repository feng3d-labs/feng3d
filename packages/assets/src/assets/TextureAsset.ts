import { AssetType } from 'feng3d';
import { AssetMeta } from '../AssetMeta';
import { FileAsset } from '../FileAsset';
import { Texture } from '@feng3d/webgpu';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass, gPartial } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';

/**
 * 带像素图像数据的纹理（Texture 上的 _pixels 为动态附加字段）。
 */
interface TextureWithPixels extends Texture
{
    _pixels?: HTMLImageElement;
}

/**
 * 纹理文件
 */
@decoratorRegisterClass()
export class TextureAsset extends FileAsset
{
    static extenson: '.jpg' | '.png' | '.jpeg' | '.gif' = '.png';

    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Texture;

    /**
     * 图片
     */
    get image() { return (this.data as TextureWithPixels)._pixels; }
    set image(v: HTMLImageElement)
    {
        (this.data as TextureWithPixels)._pixels = v;
        this.saveFile();
    }

    declare meta: TextureAssetMeta;

    assetType = AssetType.texture;

    initAsset()
    {
        this.data = this.data || ({} as Texture);
    }

    async saveFile()
    {
        await this.rs.fs.writeImage(this.assetPath, this.image);
    }

    /**
     * 读取文件
     */
    async readFile()
    {
        const img = await this.rs.fs.readImage(this.assetPath);
        (this.data as TextureWithPixels)._pixels = img;
    }

    /**
     * 读取元标签
     */
    protected async readMeta()
    {
        await super.readMeta();
        const result = await this.rs.deserializeWithAssets(this.meta.texture) as Texture;
        this.data = result;
    }

    /**
     * 写元标签
     */
    protected async writeMeta()
    {
        this.meta.texture = serialization.serialize(this.data);
        await super.writeMeta();
    }
}

export interface TextureAssetMeta extends AssetMeta
{
    texture: gPartial<Texture>;
}
