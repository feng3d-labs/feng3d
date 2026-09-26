import type { EditorPluginManifest } from './types';

/**
 * 插件启用状态（issue #169）。
 *
 * ## 为什么不维护一份「已启用插件列表」
 *
 * DSH 的关键一条是**按已安装状态对账**而不是维护手写列表：
 *
 * > Reconciling by installed state, not by dependency diff, means `update` activates a
 * > package that gained its `dsh.bundle` declaration in a newer version.
 *
 * 手写列表必然漂移（新装的插件不会被列进去、卸载的插件会留在列表里）。这里改成**推导**：
 *
 * ```
 * enabled = required ? true
 *         : 用户开关（若显式设过）
 *         : 清单的 defaultEnabled（省略即 true）
 * ```
 *
 * 用户开关**只记"用户改过的"**，没改过的插件永远跟着清单走——所以插件的默认状态在升级后
 * 变化（比如某个插件改成默认关闭）能自动生效，而不是被一份陈旧的用户列表钉住。
 *
 * ## 对账（`reconcilePluginState`）
 *
 * 持久化下来的开关里可能有**当前没装的插件**（用户卸载了、或换了版本）。
 * 这些项在启动时丢掉，并**记下丢了什么**——静默丢弃会让"我明明关过它"变成悬案。
 */

/** 用户开关在 localStorage 里的键 */
const STORAGE_KEY = 'feng3d-editor-plugins';

/**
 * 用户显式设过的开关（`插件 id → 是否启用`）。
 *
 * lazy-init：模块顶层读 localStorage 就是 R2 禁止的模块级副作用
 * （门禁 `scripts/check-editor-module-effects.mjs` 会报），所以缓存成 `null` 起步。
 */
let userSwitches: Record<string, boolean> | null = null;

/** 状态变化的订阅者（UI 靠它刷新面板列表） */
let listeners: Set<() => void> | null = null;

/** 最近一次对账丢掉的开关键（诊断用：启动日志会打出来） */
let droppedSwitches: readonly string[] = [];

/**
 * 读持久化的开关。
 *
 * @returns 用户开关表（读不到或坏掉时返回空表——一份坏掉的偏好设置不该让编辑器起不来）
 */
function readSwitches(): Record<string, boolean>
{
    if (typeof localStorage === 'undefined') return {};

    try
    {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};

        const result: Record<string, boolean> = {};
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>))
        {
            if (typeof value === 'boolean') result[key] = value;
        }

        return result;
    }
    catch
    {
        return {};
    }
}

/**
 * 取用户开关表（lazy-init）。
 *
 * @returns 用户开关表
 */
function switches(): Record<string, boolean>
{
    userSwitches ??= readSwitches();

    return userSwitches;
}

/** 把开关写回 localStorage（非浏览器环境静默跳过） */
function persist(): void
{
    if (typeof localStorage === 'undefined') return;

    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(switches()));
    }
    catch
    {
        // 写不进去（配额满 / 隐私模式）不该影响本次会话的开关效果，只是下次打开会丢
    }
}

/** 通知订阅者状态变了 */
function notify(): void
{
    for (const listener of listeners ?? []) listener();
}

/**
 * 解析一个插件**当前是否启用**。
 *
 * @param manifest 插件清单
 * @returns 是否启用
 */
export function resolvePluginEnabled(manifest: EditorPluginManifest): boolean
{
    // 必需插件是硬约束：用户开关对它无效（否则"关掉属性面板配置"会让检查器没控件可用）
    if (manifest.required) return true;

    const userValue = switches()[manifest.id];
    if (userValue !== undefined) return userValue;

    return manifest.defaultEnabled ?? true;
}

/**
 * 某个开关是不是**用户显式设过**的（相对"跟着清单默认走"）。
 *
 * 贡献表要报这个：否则调用方看到 `enabled: false` 分不清是"用户关的"还是"清单默认关的"。
 *
 * @param pluginId 插件 id
 * @returns 用户是否显式设过
 */
export function hasUserSwitch(pluginId: string): boolean
{
    return switches()[pluginId] !== undefined;
}

/**
 * 按**已安装状态**对账用户开关。
 *
 * 丢掉指向"当前没装的插件"的开关项，并记下丢了哪些（`getDroppedSwitches()` 可查，
 * 启动时也会打一条日志）。**自愈**：新装的插件不需要任何人往列表里加它，
 * 它直接按清单的 `defaultEnabled` 生效。
 *
 * @param installed 当前已安装（已注册）的插件清单
 * @returns 本次丢掉的开关键（空数组表示没有漂移）
 */
export function reconcilePluginState(installed: readonly EditorPluginManifest[]): readonly string[]
{
    const known = new Set(installed.map((manifest) => manifest.id));
    const dropped: string[] = [];
    const current = switches();

    for (const id of Object.keys(current))
    {
        if (!known.has(id))
        {
            delete current[id];
            dropped.push(id);
        }
    }

    droppedSwitches = dropped;
    if (dropped.length > 0) persist();

    return dropped;
}

/**
 * 最近一次对账丢掉的开关键。
 *
 * @returns 插件 id 列表
 */
export function getDroppedSwitches(): readonly string[]
{
    return droppedSwitches;
}

/**
 * 设置插件的启用状态（**只改状态，不动贡献点**）。
 *
 * 只改状态是有意的分工：这里管"用户的意愿"，真正把 Logic 装上/卸下的是
 * `plugins/enable.ts` 的 `setPluginEnabled`（它调本函数，再装/卸贡献点）。
 * 两层分开，单元测试才能单独验"状态推导"而不必牵扯引擎的全局注册表。
 *
 * 必需插件（`required: true`）拒绝关闭：那不是"用户偏好"，关掉编辑器就坏了。
 * 返回**实际生效**的状态（而不是入参），调用方据此判断有没有被拒。
 *
 * @param manifest 插件清单
 * @param enabled 期望的启用状态
 * @returns 实际生效的启用状态
 */
export function setPluginEnabledState(manifest: EditorPluginManifest, enabled: boolean): boolean
{
    if (manifest.required) return true;

    switches()[manifest.id] = enabled;
    persist();
    notify();

    return enabled;
}

/**
 * 清掉某个插件的用户开关，让它回到"跟着清单默认走"。
 *
 * @param pluginId 插件 id
 */
export function clearPluginSwitch(pluginId: string): void
{
    if (switches()[pluginId] === undefined) return;

    delete switches()[pluginId];
    persist();
    notify();
}

/**
 * 订阅插件状态变化。
 *
 * @param listener 回调
 * @returns 取消订阅
 */
export function onPluginStateChanged(listener: () => void): () => void
{
    listeners ??= new Set();
    listeners.add(listener);

    return () => { listeners?.delete(listener); };
}

/**
 * 重置内存缓存与订阅者（只给单元测试用）。
 *
 * **不动 localStorage**：要清持久化数据由用例自己清（`localStorage.clear()`），
 * 这样"改了开关 → 重置缓存 → 重读"这条**持久化**链路才测得出来。
 */
export function resetPluginState(): void
{
    userSwitches = null;
    droppedSwitches = [];
    listeners?.clear();
}
