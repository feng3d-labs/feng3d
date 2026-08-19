import { toRaw } from './shared/general';

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
 * registerLogic('Camera', CameraLogic);
 * registerLogic('View', viewLogic);
 * ```
 *
 * 默认值由各 Logic 自行处理（在构造函数 / 工厂函数顶部对缺失字段单独赋值），
 * registerLogic 不再承担默认值填充职责。
 */

/**
 * Logic 类型注册表。
 *
 * 默认带字符串索引签名（`[type: string]: unknown`），使任意 `__type__` 字面量都能通过
 * `registerLogic` 类型检查。各 logic 文件可通过 `declare module '@feng3d/reactivity'`
 * 扩展本接口，为特定 `__type__` 提供更精确的 logic 返回类型（仿 ComponentMap 模式）：
 *
 * ```ts
 * declare module '@feng3d/reactivity'
 * {
 *     export interface LogicMap
 *     {
 *         Camera: CameraLogic;
 *     }
 * }
 * ```
 */
export interface LogicMap
{
    // 必要 any: 开放注册表，未注册类型通过 logic() 调用时需保持可调用性
    [type: string]: any;
}

type LogicConstructor<K extends keyof LogicMap> = new (data: { readonly __type__: K }) => LogicMap[K];
type LogicFactory<K extends keyof LogicMap> = (data: { readonly __type__: K }) => LogicMap[K];

/**
 * logic 工厂：可以是 class 构造函数（`new (data) => Logic`），
 * 也可以是普通工厂函数（`(data) => Logic`）。
 *
 * 两种形式在 logic() 内部统一用 `new factory(data)` 调用——
 * 对 class 是正常构造；对工厂函数（函数体 return 对象），
 * new 会返回该 return 的对象（详见 ES 规范 [[Construct]]）。
 */
type LogicFactoryLike<K extends keyof LogicMap> = LogicConstructor<K> | LogicFactory<K>;

const _factories = new Map<string, LogicFactoryLike<string>>();
const _logicMap = new WeakMap<object, unknown>();

/**
 * 注册数据类型与 logic 的对应关系。
 *
 * 第二参数 factory 支持两种形式：
 * - **class 构造函数**：`registerLogic('Camera', CameraLogic)`
 *   （现有所有 logic 子类都用这种方式）
 * - **工厂函数**：`registerLogic('View', viewLogic)`
 *   （适合需要预处理或单例控制的场景）
 *
 * 两者内部统一用 `new factory(data)` 调用，对工厂函数也成立
 * （ES [[Construct]]：函数体 return 非对象时 new 返回 this，return 对象时返回该对象）。
 *
 * factory 为必填：每个 `__type__` 注册时必须提供对应的 Logic 工厂。
 * 默认值由各 Logic 自行处理：在构造函数 / 工厂函数顶部对 raw 缺失字段单独赋值。
 *
 * @param __type__ 数据的 __type__ 字段值
 * @param factory logic 构造函数或工厂函数（必填）
 */
export function registerLogic<K extends keyof LogicMap>(
    __type__: K,
    factory: LogicFactoryLike<K>,
): void
{
    _factories.set(__type__ as string, factory as LogicFactoryLike<string>);
}

// 占位标记，表示工厂正在创建中（防止递归）
const _pending = {};

/**
 * 获取数据的 logic。
 *
 * 按 `data.__type__` 查找工厂创建 logic，WeakMap 缓存同一 data 的 logic 实例。
 * 内部使用 toRaw 统一 key，确保响应式代理与原始对象共享同一 logic。
 *
 * 默认值填充由各 Logic 自行处理：工厂调用前不再做任何数据预处理，
 * 各 Logic 构造函数 / 工厂函数顶部自行对 raw 缺失字段赋默认值。
 *
 * 调用方可显式指定返回类型：`const l = logic<CameraLogic>(camera)`。
 * 若 `LogicMap` 中注册了 `__type__` 对应的类型，也可省略泛型自动推断。
 *
 * @param data 数据对象（须含 __type__ 字段）
 * @returns logic 对象（未注册的类型返回 null）
 */
export function logic<K extends keyof LogicMap>(data: { __type__: K }): LogicMap[K]
{
    // 使用 toRaw 统一 key，避免响应式代理与原始对象创建不同 logic 实例
    const raw = toRaw(data);
    const cached = _logicMap.get(raw);

    if (cached !== undefined) return cached as LogicMap[K];

    const factory = _factories.get(raw.__type__ as string) as LogicFactoryLike<K>;

    if (!factory)
    {
        // 错误处理（框架设计文档 8.2）：dev 报错指出类型名；prod 静默返回 null（消费方跳过该节点）
        if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production')
        {
            console.error(`[logic] 未注册的 __type__ '${String(raw.__type__)}'（先 import 对应模块触发 registerLogic）`);
        }
        _logicMap.set(raw, null);

        return null as LogicMap[K];
    }

    // 先缓存占位（防止构造函数内部递归调用 logic() 导致栈溢出）
    _logicMap.set(raw, _pending);
    // 统一用 new 调用：class 正常构造；工厂函数（return 对象）也返回该对象（ES [[Construct]]）。
    // 类型断言绕过 TS 对普通函数 new 的限制（运行时合法）。
    const l = new (factory as LogicConstructor<K>)(raw);

    _logicMap.set(raw, l);

    return l;
}
