import { FileAsset } from './FileAsset';
import { objectEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { __class__ } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';

/**
 * 对象资源所持有资源对象的最小契约：可携带 assetId 字段、参与事件与序列化。
 * 具体资源类型由子类通过 `declare data` 收窄（如 Object3D、Geometry、Material），
 * 因此此处保持最小结构，assetId 通过运行时响应式系统动态附加。
 */
export type AssetDataObject = object;

/**
 * 纯数据资源载荷：带 `__type__` 字面量、不带 `__class__` 的声明式数据。
 *
 * 这是资源文件当前的写出形态（见 {@link ObjectAsset.saveFile}）：`serialization.serialize`
 * 产出 `{"__type__":"Object3D", ...}`，只能由 `serialization.deserialize` 读回。
 */
export interface PureDataAssetData
{
    /**
     * 类型字面量
     */
    readonly __type__: string;

    /**
     * 其余字段（构造参数、children、components 等）
     */
    readonly [key: string]: unknown;
}

/**
 * 判断已读出的资源文件数据是否为**纯数据格式**（`__type__` 字面量、无 `__class__`）。
 *
 * 纯数据只能走 `serialization.deserialize`（同步路径）；交给资源系统的反射构造链路
 * （`ReadRS.deserializeWithAssets` → `classUtils.getInstanceByName`）会因取不到类名而失败
 * （实测报 `无法获取名称为 undefined 的实例!`，见 `ObjectAsset.readFile` 的分流注释）。
 *
 * 带 `__class__` 的数据一律判为旧格式（即使同时带 `__type__`），保证旧资源继续走原链路。
 *
 * @param fileData 文件读出的原始数据
 */
export function isPureDataAssetData(fileData: unknown): fileData is PureDataAssetData
{
    if (!isRecord(fileData)) return false;
    // 旧格式优先：带类名的数据只能靠反射构造，不能当纯数据读
    if (typeof fileData[__class__] === 'string') return false;

    return typeof fileData['__type__'] === 'string';
}

/**
 * 判断已读出的资源文件数据是否为**旧格式**（带 `__class__` 类名）。
 *
 * 旧格式需要资源系统的反射构造链路（`ReadRS.deserializeWithAssets`）才能还原实例。
 *
 * @param fileData 文件读出的原始数据
 */
export function isLegacyAssetData(fileData: unknown): boolean
{
    return isRecord(fileData) && typeof fileData[__class__] === 'string';
}

/**
 * 是否为可承载字段的普通对象（排除 `null` 与数组）。
 *
 * @param value 待判定的值
 */
function isRecord(value: unknown): value is Record<string, unknown>
{
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 对象资源
 */
export abstract class ObjectAsset extends FileAsset
{
    /**
     * 资源对象
     */
    @oav({ component: 'OAVObjectView' })
    declare data: AssetDataObject;

    constructor()
    {
        super();
        watcher.watch(this as ObjectAsset, 'data', this._dataChanged, this);
    }

    async saveFile()
    {
        // assetId 通过响应式系统动态附加在数据对象上，按索引写入以避免破坏子类类型收窄
        const record = this.data as Record<string, unknown>;
        record['assetId'] = this.assetId;
        const d = serialization.serialize(this.data);
        await this.rs.fs.writeObject(this.assetPath, d);
    }

    /**
     * 读取文件
     *
     * 按文件内容分两条链路（issue #113 缺口 1）：
     * - 纯数据（`__type__`，即 {@link saveFile} 写出的形态）→ `serialization.deserialize`；
     * - 旧格式（`__class__`）→ 保持原行为，交给 `ReadRS.deserializeWithAssets`。
     *
     * 此前无条件走 `deserializeWithAssets`，读出的纯数据没有 `__class__`，
     * `classUtils.getInstanceByName` 拿不到类名，实测抛
     * `无法获取名称为 undefined 的实例!` + `TypeError: Cannot read properties of undefined (reading 'has')`
     * ——即"保存出去的对象资源读不回来"。分流规则与场景文件 `EditorAsset.readScene` 一致。
     */
    async readFile()
    {
        const object = await this.rs.fs.readObject(this.assetPath);
        const data = isPureDataAssetData(object)
            ? serialization.deserialize<AssetDataObject>(object)
            : await this.rs.deserializeWithAssets(object) as AssetDataObject;
        this.data = data;
        // assetId 通过响应式系统动态附加在数据对象上，按索引写入
        const record = this.data as Record<string, unknown>;
        record['assetId'] = this.assetId;
    }

    private _dataChanged(newValue: AssetDataObject, oldValue: AssetDataObject)
    {
        if (oldValue)
        {
            objectEmitter.off(oldValue, 'propertyValueChanged', this._onDataChanged, this);
        }
        if (newValue)
        {
            objectEmitter.on(newValue, 'propertyValueChanged', this._onDataChanged, this);
        }
    }

    private _onDataChanged()
    {
        this.write();
    }
}
