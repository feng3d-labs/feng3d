/**
 * 链式字典。
 *
 * 使用WeakMap构建的，支持多个key数组对应一个值。
 */
export class ChainMap<K extends readonly unknown[], V>
{
    /**
     * 根字典。
     */
    private _map = new WeakMap<object, ChainMapNode<V>>();
    get size()
    {
        return this._size;
    }

    private _size = 0;

    /**
     * 获取键对应的值。
     *
     * @param keys 键。
     * @returns 值。
     */
    get(keys: K): V | undefined
    {
        const keysLength = keys.length;
        let map = this._map;
        let key: object;

        for (let i = 0, n = keysLength - 1; i < n; i++)
        {
            key = wrapKey(keys[i]);
            map = map.get(key) as WeakMap<object, ChainMapNode<V>>;

            if (map === undefined) return undefined;
        }

        key = wrapKey(keys[keysLength - 1]);

        const node = map.get(key);

        return node && hasValue(node) ? node.value : undefined;
    }

    /**
     * 设置映射。
     *
     * @param keys 键。
     * @param value 值。
     *
     * @returns 返回设置的值。
     */
    set(keys: K, value: V)
    {
        const keysLength = keys.length;
        let map = this._map;
        let key: object;

        for (let i = 0; i < keysLength - 1; i++)
        {
            key = wrapKey(keys[i]);

            if (!map.has(key))
            {
                map.set(key, new WeakMap());
            }

            map = map.get(key) as WeakMap<object, ChainMapNode<V>>;
        }

        key = wrapKey(keys[keysLength - 1]);
        const existing = map.get(key);

        if (!existing || !hasValue(existing))
        {
            map.set(key, { value });
            this._size++;
        }

        return value;
    }

    /**
     * 删除映射。
     *
     * @param keys 键。
     * @returns 如果找到目标值且被删除返回 `true` ，否则返回 `false` 。
     */
    delete(keys: K): boolean
    {
        const keysLength = keys.length;
        let map = this._map;
        let key: object;

        for (let i = 0; i < keysLength - 1; i++)
        {
            key = wrapKey(keys[i]);
            map = map.get(key) as WeakMap<object, ChainMapNode<V>>;

            if (map === undefined) return false;
        }

        key = wrapKey(keys[keysLength - 1]);
        const result = map.delete(key);

        if (result) this._size--;

        return result;
    }
}

/**
 * 字典内部节点。
 *
 * 叶子节点保存实际值；中间节点为 WeakMap（链式嵌套）。
 */
type ChainMapNode<V> = { value: V } | WeakMap<object, ChainMapNode<V>>;

/**
 * 判断节点是否为保存值的叶子节点。
 */
function hasValue<V>(node: ChainMapNode<V>): node is { value: V }
{
    return 'value' in node;
}

// 创建一个普通 Map 用于存储原始值和包装对象的映射
const keyMap = new Map<unknown, KeyWrapper>();
// 用于生成唯一 ID 的计数器
let idCounter = 0;

/**
 * 包装对象类型，用于在 WeakMap 中保存非对象 key。
 */
interface KeyWrapper
{
    __id: number;
    __value: unknown;
}

// 包装函数，将非对象值包装成对象
function wrapKey(key: unknown): object
{
    if (typeof key === 'object' && key !== null)
    {
        // 如果 key 已经是对象，则直接返回
        return key;
    }
    const existing = keyMap.get(key);

    if (existing)
    {
        // 如果原始值已经有对应的包装对象，直接返回
        return existing;
    }
    // 为非对象 key 生成一个唯一 ID
    const id = idCounter++;
    // 创建一个包装对象
    const wrapper: KeyWrapper = {
        __id: id,
        __value: key,
    };

    // 存储原始值和包装对象的映射
    keyMap.set(key, wrapper);

    return wrapper;
}
