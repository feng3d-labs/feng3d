import { ov } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { AssetType } from './AssetType';
import { FileAsset, setAssetTypeClass } from './FileAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetTypeClassMap
    {
        'folder': new () => FolderAsset;
    }
}

/**
 * 文件夹资源
 */
@ov({ component: 'OVFolderAsset' })
@Serializable('FolderAsset')
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

setAssetTypeClass('folder', FolderAsset);
