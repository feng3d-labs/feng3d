import { AssetType } from '../../core/assets/AssetType';
import { FileAsset, RegisterAsset } from '../../core/assets/FileAsset';
import { oav } from '../../objectview/ObjectView';

declare module '../../core/assets/FileAsset'
{
    interface AssetTypeClassMap
    {
        TextAsset: TextAsset;
    }
}

/**
 * 文本 资源
 */
@RegisterAsset('TextAsset')
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

