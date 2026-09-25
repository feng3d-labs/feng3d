import { FileAsset } from './FileAsset';
import { objectEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { serialization } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';

/**
 * 对象资源所持有资源对象的最小契约：可携带 assetId 字段、参与事件与序列化。
 * 具体资源类型由子类通过 `declare data` 收窄（如 Object3D、Geometry、Material），
 * 因此此处保持最小结构，assetId 通过运行时响应式系统动态附加。
 */
export type AssetDataObject = object;

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
     */
    async readFile()
    {
        const object = await this.rs.fs.readObject(this.assetPath);
        const data = await this.rs.deserializeWithAssets(object) as AssetDataObject;
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
