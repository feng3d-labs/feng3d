/**
 * 链式Map。
 *
 * 多个key数组对应一个值。
 *
 * 由于键值可能是字面值也可能是对象，因此无法使用 {@link WeakMap} 来构建{@link ChainMap3}，只能使用 {@link Map}。
 */
export class ChainMap3<K1, K2, K3, V>
{
    private _map: Map<K1, Map<K2, Map<K3, V>>> = new Map();

    /**
     * 获取键对应的值。
     *
     * @param keys 键。
     * @returns 值。
     */
    get(keys: [K1, K2, K3]): V
    {
        const map = this._map;

        return map.get(keys[0])?.get(keys[1])?.get(keys[2]);
    }

    /**
     * 设置映射。
     *
     * @param keys 键。
     * @param value 值。
     */
    set(keys: [K1, K2, K3], value: V)
    {
        const map = this._map;

        //
        if (map.has(keys[0]) === false) map.set(keys[0], new Map());
        const map0 = map.get(keys[0]);

        //
        if (map0.has(keys[1]) === false) map0.set(keys[1], new Map());
        const map1 = map0.get(keys[1]);

        //
        map1.set(keys[2], value);
    }

    /**
     * 删除映射。
     *
     * @param keys 键。
     * @returns 如果找到目标值且被删除返回 `true` ，否则返回 `false` 。
     */
    delete(keys: [K1, K2, K3]): boolean
    {
        const map = this._map;

        return !!(map.get(keys[0])?.get(keys[1])?.delete(keys[2]));
    }
}

