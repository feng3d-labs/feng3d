import { EventEmitter } from '../../event/EventEmitter';
import { MapUtils } from '../../polyfill/MapUtils';
import { getClassName } from '../../serialization/getClassName';
import { getInstance } from '../../serialization/getInstance';
import { serialization } from '../../serialization/Serialization';
import { __class__ } from '../../serialization/SerializationConst';
import { serialize } from '../../serialization/serialize';
import { AssetType } from '../assets/AssetType';
import { ReadRS } from '../assets/rs/ReadRS';

/**
 * 资源数据
 *
 * 该对象可由资源文件中读取，或者保存为资源
 */
export class AssetData extends EventEmitter
{
    /**
     * 资源名称
     */
    @serialize
    get assetName(): string
    {
        const asset = ReadRS.rs.getAssetById(this.assetId);
        if (asset)
        {
            return asset.fileName;
        }

        return null;
    }

    /**
     * 资源编号
     */
    @serialize
    get assetId()
    {
        return this._assetId;
    }
    set assetId(v)
    {
        if (this._assetId === v) return;

        if (this._assetId !== undefined)
        {
            console.error(`不允许修改 assetId`);

            return;
        }

        this._assetId = v;
    }
    private _assetId: string;

    /**
     * 资源类型，由具体对象类型决定
     */
    assetType: AssetType;

    /**
     * 新增资源数据
     *
     * @param assetId 资源编号
     * @param data 资源数据
     */
    static addAssetData<T>(assetId: string, data: T)
    {
        if (!data) return;
        if (this.assetMap.has(data) || this.idAssetMap.has(assetId))
        {
            console.warn(`同一个材质被保存在多个资源中！`);
        }

        this.assetMap.set(data, assetId);
        this.idAssetMap.set(assetId, data);

        return data;
    }

    /**
     * 删除资源数据
     *
     * @param data 资源数据
     */
    static deleteAssetData(data: any)
    {
        if (!data) return;
        console.assert(this.assetMap.has(data));
        const assetId = this.assetMap.get(data);
        this._delete(assetId, data);
    }

    static deleteAssetDataById(assetId: string)
    {
        console.assert(this.idAssetMap.has(assetId));
        const data = this.idAssetMap.get(assetId);
        this._delete(assetId, data);
    }

    private static _delete(assetId, data: any)
    {
        this.assetMap.delete(data);
        this.idAssetMap.delete(assetId);
    }

    /**
     * 判断是否为资源数据
     *
     * @param asset 可能的资源数据
     */
    static isAssetData(asset: any): asset is AssetData
    {
        if (this.assetMap.has(asset)) return true;
        if (asset instanceof AssetData) return true;

        return false;
    }

    /**
     * 资源属性标记名称
     */
    private static assetPropertySign = 'assetId';

    /**
     * 序列化
     *
     * @param asset 资源数据
     */
    static serialize(asset: AssetData)
    {
        const obj = <any>{};
        obj[__class__] = getClassName(asset);
        obj.assetId = asset.assetId;

        return obj;
    }

    /**
     * 反序列化
     *
     * @param object 资源对象
     */
    static deserialize(object: any)
    {
        const result = this.getLoadedAssetData(object.assetId);
        console.assert(!!result, `资源 ${object.assetId} 未加载，请使用 ReadRS.deserializeWithAssets 进行序列化包含加载的资源对象。`);

        return result;
    }

    /**
     * 获取已加载的资源数据
     *
     * @param assetId 资源编号
     */
    static getLoadedAssetData(assetId: string)
    {
        return this.idAssetMap.get(assetId);
    }

    /**
     * 获取所有已加载资源数据
     */
    static getAllLoadedAssetDatas()
    {
        return MapUtils.getKeys(this.assetMap);
    }

    /**
     * 资源与编号对应表
     */
    static assetMap = new Map<any, string>();

    /**
     * 编号与资源对应表
     */
    static idAssetMap = new Map<string, any>();
}

/**
 * 设置函数列表
 */
serialization.setValueHandlers.push(
    // 处理资源
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];
            if (AssetData.isAssetData(spv))
            {
                // 此处需要反序列化资源完整数据
                if (property === '__root__')
                {
                    return false;
                }

                target[property] = AssetData.deserialize(spv);

                return true;
            }
            if (AssetData.isAssetData(tpv))
            {
                if (spv.__class__ === null)
                {
                    const className = getClassName(tpv);
                    const inst = getInstance(className as any);
                    param.serialization.setValue(inst, spv);
                    target[property] = inst;
                }
                else
                {
                    target[property] = param.serialization.deserialize(spv);
                }

                return true;
            }

            return false;
        }
    },
);

serialization.serializeHandlers.push(
    // 处理资源
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];
            if (AssetData.isAssetData(spv))
            {
                // 此处需要反序列化资源完整数据
                if (property === '__root__')
                {
                    return false;
                }
                target[property] = AssetData.serialize(<any>spv);

                return true;
            }

            return false;
        }
    },
);

serialization.deserializeHandlers.push(
    // 处理资源
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];
            if (AssetData.isAssetData(spv))
            {
                // 此处需要反序列化资源完整数据
                if (property === '__root__')
                {
                    return false;
                }
                target[property] = AssetData.deserialize(spv);

                return true;
            }
            if (AssetData.isAssetData(tpv))
            {
                target[property] = param.serialization.deserialize(spv);

                return true;
            }

            return false;
        }
    },
    // 处理资源
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];
            if (AssetData.isAssetData(spv))
            {
                // 此处需要反序列化资源完整数据
                if (property === '__root__')
                {
                    return false;
                }
                target[property] = AssetData.deserialize(spv);

                return true;
            }
            if (AssetData.assetMap.has(tpv))
            {
                target[property] = param.serialization.deserialize(spv);

                return true;
            }

            return false;
        }
    },
);

serialization.differentHandlers.push(
    // 资源
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const different = param.different;
            const tpv = target[property];
            if (AssetData.isAssetData(tpv))
            {
                // 此处需要反序列化资源完整数据
                if (property === '__root__')
                {
                    return false;
                }
                different[property] = AssetData.serialize(tpv);

                return true;
            }

            return false;
        }
    },
);

