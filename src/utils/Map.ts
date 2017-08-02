namespace feng3d
{

    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    export class Map<K extends { uuid: string }, V extends { uuid: string }>
    {
        private keyMap: { [kUid: string]: K } = {};
        private valueMap: { [kUid: string]: V } = {};

        /**
         * 删除
         */
        delete(k: K)
        {
            delete this.keyMap[k.uuid];
            delete this.valueMap[k.uuid];
        }

        /**
         * 添加映射
         */
        push(k: K, v: V)
        {
            this.keyMap[k.uuid] = k;
            this.valueMap[k.uuid] = v;
        }

        /**
         * 通过key获取value
         */
        get(k: K): V
        {
            if (k == null)
                return null;
            return this.valueMap[k.uuid];
        }

        /**
         * 获取键列表
         */
        getKeys(): K[]
        {
            var keys: K[] = [];
            for (var key in this.keyMap)
            {
                keys.push(this.keyMap[key]);
            }
            return keys;
        }

        /**
         * 清理字典
         */
        clear()
        {
            this.keyMap = {};
            this.valueMap = {};
        }
    }
}