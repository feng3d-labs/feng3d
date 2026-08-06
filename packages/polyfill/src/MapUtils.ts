export class MapUtils
{
    static getKeys<K, V>(map: Map<K, V>): K[]
    {
        const keys: K[] = [];
        map.forEach((_v, k) =>
        {
            keys.push(k);
        });

        return keys;
    }

    static getValues<K, V>(map: Map<K, V>): V[]
    {
        const values: V[] = [];
        map.forEach((v, _k) =>
        {
            values.push(v);
        });

        return values;
    }
}
