import { path as fengpath } from '@feng3d/path';
import { AssetData } from '../../core/AssetData';
import { FS } from '../../filesystem/FS';
import { pathUtils } from '../../filesystem/PathUtils';
import { ReadFS } from '../../filesystem/ReadFS';
import { ArrayUtils } from '../../polyfill/ArrayUtils';
import { mathUtil } from '../../polyfill/MathUtil';
import { ObjectUtils } from '../../polyfill/ObjectUtils';
import { Constructor, gPartial } from '../../polyfill/Types';
import { getInstance } from '../../serialization/getInstance';
import { $deserialize, $set } from '../../serialization/Serialization';
import { __class__ } from '../../serialization/SerializationConst';
import { FileAsset } from '../FileAsset';
import { FolderAsset } from '../FolderAsset';

/**
 * 可读资源系统
 */
export class ReadRS
{
    /**
     * 默认资源系统
     */
    static rs = new ReadRS();

    /**
     * 文件系统
     */
    get fs() { return this._fs || FS.fs; }
    private _fs: ReadFS;

    /**
     * 根资源路径
     */
    get rootPath() { return this._rootPath; }
    private _rootPath = 'Assets';

    /**
     * 根资源
     */
    get root() { return this.getAssetByPath(this.rootPath) as FolderAsset; }

    /**
     * 资源编号映射
     */
    protected _idMap: { [id: string]: FileAsset } = {};

    /**
     * 资源路径映射
     */
    protected _pathMap: { [path: string]: FileAsset } = {};

    /**
     * 资源树保存路径
     */
    protected resources = 'resource.json';

    /**
     * 构建可读资源系统
     *
     * @param fs 可读文件系统
     */
    constructor(fs?: ReadFS)
    {
        this._fs = fs;
    }

    /**
     * 初始化
     */
    async init()
    {
        try
        {
            const object = await this.fs.readObject(this.resources);
            if (object)
            {
                const allAssets: FileAsset[] = <any>$deserialize(object);
                //
                allAssets.forEach((asset) =>
                {
                    // 设置资源系统
                    asset.rs = this as any;
                    // 新增映射
                    this.addAsset(asset);
                });
            }
            else
            {
                await this.createAsset(FolderAsset, this.rootPath, null, null);
            }
        }
        catch (error)
        {
            await this.createAsset(FolderAsset, this.rootPath, null, null);
        }
    }

    /**
     * 新建资源
     *
     * @param Cls 资源类定义
     * @param fileName 文件名称
     * @param value 初始数据
     * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
     */
    async createAsset<T extends FileAsset>(Cls: new () => T, fileName?: string, value?: gPartial<T>, parent?: FolderAsset)
    {
        parent = parent || this.root;
        //
        const asset: FileAsset = new Cls();
        const assetId = mathUtil.uuid();

        // 初始化
        asset.rs = this as any;
        $set(<T>asset, value);
        asset.assetId = assetId;
        asset.meta = { guid: assetId, mtimeMs: Date.now(), birthtimeMs: Date.now(), assetType: asset.assetType };
        asset.initAsset();
        AssetData.addAssetData(asset.assetId, asset.data);

        // 计算扩展名
        let extenson = fengpath.extname(fileName);
        if (extenson === '') extenson = Cls['extenson'];
        console.assert(extenson !== undefined, `对象 ${Cls} 没有设置 extenson 值，参考 FolderAsset.extenson`);

        // 计算名称
        fileName = pathUtils.nameWithOutExt(fileName);
        // 设置默认名称
        fileName = fileName || `new ${asset.assetType}`;
        //
        if (parent)
        {
            // 计算有效名称
            fileName = this.getValidChildName(parent, fileName);
            asset.assetPath = `${parent.assetPath}/${fileName}${extenson}`;
        }
        else
        {
            asset.assetPath = fileName + extenson;
        }

        // 新增映射
        this.addAsset(asset);

        //
        await asset.write();

        return asset;
    }

    /**
     * 获取有效子文件名称
     *
     * @param parent 父文件夹
     * @param fileName 文件名称
     */
    getValidChildName(parent: FolderAsset, fileName: string)
    {
        const childrenNames = parent.childrenAssets.map((v) => v.fileName);
        let newName = fileName;
        let index = 1;
        while (childrenNames.indexOf(newName) !== -1)
        {
            newName = fileName + index;
            index++;
        }

        return newName;
    }

    /**
     * 读取文件为资源对象
     * @param id 资源编号
     */
    async readAsset(id: string)
    {
        const asset = this.getAssetById(id);
        if (!asset)
        {
            console.warn(new Error(`不存在资源 ${id}`), asset);

            return;
        }
        await asset.read();
        AssetData.addAssetData(asset.assetId, asset.data);

        return asset;
    }

    /**
     * 读取资源数据
     *
     * @param id 资源编号
     */
    async readAssetData(id: string)
    {
        const asset = AssetData.getLoadedAssetData(id);
        if (asset)
        {
            return asset;
        }
        const fileAsset = await this.readAsset(id);
        if (fileAsset)
        {
            return fileAsset.getAssetData();
        }
    }

    /**
     * 读取资源数据列表
     *
     * @param assetids 资源编号列表
     */
    async readAssetDatas(assetids: string[])
    {
        const result: AssetData[] = await Promise.all(assetids.map((v) => ReadRS.rs.readAssetData(v)));

        return result;
    }

    /**
     * 获取指定类型资源
     *
     * @param type 资源类型
     */
    getAssetsByType<T extends FileAsset>(type: Constructor<T>): T[]
    {
        const assets = Object.keys(this._idMap).map((v) => this._idMap[v]);

        return <any>assets.filter((v) => v instanceof type);
    }

    /**
     * 获取指定类型资源数据
     *
     * @param type 资源类型
     */
    getLoadedAssetDatasByType<T>(type: Constructor<T>): T[]
    {
        const assets = AssetData.getAllLoadedAssetDatas();

        return <any>assets.filter((v) => v instanceof type);
    }

    /**
     * 获取指定编号资源
     *
     * @param id 资源编号
     */
    getAssetById(id: string)
    {
        return this._idMap[id];
    }

    /**
     * 获取指定路径资源
     *
     * @param path 资源路径
     */
    getAssetByPath(path: string)
    {
        return this._pathMap[path];
    }

    /**
     * 获取文件夹内子文件路径列表
     *
     * @param path 路径
     */
    getChildrenPathsByPath(path: string)
    {
        const paths = this.getAllPaths();
        const childrenPaths = paths.filter((v) =>
            fengpath.dirname(v) === path);

        return childrenPaths;
    }

    /**
     * 获取文件夹内子文件列表
     *
     * @param path 文件夹路径
     */
    getChildrenAssetByPath(path: string)
    {
        const childrenPaths = this.getChildrenPathsByPath(path);

        const children: FileAsset[] = childrenPaths.map((v) => this.getAssetByPath(v));

        return children;
    }

    /**
     * 新增资源
     *
     * @param asset 资源
     */
    addAsset(asset: FileAsset)
    {
        this._idMap[asset.assetId] = asset;
        this._pathMap[asset.assetPath] = asset;
    }

    /**
     * 获取所有资源编号列表
     */
    getAllIds()
    {
        return Object.keys(this._idMap);
    }

    /**
     * 获取所有资源路径列表
     */
    getAllPaths()
    {
        return Object.keys(this._pathMap);
    }

    /**
     * 获取所有资源
     */
    getAllAssets()
    {
        const assets = this.getAllIds().map((v) => this.getAssetById(v));

        return assets;
    }

    /**
     * 删除指定编号的资源
     *
     * @param id 资源编号
     */
    deleteAssetById(id: string)
    {
        this.deleteAsset0(this.getAssetById(id));
    }

    /**
     * 删除指定路径的资源
     *
     * @param path 资源路径
     */
    deleteAssetByPath(path: string)
    {
        this.deleteAsset0(this._pathMap[path]);
    }

    /**
     * 删除资源
     *
     * @param asset 资源
     */
    deleteAsset0(asset: FileAsset)
    {
        delete this._idMap[asset.assetId];
        delete this._pathMap[asset.assetPath];
    }

    /**
     * 获取需要反序列化对象中的资源id列表
     */
    getAssetsWithObject(object: any, assetids: string[] = [])
    {
        if (ObjectUtils.isBaseType(object)) return [];
        //
        if (AssetData.isAssetData(object)) assetids.push(object.assetId);
        //
        if (ObjectUtils.isObject(object) || Array.isArray(object))
        {
            const keys = Object.keys(object);
            keys.forEach((k) =>
            {
                this.getAssetsWithObject(object[k], assetids);
            });
        }

        return assetids;
    }

    /**
     * 反序列化包含资源的对象
     *
     * @param object 反序列化的对象
     */
    async deserializeWithAssets(object: any)
    {
        // 获取所包含的资源列表
        const assetids = this.getAssetsWithObject(object);
        // 不需要加载本资源，移除自身资源
        ArrayUtils.deleteItem(assetids, object.assetId);
        // 加载包含的资源数据
        await this.readAssetDatas(assetids);
        // 创建资源数据实例
        const assetData = getInstance(object[__class__]);
        // 默认反序列
        $set(assetData, object);

        return assetData;
    }
}
