namespace feng3d
{
    /**
     * 布隆过滤器 （ 在 JavaScript中 该类可由Object对象代替）
     * 
     * 用于判断某元素是否可能插入
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/bloom-filter/BloomFilter.js
     * @see https://baike.baidu.com/item/%E5%B8%83%E9%9A%86%E8%BF%87%E6%BB%A4%E5%99%A8
     */
    export class BloomFilter
    {
        private size = 100;
        private storage: { getValue(index: any): any; setValue(index: any): void; };

        /**
         * 
         * @param size 尺寸
         */
        constructor(size = 100)
        {
            this.size = size;
            this.storage = this.createStore(size);
        }

        /**
         * 插入
         * 
         * @param item 元素
         */
        insert(item: string)
        {
            const hashValues = this.getHashValues(item);

            hashValues.forEach(val => this.storage.setValue(val));
        }

        /**
         * 可能包含
         * 
         * @param item 元素
         */
        mayContain(item: string)
        {
            const hashValues = this.getHashValues(item);

            for (let hashIndex = 0; hashIndex < hashValues.length; hashIndex += 1)
            {
                if (!this.storage.getValue(hashValues[hashIndex]))
                {
                    // 我们知道项目肯定没有插入。
                    return false;
                }
            }

            // 项目可能已经插入，也可能没有插入。
            return true;
        }

        /**
         * 创建存储器
         * @param size 尺寸
         */
        createStore(size: number)
        {
            const storage = [];

            // 初始化
            for (let storageCellIndex = 0; storageCellIndex < size; storageCellIndex += 1)
            {
                storage.push(false);
            }

            const storageInterface = {
                getValue(index)
                {
                    return storage[index];
                },
                setValue(index)
                {
                    storage[index] = true;
                },
            };

            return storageInterface;
        }

        /**
         * 计算哈希值1
         * 
         * @param item 元素
         */
        hash1(item: string)
        {
            let hash = 0;

            for (let charIndex = 0; charIndex < item.length; charIndex += 1)
            {
                const char = item.charCodeAt(charIndex);
                hash = (hash << 5) + hash + char;
                hash &= hash; // Convert to 32bit integer
                hash = Math.abs(hash);
            }

            return hash % this.size;
        }

        /**
         * 计算哈希值2
         * 
         * @param item 元素
         */
        hash2(item: string)
        {
            let hash = 5381;

            for (let charIndex = 0; charIndex < item.length; charIndex += 1)
            {
                const char = item.charCodeAt(charIndex);
                hash = (hash << 5) + hash + char; /* hash * 33 + c */
            }

            return Math.abs(hash % this.size);
        }

        /**
         * 计算哈希值3
         * 
         * @param item 元素
         */
        hash3(item: string)
        {
            let hash = 0;

            for (let charIndex = 0; charIndex < item.length; charIndex += 1)
            {
                const char = item.charCodeAt(charIndex);
                hash = (hash << 5) - hash;
                hash += char;
                hash &= hash; // Convert to 32bit integer
            }

            return Math.abs(hash % this.size);
        }

        /**
         * 获取3个哈希值组成的数组
         */
        getHashValues(item: string)
        {
            return [
                this.hash1(item),
                this.hash2(item),
                this.hash3(item),
            ];
        }
    }

}