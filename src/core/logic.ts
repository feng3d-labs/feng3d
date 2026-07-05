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
 */

type LogicFactory = (data: any) => any;

const _factories = new Map<string, LogicFactory>();
const _logicMap = new WeakMap<object, any>();

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
 * 获取数据的 logic。
 *
 * 按 `data.__type__` 查找工厂创建 logic，WeakMap 缓存同一 data 的 logic 实例。
 * 内部使用 toRaw 统一 key，确保响应式代理与原始对象共享同一 logic。
 *
 * @param data 数据对象（须含 __type__ 字段）
 * @returns logic 对象（未注册的类型返回 null）
 */
export function logic<T = any>(data: { __type__: string }): T
{
    // 使用 toRaw 统一 key，避免响应式代理与原始对象创建不同 logic 实例
    const raw = toRaw(data);
    let l = _logicMap.get(raw);
    if (l) return l;

    const factory = _factories.get(raw.__type__);
    if (!factory) return null;

    // 先缓存占位（防止工厂内部递归调用 logic() 导致栈溢出）
    _logicMap.set(raw, null as any);
    l = factory(raw);
    _logicMap.set(raw, l);

    return l;
}
