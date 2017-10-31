module feng3d
{

    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    export class Map<K, V>
    {
        private kv: { k: K, v: V }[] = [];

        /**
         * 删除
         */
        delete(k: K)
        {
            for (var i = this.kv.length - 1; i >= 0; i--)
            {
                if (k == this.kv[i].k)
                {
                    this.kv.splice(i, 1);
                }
            }
        }

        /**
         * 添加映射
         */
        push(k: K, v: V)
        {
            this.delete(k);
            this.kv.push({ k: k, v: v });
        }

        /**
         * 通过key获取value
         */
        get(k: K)
        {
            for (var i = 0; i < this.kv.length; i++)
            {
                var element = this.kv[i];
                if (element.k == k)
                    return element.v;
            }
            return null;
        }

        /**
         * 获取键列表
         */
        getKeys()
        {
            var keys: K[] = [];
            this.kv.forEach(element =>
            {
                keys.push(element.k);
            });
            return keys;
        }

        /**
         * 清理字典
         */
        clear()
        {
            this.kv.length = 0;
        }
    }
}