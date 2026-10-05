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
 * 注册（第二参数只能是**工厂函数**，issue #653）：
 * ```ts
 * registerLogic('Camera', cameraLogic);
 * registerLogic('View', viewLogic);
 * ```
 *
 * 默认值由各 Logic 自行处理（在工厂函数顶部对缺失字段单独赋值），
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

/**
 * Logic 工厂函数：把 `__type__` 对应的纯数据对象转换为 logic 实例。
 *
 * `registerLogic` **只接受工厂函数**（issue #653）：class 构造函数只有构造签名、
 * 没有调用签名，无法赋给本类型——这就是"新增 Logic 必须用工厂函数"在类型层的执行者。
 * 全部 Logic 都是工厂函数（issue #674 批 0–3），注册写 `registerLogic('Camera', cameraLogic)`；
 * `class XxxLogic` 已由门禁 `scripts/check-register-logic-factory.mjs` 禁止。
 *
 * 参数用**双变（bivariant）方法签名**而不是普通函数类型：各创建入口的签名是具体数据接口
 * （如 `(data: Camera) => CameraLogic`），而 `logic()` 传给工厂的是运行期弱类型对象
 * `{ readonly __type__: K }`。普通函数类型在 `strictFunctionTypes` 下参数逆变，二者互不相容，
 * 会迫使每个注册点写 `as` 断言；双变签名接受任一方向的兼容（各具体接口都带 `__type__` 字段，
 * 可赋给 `{ readonly __type__: K }`），于是既去掉 `any`、又保留「class 不可注册」。
 *
 * `bivarianceHack` 是 TS 在 `strictFunctionTypes` 下取双变参数的惯用形态，
 * 只在类型层面使用；运行时就是一个普通函数签名。
 */
export type LogicFactory<K extends keyof LogicMap> = {
    bivarianceHack(data: { readonly __type__: K }): LogicMap[K];
}['bivarianceHack'];

let _factories: Map<string, LogicFactory<string>> | null = null;
let _logicMap: WeakMap<object, unknown> | null = null;

/**
 * 取逻辑工厂表（首次使用时创建）。
 *
 * 原来是模块级 `new Map()`：模块被 import 就分配内存并执行代码——违反 R2「零模块级副作用」，
 * 也让 tree-shaking 无法判定这个模块是否可整体消除（issue #88）。缓存一律 lazy-init。
 */
function getFactories(): Map<string, LogicFactory<string>>
{
    if (!_factories)
    {
        _factories = new Map();
    }

    return _factories;
}

/** 取 raw → logic 实例缓存（首次使用时创建，理由同 {@link getFactories}） */
function getLogicMap(): WeakMap<object, unknown>
{
    if (!_logicMap)
    {
        _logicMap = new WeakMap();
    }

    return _logicMap;
}

/**
 * 注册数据类型与 logic 的对应关系。
 *
 * 第二参数 factory **只能是工厂函数**（issue #653）：`(data) => Logic`。
 * 写法就是注册那个工厂函数：
 * `registerLogic('Camera', cameraLogic)`。
 * class 构造函数（LogicConstructor）不再支持，`class XxxLogic` 也已被门禁禁止——
 * `logic()` 内部直接调用工厂，不再用 `new`（普通函数能被 `new` 只是 ES [[Construct]] 的副作用，箭头函数则不行）。
 *
 * factory 为必填：每个 `__type__` 注册时必须提供对应的 Logic 工厂。
 * 默认值由各 Logic 自行处理：在工厂函数顶部对 raw 缺失字段单独赋值。
 *
 * @param __type__ 数据的 __type__ 字段值
 * @param factory logic 工厂函数（必填）
 */
export function registerLogic<K extends keyof LogicMap>(
    __type__: K,
    factory: LogicFactory<K>,
): void
{
    // 注册表按 string 键存通用工厂：泛型不变性下需经 unknown 桥接
    getFactories().set(__type__ as string, factory as unknown as LogicFactory<string>);
}

/**
 * 注销一个类型的 logic 工厂。
 *
 * 供**插件被关掉**时回收贡献（issue #169）：关掉一个插件后，它声明的类型应当立刻
 * 从分发表里消失，`logic()` 回到"未注册"的表现，而不是留着一份只在运行期才看得见的残留。
 *
 * 两处**刻意不清**，如实写在文档里而不是假装彻底：
 * - `_logicMap` 里**已经创建过**的实例不回收——它们被场景对象持有着，
 *   强行丢弃只会让"对象还在、行为没了"变得更难查。已创建的对象继续用它原来的 logic，
 *   关闭插件影响的是**之后**新建的对象。
 * - 注销一个没注册过的名字是**静默无操作**（不是错误）：插件关掉时统一遍历注销，
 *   没开过的插件本来就没注册过。
 *
 * @param __type__ 数据的 __type__ 字段值
 * @returns 是否真的删掉了一项（之前注册过）
 */
export function unregisterLogic(__type__: string): boolean
{
    return getFactories().delete(__type__);
}

/**
 * 某个类型名是否已注册。
 *
 * 存在的意义是**让调用方在"问"与"试"之间有个选择**：`logic()` 对未注册类型会打一条
 * `console.error`，于是"想知道能不能取出 logic"只能靠调用一次并观察副作用——
 * 那正是"数据不合法"与"类型没注册"混在一起、报错只剩一句
 * `未注册的 __type__ 'undefined'` 的原因（issue #174 的排查现场）。
 *
 * 有了它，校验型代码可以先问再决定（回退 / 报清晰错误），而不必靠"试着调用"。
 *
 * @param __type__ 数据的 __type__ 字段值
 * @returns 是否已注册
 */
export function isLogicRegistered(__type__: string): boolean
{
    return getFactories().has(__type__);
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
    const cached = getLogicMap().get(raw);

    if (cached !== undefined) return cached as LogicMap[K];

    const factory = getFactories().get(raw.__type__ as string) as unknown as LogicFactory<K>;

    if (!factory)
    {
        // 错误处理（框架设计文档 8.2）：dev 报错指出类型名；prod 静默返回 null（消费方跳过该节点）
        if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production')
        {
            // 报错必须**能照着修**，所以除了类型名还给出数据的键：
            //   · `__type__` 是 undefined 时（旧格式 / 手写字面量漏字段），
            //     "未注册的 __type__ 'undefined'" 等于没说——给出键才看得出这是"缺字段"而不是"类型名写错"；
            //   · 类型名拼错时，键里能看到它本来想写什么。
            // 提示里刻意**不提 import 顺序**：注册应当来自插件清单的显式安装
            // （见 packages/editor/src/plugins/install.ts），依赖"import 到就注册"
            // 会让漏注册变成只有跑起来才知道的问题（issue #170）
            const keys = raw && typeof raw === 'object' ? Object.keys(raw) : [];
            const keysText = keys.length > 0 ? keys.join(', ') : '(空对象)';

            console.error(`[logic] 未注册的 __type__ '${String(raw?.__type__)}'（该对象的键：${keysText}）——`
                + '需要先经 registerLogic 注册（编辑器侧由插件清单安装，见 packages/editor/docs/PLUGINS.md）；'
                + '若 __type__ 是 undefined，说明这份数据缺该字段（旧格式数据或手写字面量漏写）');
        }
        // 注意：不缓存 null。若把 null 写入缓存，事后再 registerLogic 也不再生效，
        // 「漏 import 模块」会变成永久性静默失败（仅 import 顺序恰好正确才安全）。

        return null as LogicMap[K];
    }

    // 先缓存占位（防止工厂内部递归调用 logic() 导致栈溢出）
    getLogicMap().set(raw, _pending);
    // 直接调用工厂函数（issue #653：注册值只能是函数，不再用 new 调用）
    const l = factory(raw);

    getLogicMap().set(raw, l);

    return l;
}

/**
 * 创建 Logic 的共享原型（issue #674）。
 *
 * Logic 已从 class 改为工厂函数：实例由 `Object.create(proto)` 创建，方法 / getter 挂在
 * 文件级共享 proto 上——保住「方法在原型上共享」的内存优势（千级对象场景不产生每实例闭包）。
 *
 * 必须用属性描述符一次性定义：方法覆写与 getter 都是描述符——`Object.assign` 会把 getter
 * 求值成数据属性，也丢掉 `Object.create(base)` 建立的继承关系。
 *
 * @param base 基类 proto（作为 `Object.create` 的原型；根类型传 `null`）
 * @param descriptors 本类型的属性描述符表（方法 / getter / 对基类的覆写）
 * @returns 共享原型对象（类型断言为 Logic 接口）
 */
export function createLogicProto<T>(base: object | null, descriptors: PropertyDescriptorMap): T
{
    const proto = Object.create(base) as object;

    // 与 class 的 prototype 语义对齐（class 方法默认 writable + configurable）：
    // 描述符没显式给定时默认放宽，否则 `Object.assign(logic, { init })` 这类
    // 在实例上遮蔽 / 覆写方法的写法会抛 "Cannot assign to read only property"。
    const normalized: PropertyDescriptorMap = {};

    for (const key of Object.keys(descriptors))
    {
        const d = descriptors[key];

        normalized[key] = {
            ...d,
            configurable: d.configurable ?? true,
            ...(('value' in d) ? { writable: d.writable ?? true } : {}),
        };
    }

    Object.defineProperties(proto, normalized);

    return proto as T;
}
