import { AssetType } from 'feng3d';
import { FileAsset, setAssetTypeClass } from '../FileAsset';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';

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
@decoratorRegisterClass()
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

        this.textContent = data;
    }
}

setAssetTypeClass('txt', TextAsset);
