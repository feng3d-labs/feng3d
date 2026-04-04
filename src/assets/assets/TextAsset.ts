import { AssetType } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { FileAsset, RegisterAsset } from '../FileAsset';

declare module '../FileAsset' { interface AssetMap { TextAsset: TextAsset; } }

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

