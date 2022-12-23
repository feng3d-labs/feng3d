import { path } from '@feng3d/path';
import { anyEmitter } from '../../event/AnyEmitter';
import { pathUtils } from '../../filesystem/PathUtils';
import { serialize } from '../../serialization/serialize';
import { ticker } from '../utils/Ticker';
import { AssetMeta } from './AssetMeta';
import { AssetType } from './AssetType';
import { FolderAsset } from './FolderAsset';
import { ReadWriteRS } from './rs/ReadWriteRS';

declare global
{
    interface MixinsAssetTypeClassMap
    {

    }
}

export function getAssetTypeClass<K extends keyof AssetTypeClassMap>(type: K)
{
    return assetTypeClassMap[type];
}

export function setAssetTypeClass<K extends keyof AssetTypeClassMap>(type: K, cls: AssetTypeClassMap[K])
{
    assetTypeClassMap[type] = cls;
}

export interface AssetTypeClassMap extends MixinsAssetTypeClassMap
{
}

export const assetTypeClassMap: AssetTypeClassMap = <any>{};

/**
 * feng3d资源
 */
export abstract class FileAsset
{
    /**
     * 资源路径
     */
    @serialize
    assetPath: string;

    /**
     * 资源编号
     */
    @serialize
    assetId: string;

    /**
     * 资源元标签，该对象也用来判断资源是否被加载，值为null表示未加载，否则已加载。
     *
     * 并且该对象还会用于存储主文件无法存储的数据，比如 TextureAsset 中存储了 Texture2D 信息
     */
    meta: AssetMeta;

    /**
     * 资源系统
     *
     * 加载或者创建该资源的资源系统
     */
    rs: ReadWriteRS;

    /**
     * 资源类型，由具体对象类型决定
     */
    assetType: AssetType;

    /**
     * 是否已加载
     */
    isLoaded = false;

    /**
     * 是否正在加载中
     */
    isLoading = false;

    /**
     * 文件后缀
     */
    get extenson()
    {
        console.assert(!!this.assetPath);
        const ext = path.extname(this.assetPath);

        return ext;
    }

    /**
     * 父资源
     */
    get parentAsset()
    {
        const dir = path.dirname(this.assetPath);
        const parent = this.rs.getAssetByPath(dir) as FolderAsset;

        return parent;
    }

    /**
     * 文件名称
     *
     * 不包含后缀
     */
    get fileName()
    {
        console.assert(!!this.assetPath);
        const fn = pathUtils.nameWithOutExt(this.assetPath);

        return fn;
    }

    /**
     * 资源对象
     */
    data: any;

    /**
     * 初始化资源
     */
    initAsset()
    {
    }

    /**
     * 获取资源数据
     */
    async getAssetData()
    {
        if (!this.isLoaded)
        {
            await this.read();
        }
        const assetData = this._getAssetData();

        return assetData;
    }

    /**
     * 资源已加载时获取资源数据，内部使用
     */
    protected _getAssetData()
    {
        return this.data;
    }

    /**
     * 读取资源
     */
    async read()
    {
        if (this.isLoaded)
        {
            return;
        }
        const eventtype = 'loaded';
        if (this.isLoading)
        {
            await new Promise((resolve) =>
            {
                anyEmitter.once(this, eventtype, () =>
                {
                    this.isLoaded = true;
                    this.isLoading = false;
                    resolve(undefined);
                });
            });

            return;
        }
        this.isLoading = true;

        await this.readMeta();
        await this.readFile();
        anyEmitter.emit(this, eventtype);
    }

    /**
     * 写入资源
     */
    async write()
    {
        this.meta.mtimeMs = Date.now();
        await this.writeMeta();
        await this.saveFile();
    }

    /**
     * 删除资源
     */
    async delete()
    {
        // 删除 meta 文件
        await this.deleteMeta();
        await this.deleteFile();
        // 删除映射
        // ReadRS.rs.deleteAssetById(this.assetId);
        this.rs.deleteAssetById(this.assetId);
    }

    /**
     * 读取资源预览图标
     */
    async readPreview()
    {
        if (this._preview)
        {
            return this._preview;
        }
        const image = await this.rs.fs.readImage(this.previewPath);
        this._preview = image;

        return image;
    }

    /**
     * 读取资源预览图标
     *
     * @param image 预览图
     */
    async writePreview(image: HTMLImageElement)
    {
        if (this._preview === image)
        {
            return;
        }
        this._preview = image;
        await this.rs.fs.writeImage(this.previewPath, image);
    }

    /**
     * 删除资源预览图标
     */
    async deletePreview()
    {
        await this.rs.fs.deleteFile(this.previewPath);
    }

    /**
     * 读取文件
     */
    abstract readFile(): Promise<void>;

    /**
     * 保存文件
     */
    abstract saveFile(): Promise<void>;

    /**
     * 删除文件
     */
    protected async deleteFile()
    {
        await this.rs.fs.deleteFile(this.assetPath);

        // 延迟一帧判断该资源是否被删除，排除移动文件时出现的临时删除情况
        ticker.once(1000, () =>
        {
            if (!this.rs.getAssetById(this.assetId))
            {
                this.deletePreview();
            }
        });
    }

    /**
     * 元标签路径
     */
    protected get metaPath()
    {
        return `${this.assetPath}.meta`;
    }

    /**
     * 读取元标签
     */
    protected async readMeta()
    {
        const meta: AssetMeta = await this.rs.fs.readObject(this.metaPath);
        this.meta = meta;
    }

    /**
     * 写元标签
     */
    protected async writeMeta()
    {
        await this.rs.fs.writeObject(this.metaPath, this.meta);
    }

    /**
     * 删除元标签
     */
    protected async deleteMeta()
    {
        await this.rs.fs.deleteFile(this.metaPath);
    }

    /**
     * 预览图
     */
    private _preview: HTMLImageElement;

    /**
     * 预览图路径
     */
    private get previewPath()
    {
        return `previews/${this.assetId}.png`;
    }
}

