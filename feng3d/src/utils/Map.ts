module feng3d {

    /**
     * 构建Map类代替Dictionary
     */
    export class Map<K, V>
    {
        /**
         * key,value组合列表
         */
        private list: KV<K, V>[] = [];

        /**
         * 删除
         */
        public delete(k: K) {
            for (var i = 0; i < this.list.length; i++) {
                var element = this.list[i];
                if (element.k == k) {
                    this.list.splice(i, 1);
                    break;
                }
            }
        }

        /**
         * 添加映射
         */
        public push(k: K, v: V) {

            var target = this._getKV(k);
            if (target != null)
                target.v = v;
            else {
                target = new KV(k, v);
                this.list.push(target);
            }
        }

        /**
         * 通过key获取value
         */
        public get(k: K): V {
            var target = this._getKV(k);
            if (target != null)
                return target.v;
            return null;
        }

        /**
         * 获取键列表
         */
        public getKeys(): K[] {
            var keys: K[] = [];

            this.list.forEach(kv => {
                keys.push(kv.k);
            });

            return keys;
        }

        /**
         * 清理字典
         */
        public clear() {
            this.list.length = 0;
        }

        /**
         * 通过key获取(key,value)组合
         */
        private _getKV(k: K): KV<K, V> {
            var target: KV<K, V>;
            this.list.forEach(kv => {
                if (kv.k == k) {
                    target = kv;
                }
            });
            return target;
        }
    }

    /**
     * key,value组合
     */
    class KV<K, V>
    {
        constructor(public k: K, public v: V)
        { }
    }
}