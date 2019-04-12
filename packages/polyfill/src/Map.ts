namespace feng3d
{
    /**
     * 增强Map功能
     */
    export var maputils: MapUtils;

    /**
     * 增强Map功能
     */
    export class MapUtils
    {
        /**
         * 获取所有键
         * 
         * @param map Map对象
         */
        getKeys<K, V>(map: Map<K, V>)
        {
            var keys: K[] = [];
            map.forEach((v, k) =>
            {
                keys.push(k);
            });
            return keys;
        }

        /**
         * 获取所有值
         * 
         * @param map Map对象
         */
        getValues<K, V>(map: Map<K, V>)
        {
            var values: V[] = [];
            map.forEach((v, k) =>
            {
                values.push(v);
            });
            return values;
        }

    }
    maputils = new MapUtils();
}