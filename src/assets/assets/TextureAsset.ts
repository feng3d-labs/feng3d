import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { $serialize } from '../../serialization/Serialization';
import { LoadImageTexture2D } from '../../textures/LoadImageTexture2D';
import { Texture2D } from '../../textures/Texture2D';
import { AssetMeta } from '../AssetMeta';
import { AssetType } from '../AssetType';
import { FileAsset, RegisterAsset } from '../FileAsset';

declare module '../FileAsset' { interface AssetMap { TextureAsset: TextureAsset; } }

/**
 * 纹理文件
 */
@RegisterAsset('TextureAsset')
export class TextureAsset extends FileAsset
{
    static extenson: '.jpg' | '.png' | '.jpeg' | '.gif' = '.png';

    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Texture2D;

    /**
     * 图片
     */
    get image() { return this.data['_pixels'] as any; }
    set image(v: HTMLImageElement)
    {
        this.data['_pixels'] = v;
        this.saveFile();
    }

    declare meta: TextureAssetMeta;

    assetType = AssetType.texture;

    initAsset()
    {
        this.data = this.data || new LoadImageTexture2D();
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
        this.data['_pixels'] = img;
    }

    /**
     * 读取元标签
     */
    protected async readMeta()
    {
        await super.readMeta();
        const result: any = await this.rs.deserializeWithAssets(this.meta.texture);
        this.data = result;
    }

    /**
     * 写元标签
     */
    protected async writeMeta()
    {
        this.meta.texture = $serialize(this.data);
        await super.writeMeta();
    }
}

export interface TextureAssetMeta extends AssetMeta
{
    texture: gPartial<Texture2D>;
}
