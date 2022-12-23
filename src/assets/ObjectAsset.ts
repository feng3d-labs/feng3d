import { FileAsset } from '@feng3d/core';
import { objectEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { serialization } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';

/**
 * 对象资源
 */
export abstract class ObjectAsset extends FileAsset
{
    /**
     * 资源对象
     */
    @oav({ component: 'OAVObjectView' })
    declare data: any;

    constructor()
    {
        super();
        watcher.watch(this as ObjectAsset, 'data', this._dataChanged, this);
    }

    async saveFile()
    {
        this.data.assetId = this.assetId;
        const d = serialization.serialize(this.data);
        await this.rs.fs.writeObject(this.assetPath, d);
    }

    /**
     * 读取文件
     */
    async readFile()
    {
        const object = await this.rs.fs.readObject(this.assetPath);
        const data: any = await this.rs.deserializeWithAssets(object);
        this.data = data;
        this.data.assetId = this.assetId;
    }

    private _dataChanged(property, oldValue, newValue)
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
