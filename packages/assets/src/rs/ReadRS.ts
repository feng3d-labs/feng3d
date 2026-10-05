import { newUuid } from '@feng3d/math';
import { FS, pathUtils, ReadFS } from '@feng3d/filesystem';
import { path as fengpath } from '@feng3d/path';
import { ArrayUtils, classUtils, Constructor, gPartial, ObjectUtils, __class__ } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { AssetData } from '../AssetData';
import { FileAsset, getAssetTypeClass } from '../FileAsset';
import type { FolderAsset } from '../FolderAsset';

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
    get fs(): ReadFS { return this._fs || FS.fs; }
    private _fs: ReadFS | undefined;

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
                const allAssets: FileAsset[] = <any>serialization.deserialize(object as any);
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
                await this.createAsset(getAssetTypeClass('folder'), this.rootPath, undefined, undefined);
            }
        }
        catch
        {
            await this.createAsset(getAssetTypeClass('folder'), this.rootPath, undefined, undefined);
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
        const assetId = newUuid();

        // 初始化
        asset.rs = this as any;
        // value 可选；undefined 会被 setValue 内部的 isBaseType 判断提前 return，与传 null 时一致
        serialization.setValue(<T>asset, value!);
        asset.assetId = assetId;
        asset.meta = { guid: assetId, mtimeMs: Date.now(), birthtimeMs: Date.now(), assetType: asset.assetType };
        asset.initAsset();
        AssetData.addAssetData(asset.assetId, asset.data);

        // 计算扩展名
        let extenson = fengpath.extname(fileName!);
        if (extenson === '') extenson = Cls['extenson'];
        console.assert(extenson !== undefined, `对象 ${Cls} 没有设置 extenson 值，参考 FolderAsset.extenson`);

        // 计算名称
        fileName = pathUtils.nameWithOutExt(fileName!);
        // 设置默认名称
        fileName = fileName || `new ${asset.assetType}`;
        //
        if (parent)
        {
            // 计算有效名称（把 extenson 传进去：多段后缀下必须按完整文件名判重，否则会覆盖同名文件）
            fileName = this.getValidChildName(parent, fileName, extenson);
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
     * @param fileName 文件名称（**不含**扩展名）
     * @param extenson 将要拼到文件名后面的扩展名；传入后按**完整文件名**判重
     *
     * 为什么要传 `extenson`：`FileAsset.fileName` 走的是 `pathUtils.nameWithOutExt`，它只剥掉
     * **最后一个**后缀——多段后缀下会残留类型标记（实测 `'assets/scene.tar.gz'` → `'scene.tar'`）。
     * 而这里的候选名是**不带任何后缀**的 `fileName`，两者基准不同：
     * 已存在 `Assets/Sphere.gameobject.json` 时 `v.fileName` 是 `'Sphere.gameobject'`，
     * 查 `'Sphere'` 查不到冲突，最终仍会拼出同一个路径并**覆盖同名文件**。
     * 所以按 `新名 + extenson` 与子资源的**完整文件名**比较；不传 `extenson` 时退回旧行为。
     */
    getValidChildName(parent: FolderAsset, fileName: string, extenson = '')
    {
        // 子资源的完整文件名（含全部后缀）。`assetPath` 为空的新资源用 basename 会得到空串，不影响判重
        const childrenFullNames = parent.childrenAssets.map((v) => fengpath.basename(v.assetPath ?? ''));
        let newName = fileName;
        let index = 1;
        while (childrenFullNames.indexOf(`${newName}${extenson}`) !== -1)
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
        const assetData = classUtils.getInstanceByName(object[__class__]);
        // 旧数据靠 `__class__` 反射构造；取不到类名 / 类未注册时**显式失败**，
        // 不要静默返回 undefined（那会让调用方拿到半成品）—— #402 修好嵌套实例化之后，
        // 这一步是"旧格式能读、纯数据仍失败"这条分界的唯一守卫。
        if (!assetData)
        {
            throw new Error(`deserializeWithAssets：取不到类名或类未注册（__class__ = ${String(object?.[__class__])}）`);
        }
        // 默认反序列
        serialization.setValue(assetData, object);

        return assetData;
    }
}
