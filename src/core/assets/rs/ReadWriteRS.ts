import { ReadWriteFS } from '../../../filesystem/ReadWriteFS';
import { gPartial } from '../../../polyfill/Types';
import { $serialize, serialization } from '../../../serialization/Serialization';
import { AssetData } from '../../core/AssetData';
import { ticker } from '../../utils/Ticker';
import { FileAsset } from '../FileAsset';
import { FolderAsset } from '../FolderAsset';
import { ReadRS } from './ReadRS';

export interface ReadWriteRS
{
    get fs(): ReadWriteFS;
}

/**
 * 可读写资源系统
 */
export class ReadWriteRS extends ReadRS
{
    /**
     * 延迟保存执行函数
     */
    private laterSaveFunc = (_interval: number) => { this.save(); };
    /**
     * 延迟保存，避免多次操作时频繁调用保存
     */
    private laterSave = () => { ticker.nextFrame(this.laterSaveFunc, this); };

    /**
     * 构建可读写资源系统
     *
     * @param fs 可读写文件系统
     */
    constructor(fs?: ReadWriteFS)
    {
        super(fs);
    }

    /**
     * 在更改资源结构（新增，移动，删除）时会自动保存
     */
    private async save()
    {
        const allAssets = this.getAllAssets();
        const object = $serialize(allAssets);
        await this.fs.writeObject(this.resources, object);
    }

    /**
     * 新建资源
     *
     * @param cls 资源类定义
     * @param fileName 文件名称
     * @param value 初始数据
     * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
     */
    async createAsset<T extends FileAsset>(cls: new () => T, fileName?: string, value?: gPartial<T>, parent?: FolderAsset)
    {
        // 新建资源
        const asset = await super.createAsset(cls, fileName, value, parent);
        // 保存资源
        await this.writeAsset(asset);

        // 保存资源库
        this.laterSave();

        return asset;
    }

    /**
     * 写（保存）资源
     *
     * @param asset 资源对象
     */
    async writeAsset(asset: FileAsset)
    {
        await asset.write();
    }

    /**
     * 移动资源到指定文件夹
     *
     * @param asset 被移动资源
     * @param folder 目标文件夹
     */
    async moveAsset(asset: FileAsset, folder: FolderAsset)
    {
        const filename = asset.fileName + asset.extenson;

        const cnames = folder.childrenAssets.map((v) => v.fileName + v.extenson);
        if (cnames.indexOf(filename) !== -1)
        {
            console.warn(new Error(`目标文件夹中存在同名文件（夹），无法移动`));

            return;
        }
        let fp = folder;
        while (fp)
        {
            if (fp === <any>asset)
            {
                console.warn(new Error(`无法移动达到子文件夹中`));

                return;
            }
            fp = fp.parentAsset;
        }

        // 获取需要移动的资源列表
        let assets = [asset];
        let index = 0;
        while (index < assets.length)
        {
            const ca = assets[index];
            if (ca instanceof FolderAsset)
            {
                assets = assets.concat(ca.childrenAssets);
            }
            index++;
        }

        // 最后根据 parentAsset 修复 childrenAssets
        // const copyassets = assets.concat();

        for (let i = 0; i < assets.length; i++)
        {
            const la = assets[i];
            // 读取资源
            await this.readAsset(la.assetId);
            // 从原路径上删除资源
            await this.deleteAsset(la);
            // 计算资源新路径
            let np = la.fileName + la.extenson;
            let p = la.parentAsset;
            while (p)
            {
                np = `${p.fileName}/${np}`;
                p = p.parentAsset;
            }
            la.assetPath = np;
            // 新增映射
            this.addAsset(la);
            // 保存资源到新路径
            await this.writeAsset(la);
        }
        // 保存资源库
        this.laterSave();
    }

    /**
     * 删除资源
     *
     * @param asset 资源
     */
    async deleteAsset(asset: FileAsset)
    {
        // 获取需要移动的资源列表
        let assets = [asset];
        let index = 0;
        while (index < assets.length)
        {
            const ca = assets[index];
            if (ca instanceof FolderAsset)
            {
                assets = assets.concat(ca.childrenAssets);
            }
            index++;
        }

        for (let i = 0; i < assets.length; i++)
        {
            const la = assets[i];
            await la.delete();
            AssetData.deleteAssetData(la.data);
        }
        // 保存资源库
        this.laterSave();
    }
}
