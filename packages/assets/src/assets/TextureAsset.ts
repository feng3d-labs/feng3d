import { AssetMeta, AssetType, FileAsset, Texture2D } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { gPartial } from '@feng3d/polyfill';
import { decoratorRegisterClass, serialization } from '@feng3d/serialization';

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
        this.data = this.data || new Texture2D();
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
        this.meta.texture = serialization.serialize(this.data);
        await super.writeMeta();
    }
}

export interface TextureAssetMeta extends AssetMeta
{
    texture: gPartial<Texture2D>;
}
