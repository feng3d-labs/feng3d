import { AssetType } from "../../core/assets/AssetType";
import { FileAsset, setAssetTypeClass } from "../../core/assets/FileAsset";
import { oav } from "../../objectview/ObjectView";
import { serializable } from "../../serialization/ClassUtils";

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'txt': new () => TextAsset;
    }
}

/**
 * 文本 资源
 */
@serializable()
export class TextAsset extends FileAsset
{
    static extenson = '.txt';

    assetType = AssetType.txt;

    @oav({ component: 'OAVMultiText' })
    textContent: string;

    initAsset()
    {
        this.textContent = this.textContent || '';
    }

    async saveFile()
    {
        await this.rs.fs.writeString(this.assetPath, this.textContent);
    }

    /**
     * 读取文件
     */
    async readFile()
    {
        const data = await this.rs.fs.readString(this.assetPath);

        this.textContent = data as any;
    }
}

setAssetTypeClass('txt', TextAsset);
