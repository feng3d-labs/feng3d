// 补充 Map
interface Map<K, V>
{
    getKeys(): K[];
    getValues(): V[];
}

Map.prototype.getKeys = function ()
{
    var keys: any[] = [];
    this.forEach((v, k) =>
    {
        keys.push(k);
    });
    return keys;
}

Map.prototype.getValues = function ()
{
    var values: any[] = [];
    this.forEach((v, k) =>
    {
        values.push(v);
    });
    return values;
}