import { reactive } from 'feng3d';

/**
 * 建立「读走原对象、写走 feng3d 响应式代理」的桥（根规范 §11.3 在面板边界的落地）。
 *
 * ## 为什么需要它
 *
 * 属性面板的所有 OAV 控件都这么写：
 *
 * ```ts
 * const r_owner = reactive(props.owner);   // ← 这是 **Vue 的** reactive
 * r_owner[props.name] = value;             // ← 写的是 Vue 代理
 * ```
 *
 * 而引擎用的是 `@feng3d/reactivity`。两套响应式各有各的依赖表，**互不通知**。实测：
 *
 * ```
 * feng3d 代理写入后：effect 跑了 2 次，computed=20     ← 正常
 * Vue 代理写入后：    effect 跑了 2 次，computed=20，raw=3   ← 数据变了，引擎不知道
 * ```
 *
 * 也就是说在没有这层桥之前，改完属性面板**画面不会更新**（数据确实变了，但引擎的 computed
 * 不会失效重算）。这正是 issue #147 验收标准里「可编辑生效」与「写入经响应式代理」卡住的地方。
 *
 * ## 桥怎么工作
 *
 * - **读**：原样读原对象（不做任何包装），所以 Vue 代理照常在「桥对象 + 字段名」上建立依赖，
 *   控件的 `computed` 照常失效重算；
 * - **写**：转发到 `reactive(原对象)[字段] = 值`——feng3d 的响应式写入，引擎收到通知；
 *   Vue 那边的 set 陷阱本来就会触发它自己的依赖，于是**显示与引擎同时更新**。
 *
 * ## 为什么不做嵌套对象的代理
 *
 * 曾经让 `get` 把对象/数组也经 feng3d 代理返回，好让 `r_owner.position.x = 1` 这类深层写入
 * 也通知引擎。但实测**所有控件最终都是整体写**（`useOAVVector3` 改完分量后仍会
 * `r_owner[name] = { x, y, z }`，`OAVColorPicker` 同理），顶层转发已经覆盖；
 * 而返回代理会**改变嵌套对象的身份**——`OAVComponentList` 把 `owner.components[i]` 直接交给
 * `ComponentView`，拿到代理而非原始对象就踩上「代理与原始对象比较失配」那类坑。
 * 收益为零、风险实在，所以不做。
 *
 * ## 边界
 *
 * 只用于**传给控件**的 `props.owner`；`AttributeViewInfo.owner` 保持原对象，
 * 免得桥泄漏到 objectview 内部与事件里（`ObjectViewEvent.space` 的接收方
 * `InspectorView.onValueChanged` 不使用事件载荷，所以这里换掉 owner 是安全的）。
 *
 * @param owner 字段所属的纯数据对象
 * @returns 与 `owner` 同形的桥对象
 */
export function createWriteBridge<T extends object>(owner: T): T
{
    return new Proxy(owner, {
        get(target, key, receiver)
        {
            return Reflect.get(target, key, receiver);
        },
        set(target, key, value)
        {
            reactive(target as object as Record<string | symbol, unknown>)[key] = value;

            return true;
        },
    }) as T;
}
