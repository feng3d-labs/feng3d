import type { EditorPluginManifest } from '../types';
import type { PluginHalf } from '../../host/package';

/**
 * **运行时装载**的契约（#276 阶段 4）。
 *
 * ## 它补的是哪一段
 *
 * 阶段 1–3 把"插槽化 / cordis 化 / 三端入口"做完之后，编辑器能在**构建期**装上仓库内的插件；
 * 但"**不重新构建就装一个插件**"（#276 验收②）缺一段：谁去 `import()` 一个插件包的 client 半、
 * 校验它、把它接进清单与插槽。这一段就是本目录。
 *
 * ## 与宿主的分工
 *
 * ```
 * 宿主（#272，未落地）        入口图：要装哪些包（id / client 说明符 / apiVersion / 声明的端）
 *        │  （WebSocket / 注入的 HTML）
 *        ▼
 * 编辑器 Web 端（本目录）      import client 半 → 校验声明 → 登记清单 → 重投插槽
 * ```
 *
 * 本目录**不关心**入口图从哪来：测试里直接写 `{ entries: [...] }`，
 * 将来宿主通过桥接 / 注入的入口图喂进来——契约就是 {@link PluginEntryGraph}。
 */

/**
 * 一个插件包的装载条目（入口图里的一项）。
 *
 * 这些字段**从插件包的 `package.json` 读出来**（`exports` 与 `feng3dEditor`），
 * 由宿主或本地配置提供；装载器再核一次，不盲信。
 */
export interface PluginPackageEntry
{
    /** 包名（如 `@feng3d/editor-plugin-rotate`）；也是插件清单 id 的期望值 */
    readonly id: string;

    /**
     * client 半的模块说明符。
     *
     * 省略时按约定取 `` `${id}/client` ``（对应插件包 `exports["./client"]`）。
     */
    readonly clientSpecifier?: string;

    /**
     * 包声明的 API 版本（`feng3dEditor.apiVersion`）。
     *
     * 提供时装载器会**再核一次**：包声明与清单声明都得兼容——
     * 两处用的是同一条规则（`checkApiVersion`），不会出现"包说行、清单说不行"。
     */
    readonly apiVersion?: string;

    /**
     * 这个包声明了哪几端（`exports` 的 `"."` / `"./client"` / `"./runtime"`）。
     *
     * 装载器只关心它是否包含 `client`（没有 `./client` 的包不该被当界面插件装进来）；
     * `runtime` 的存在与否留给构建期（#277）。
     */
    readonly halves?: readonly PluginHalf[];
}

/** 入口图：要装哪些插件包（宿主或本地配置提供） */
export interface PluginEntryGraph
{
    /** 条目（顺序即装载顺序） */
    readonly entries: readonly PluginPackageEntry[];
}

/** 一次装载的结果（**永不抛错**：装载失败是数据，不是异常） */
export interface PluginLoadOutcome
{
    /** 插件包 id */
    readonly id: string;

    /** 是否装载成功（成功 = 清单已登记、插槽已重投） */
    readonly loaded: boolean;

    /** 失败原因（成功时为空数组）；每条都写成"哪里不对、怎么改" */
    readonly problems: readonly string[];
}

/**
 * client 半模块的**约定形状**。
 *
 * 插件包的 `"./client"` 入口必须导出清单：具名 `manifest`，或默认导出。
 * 两者都给时以 `manifest` 为准（显式优于隐式）。
 */
export interface ClientHalfModule
{
    /** 清单（约定导出名） */
    readonly manifest?: EditorPluginManifest;

    /** 清单（默认导出，兼容写法） */
    readonly default?: EditorPluginManifest;
}
