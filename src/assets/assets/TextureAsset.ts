import { AssetMeta } from "../../core/assets/AssetMeta";
import { AssetType } from "../../core/assets/AssetType";
import { FileAsset } from "../../core/assets/FileAsset";
import { Texture2D } from "../../core/textures/Texture2D";
import { oav } from "../../objectview/ObjectView";
import { gPartial } from "../../polyfill/Types";
import { serializable } from "../../serialization/ClassUtils";
import { serialization } from "../../serialization/Serialization";

/**
 * 纹理文件
 */
@serializable()
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
