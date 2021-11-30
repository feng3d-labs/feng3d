declare global
{
    interface MapConstructor
    {
        getKeys<K, V>(map: Map<K, V>): K[];
        getValues<K, V>(map: Map<K, V>): V[];
    }
}
Map.getKeys = function (map)
{
    const keys: any[] = [];
    map.forEach((_v, k) =>
    {
        keys.push(k);
    });

    return keys;
};

Map.getValues = function (map)
{
    const values: any[] = [];
    map.forEach((v, _k) =>
    {
        values.push(v);
    });

    return values;
};
export { };

