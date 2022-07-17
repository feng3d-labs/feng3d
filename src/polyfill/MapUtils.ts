namespace feng3d
{
    export class MapUtils
    {
        static getKeys<K, V>(map: Map<K, V>): K[]
        {
            const keys: any[] = [];
            map.forEach((_v, k) =>
            {
                keys.push(k);
            });

            return keys;
        }

        static getValues<K, V>(map: Map<K, V>): V[]
        {
            const values: any[] = [];
            map.forEach((v, _k) =>
            {
                values.push(v);
            });

            return values;
        }
    }
}