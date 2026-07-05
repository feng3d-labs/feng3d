import { toRaw } from '@feng3d/reactivity';

/**
 * 统一 logic 入口。
 *
 * 所有数据类型（Object3D、Container、Entity、Component 及其子类）的 logic
 * 通过 `__type__` 字段分发到对应工厂，WeakMap 缓存。
 *
 * 用法：
 * ```ts
 * logic(object3D)         // 等价于原 logic(object3D)
 * logic(camera)           // 等价于原 cameraLogic(camera)
 * logic(transform)        // 等价于原 transformLogic(transform)
 * ```
 *
 * 注册：
 * ```ts
 * registerLogic('Camera', (camera) => createCameraLogic(camera));
 * ```
 *
 * 默认值自动填充：
 * ```ts
 * registerDefaults('Object3D', { activeSelf: true, position: {x:0,y:0,z:0}, ... });
 * logic(data) 时 data 缺失的字段会自动按 defaults 补齐（对象/数组浅拷贝避免共享引用）。
 * ```
 */

type LogicFactory = (data: any) => any;

const _factories = new Map<string, LogicFactory>();
const _logicMap = new WeakMap<object, any>();

// defaults 注册表：__type__ → 默认值模板
const _defaults = new Map<string, Record<string, any>>();

/**
 * 注册数据类型与 logic 工厂的对应关系。
 *
 * @param __type__ 数据的 __type__ 字段值（类名）
 * @param factory logic 工厂函数
 */
export function registerLogic(__type__: string, factory: LogicFactory): void
{
    _factories.set(__type__, factory);
}

/**
 * 注册某 `__type__` 的默认值模板。
 *
 * `logic(data)` 在调用工厂前，会遍历 defaults 的字段，对 data 中缺失（`undefined`）
 * 的字段进行填充。对象/数组会浅拷贝一份，避免多个数据实例共享同一引用。
 *
 * @param __type__ 数据的 __type__ 字段值
 * @param defaults 默认值模板对象
 */
export function registerDefaults(__type__: string, defaults: Record<string, any>): void
{
    _defaults.set(__type__, defaults);
}

/**
 * 把 defaults 中缺失的字段填充到 data 上（原地修改）。
 *
 * - 仅填充 `data[key] === undefined` 的字段
 * - 对象/数组浅拷贝避免共享引用
 *
 * @param data 原始数据对象
 */
function applyDefaults(data: any): void
{
    const defaults = _defaults.get(data.__type__);
    if (!defaults) return;
    for (const key in defaults)
    {
        if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
        if (data[key] === undefined)
        {
            const v = defaults[key];
            data[key] = (v && typeof v === 'object')
                ? (Array.isArray(v) ? [...v] : { ...v })
                : v;
        }
    }
}

// 占位标记，表示工厂正在创建中（防止递归）
const _pending = {};

/**
 * 获取数据的 logic。
 *
 * 按 `data.__type__` 查找工厂创建 logic，WeakMap 缓存同一 data 的 logic 实例。
 * 内部使用 toRaw 统一 key，确保响应式代理与原始对象共享同一 logic。
 * 工厂调用前会先按 registerDefaults 注册的默认值模板自动补齐缺失字段。
 *
 * @param data 数据对象（须含 __type__ 字段）
 * @returns logic 对象（未注册的类型返回 null）
 */
export function logic<T = any>(data: { __type__: string }): T
{
    // 使用 toRaw 统一 key，避免响应式代理与原始对象创建不同 logic 实例
    const raw = toRaw(data);
    const cached = _logicMap.get(raw);
    if (cached !== undefined) return cached as T;

    // 自动填充默认值（缺失字段）
    applyDefaults(raw);

    const factory = _factories.get(raw.__type__);
    if (!factory)
    {
        _logicMap.set(raw, null);
        return null;
    }

    // 先缓存占位（防止工厂内部递归调用 logic() 导致栈溢出）
    _logicMap.set(raw, _pending);
    const l = factory(raw);
    _logicMap.set(raw, l);

    return l;
}
