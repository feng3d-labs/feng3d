namespace feng3d
{
    /**
     * 默认哈希表 （建议使用Object代替）
     * 
     * 哈希表的大小直接影响冲突的次数。
     * 哈希表的大小越大，冲突就越少。
     */
    const defaultHashTableSize = 32;

    /**
     * 哈希表（散列表）
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/hash-table/HashTable.js
     */
    export class HashTable
    {
        private keys: Object;

        buckets: LinkedList<{ key: string, value: any }>[];

        /**
         * 构建哈希表
         * @param hashTableSize 哈希表尺寸
         */
        constructor(hashTableSize = defaultHashTableSize)
        {
            this.buckets = [];
            for (let i = 0; i < hashTableSize; i++)
            {
                this.buckets.push(new LinkedList());
            }
            this.keys = {};
        }

        /**
         * 将字符串键转换为哈希数。
         * 
         * @param key 字符串键 
         */
        hash(key: string)
        {
            const hash = key.split("").reduce(
                (hashAccumulator, char) => (hashAccumulator + char.charCodeAt(0)),
                0,
            );

            return hash % this.buckets.length;
        }

        /**
         * 设置值
         * 
         * @param key 键
         * @param value 值
         */
        set(key: string, value: any)
        {
            var keyValue = { key: key, value: value };

            const keyHash = this.hash(key);
            this.keys[key] = keyHash;
            const bucketLinkedList = this.buckets[keyHash];
            const node = bucketLinkedList.findByFunc((v) => v.key === key);

            if (!node)
            {
                bucketLinkedList.addTail(keyValue);
            } else
            {
                node.value.value = value;
            }
        }

        /**
         * 删除指定键以及对于值
         * 
         * @param key 键
         */
        delete(key: string)
        {
            const keyHash = this.hash(key);
            delete this.keys[key];
            const bucketLinkedList = this.buckets[keyHash];
            const node = bucketLinkedList.findByFunc((v) => v.key === key);

            if (node)
            {
                return bucketLinkedList.deleteAll(node.value);
            }

            return null;
        }

        /**
         * 获取与键对应的值
         * 
         * @param key 键
         */
        get(key: string)
        {
            const bucketLinkedList = this.buckets[this.hash(key)];
            const node = bucketLinkedList.findByFunc((v) => v.key === key);

            return node ? node.value.value : undefined;
        }

        /**
         * 是否拥有键
         * 
         * @param key 键
         */
        has(key: string)
        {
            return Object.hasOwnProperty.call(this.keys, key);
        }

        /**
         * 获取键列表
         */
        getKeys()
        {
            return Object.keys(this.keys);
        }

    }
}