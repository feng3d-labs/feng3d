import { ov } from '../objectview/ObjectView';
import { AssetType } from './AssetType';
import { FileAsset, RegisterAsset } from './FileAsset';

declare module './FileAsset'
{
    interface AssetMap
    {
        FolderAsset: FolderAsset;
    }
}

/**
 * 文件夹资源
 */
@ov({ component: 'OVFolderAsset' })
@RegisterAsset('FolderAsset')
export class FolderAsset extends FileAsset
{
    static extenson = '';

    assetType = AssetType.folder;

    /**
     * 子资源列表
     */
    get childrenAssets()
    {
        const children = this.rs.getChildrenAssetByPath(this.assetPath);

        return children;
    }

    initAsset()
    {
    }

    /**
     * 删除资源
     */
    async delete()
    {
        await super.delete();
    }

    /**
     * 保存文件
     */
    async saveFile()
    {
        await this.rs.fs.mkdir(this.assetPath);
    }

    /**
     * 读取文件
     */
    async readFile()
    {
    }
}
