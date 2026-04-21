/**
 * 链式Map。
 *
 * 多个key数组对应一个值。
 *
 * 由于键值可能是字面值也可能是对象，因此无法使用 {@link WeakMap} 来构建{@link ChainMap}，只能使用 {@link Map}。
 */
export class ChainObjectMap<K extends Array<any>, V>
{
    private _map = {};

    /**
     * 获取键对应的值。
     *
     * @param keys 键。
     * @returns 值。
     */
    get(keys: K): V
    {
        let map = this._map;

        for (let i = 0, n = keys.length; i < n; i++)
        {
            let key = keys[i];

            if (typeof key === 'object' || typeof key === 'function')
            {
                key = key['_id'];
            }

            map = map[key];
            if (map === undefined) return undefined;
        }

        return map as any;
    }

    /**
     * 设置映射。
     *
     * @param keys 键。
     * @param value 值。
     */
    set(keys: K, value: V)
    {
        let map = this._map;

        let key: any;

        for (let i = 0, n = keys.length; i < n; i++)
        {
            key = keys[i];
            if (typeof key === 'object' || typeof key === 'function')
            {
                key = key['_id'] = key['_id'] || autoId++;
            }
            if (i < n - 1)
            {
                map = map[key] = map[key] || {};
            }
            else
            {
                map[key] = value;
            }
        }
    }

    /**
     * 删除映射。
     *
     * @param keys 键。
     * @returns 如果找到目标值且被删除返回 `true` ，否则返回 `false` 。
     */
    delete(keys: K): boolean
    {
        let map = this._map;

        for (let i = 0, n = keys.length; i < n; i++)
        {
            let key = keys[i];

            if (typeof key === 'object' || typeof key === 'function')
            {
                key = key['_id'];
            }

            if (i < n - 1)
            {
                map = map[key];
                if (!map) return false;
            }
            else
            {
                map[key] = undefined;
            }
        }

        return true;
    }
}

let autoId = 0;