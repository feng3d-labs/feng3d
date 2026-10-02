import { loadPluginGraph } from './loader';
import type { PluginEntryGraph, PluginLoadOutcome, PluginPackageEntry } from './types';

/**
 * **启动装载**：读宿主注入的入口图并把它落实（#276 任务 4 的宿主半 + Web 半衔接）。
 *
 * ## 这条链长什么样
 *
 * ```
 * 宿主（Node）                             浏览器（编辑器 Web 端）
 *  plugins/ 目录 / editor.plugins.json
 *        │ 产出入口图（id + client 半的 URL）
 *        ▼
 *  响应 index.html 时注入 <script>window.__EDITOR_BOOT__ = {...}</script>
 *        │
 *        └──────────────► 本模块读出它 → loadPluginGraph()（阶段 4 的装载器）
 *                              → 登记清单 → 重投插槽 → 界面出现插件贡献的面板
 * ```
 *
 * 于是"**不重新构建编辑器就装一个插件**"（#276 验收②）由**宿主**驱动，而不是靠测试脚本调 API。
 *
 * ## 为什么入口图里给的是 URL 而不是包名
 *
 * 浏览器原生 ESM **不解析裸包名**（#276 阶段 4 实测：`Failed to resolve module specifier`）——
 * 构建期能解析、运行期不能。所以宿主产出的是**浏览器能加载的 URL**
 * （生产下是产物路径，如 `/plugins/rotate.js`）。
 *
 * ## 三条纪律
 *
 * - **不信任注入内容**：`window.__EDITOR_BOOT__` 是外部输入，形状不对就当没有（返回 `null`），
 *   并在控制台说明——注入坏了不该让编辑器起不来；
 * - **不阻塞启动**：调用方不必 `await`（装载成功会经 `slots/changed` 自己重投界面）；
 * - **没有入口图是正常状态**：没装任何插件的编辑器与今天完全一样。
 */

/** 宿主注入的启动入口图（挂在 `window.__EDITOR_BOOT__`） */
export interface EditorBootGraph extends PluginEntryGraph
{
    /** 谁产出的（宿主版本 / 配置来源）；只用于诊断与日志 */
    readonly appliedBy?: string;
}

/** 注入挂在全局上的键名 */
export const EDITOR_BOOT_KEY = '__EDITOR_BOOT__';

/**
 * 从全局作用域读入口图（形状不对就当没有）。
 *
 * @param scope 全局作用域（默认 `globalThis`；测试可传一个假对象）
 * @returns 入口图；没注入或形状不合法时为 `null`
 */
export function readBootGraph(scope: object = globalThis): EditorBootGraph | null
{
    const raw = (scope as Record<string, unknown>)[EDITOR_BOOT_KEY];

    if (raw === undefined || raw === null) return null;

    if (typeof raw !== 'object')
    {
        console.warn(`[plugins] ${EDITOR_BOOT_KEY} 不是对象，已忽略`);

        return null;
    }

    const entries = (raw as { entries?: unknown }).entries;

    if (!Array.isArray(entries))
    {
        console.warn(`[plugins] ${EDITOR_BOOT_KEY}.entries 不是数组，已忽略`);

        return null;
    }

    const usable: PluginPackageEntry[] = [];

    for (const entry of entries)
    {
        const candidate = entry as Partial<PluginPackageEntry>;

        if (typeof candidate?.id !== 'string' || candidate.id.length === 0)
        {
            console.warn(`[plugins] ${EDITOR_BOOT_KEY} 里有一条没有 id 的条目，已跳过`);

            continue;
        }

        usable.push(candidate as PluginPackageEntry);
    }

    return {
        entries: usable,
        appliedBy: typeof (raw as { appliedBy?: unknown }).appliedBy === 'string'
            ? (raw as { appliedBy: string }).appliedBy
            : undefined,
    };
}

/**
 * 按宿主注入的入口图装载插件包（没有入口图时什么也不做）。
 *
 * @param scope 全局作用域（默认 `globalThis`；测试可传一个假对象）
 * @returns 每个条目的装载结果（没有入口图时为空数组）
 */
export async function installPluginsFromBoot(scope: object = globalThis): Promise<readonly PluginLoadOutcome[]>
{
    const graph = readBootGraph(scope);

    if (!graph || graph.entries.length === 0) return [];

    const outcomes = await loadPluginGraph(graph);
    const failed = outcomes.filter((outcome) => !outcome.loaded);

    for (const problem of failed)
    {
        console.error(`[plugins] 装载 ${problem.id} 失败：${problem.problems.join('；')}`);
    }

    return outcomes;
}
