import { checkApiVersion } from '../apiVersion';
import { installPlugins } from '../enable';
import { revertPluginContributions } from '../install';
import { getPlugins, unregisterPlugins } from '../registry';
import { reproject } from '../slots/install';
import { clearPluginSwitch } from '../state';
import { getClientHalfImporter } from './moduleTable';
import type { ClientHalfModule, PluginEntryGraph, PluginLoadOutcome, PluginPackageEntry } from './types';
import type { EditorPluginManifest } from '../types';

/**
 * 运行时装载器（#276 阶段 4）：把**构建图之外**的插件包装进编辑器。
 *
 * ## 装载一个包做了什么
 *
 * 1. 经**模块表**导入它的 `"./client"` 半（默认 `import('<id>/client')`）；
 * 2. 取清单（约定：具名 `manifest` 或默认导出），并**核三件事**——
 *    清单 id 与条目 id 一致、`apiVersion` 与当前编辑器兼容、条目声明里确实有 `client` 端；
 * 3. 登记进清单（层按**条目给的** `layer` 登记，缺省 `plugin`）→ 引擎侧贡献点按启用状态落地；
 * 4. **重投插槽** → 界面跟着变（`MainLayout` / `SceneView` 读的是座位）。
 *
 * ## 两条纪律
 *
 * - **装载失败是数据，不是异常**：任何一步失败都返回 `{ loaded: false, problems: [...] }`，
 *   编辑器不会因为一个坏插件包而崩（与"坏 patch 不会拖垮编辑器"同一条纪律）；
 * - **失败不留半成品**：清单登记本身是事务性的（`registerPlugins` 先校验后提交），
 *   校验不过的包根本进不了注册表。
 *
 * ## 卸载为什么是同步的
 *
 * 卸载只动编辑器自己的状态（清单 / 引擎注册表 / 插槽），没有 I/O；
 * 真正的"卸载模块"在 ESM 里也不存在（模块图只增不减）——这是运行时装载的已知边界，
 * 所以契约写成"**卸载 = 撤销它的贡献点**"，而不是"把模块从内存里拿掉"。
 */

/** 已装载的插件包（lazy：模块顶层不建对象，对齐 R2） */
let loadedPackages: Map<string, { readonly manifest: EditorPluginManifest; readonly specifier: string }> | null = null;

/**
 * 取已装载表。
 *
 * @returns 包 id → 装载记录
 */
function getLoaded(): Map<string, { readonly manifest: EditorPluginManifest; readonly specifier: string }>
{
    if (!loadedPackages) loadedPackages = new Map();

    return loadedPackages;
}

/**
 * 从模块里取清单（具名 `manifest` 优先，其次默认导出）。
 *
 * @param module client 半模块
 * @returns 清单；模块没按约定导出时返回 `null`
 */
function pickManifest(module: unknown): EditorPluginManifest | null
{
    if (module === null || typeof module !== 'object') return null;

    const shaped = module as ClientHalfModule;

    if (shaped.manifest !== undefined) return shaped.manifest;
    if (shaped.default !== undefined) return shaped.default;

    return null;
}

/**
 * 装载一个插件包。
 *
 * 幂等：同 id 重复装载直接返回"已装载"，不会重复登记清单、也不会重复重投插槽。
 *
 * @param entry 装载条目（来自入口图）
 * @returns 装载结果（失败时 `problems` 说明原因）
 */
export async function loadPluginPackage(entry: PluginPackageEntry): Promise<PluginLoadOutcome>
{
    const already = getLoaded().get(entry.id);

    if (already) return { id: entry.id, loaded: true, problems: [] };

    // 条目自述里如果没有 client 端，就不该按界面插件装（这条能挡住"把只有 runtime 的包装进来"）
    if (entry.halves !== undefined && !entry.halves.includes('client'))
    {
        return {
            id: entry.id,
            loaded: false,
            problems: [`${entry.id} 的声明里没有 client 端（它不贡献界面），不能按界面插件装载`],
        };
    }

    const specifier = entry.clientSpecifier ?? `${entry.id}/client`;

    let module: unknown;

    try
    {
        module = await getClientHalfImporter()(specifier);
    }
    catch (error)
    {
        return {
            id: entry.id,
            loaded: false,
            problems: [`导入 client 半失败（${specifier}）：${(error as { message?: string })?.message ?? String(error)}`],
        };
    }

    const manifest = pickManifest(module);

    if (!manifest)
    {
        return {
            id: entry.id,
            loaded: false,
            problems: [`${specifier} 没有导出清单：client 半必须具名导出 \`manifest\`（或默认导出清单）`],
        };
    }

    const problems: string[] = [];

    if (manifest.id !== entry.id)
    {
        problems.push(`清单 id（${manifest.id}）与装载条目 id（${entry.id}）不一致——装错包的典型症状`);
    }

    const version = checkApiVersion(manifest.apiVersion);

    if (!version.compatible) problems.push(version.reason ?? 'API 版本不兼容');

    if (entry.apiVersion !== undefined)
    {
        const declared = checkApiVersion(entry.apiVersion);

        if (!declared.compatible) problems.push(`包声明不兼容：${declared.reason}`);
    }

    if (problems.length > 0) return { id: entry.id, loaded: false, problems };

    try
    {
        // 事务性：同层冲突 / 版本问题都会在这里抛出，且注册表保持原样。
        // **层按条目给的登记**（#272 P3：内置 < 插件 < 用户）——层由宿主判定并随入口图传下来，
        // 这里不猜。缺省 `plugin` 是兼容：宿主没给层时行为与以前完全一致
        installPlugins([manifest], entry.layer ?? 'plugin');
    }
    catch (error)
    {
        return {
            id: entry.id,
            loaded: false,
            problems: [`登记清单失败：${(error as { message?: string })?.message ?? String(error)}`],
        };
    }

    getLoaded().set(entry.id, { manifest, specifier });

    // 界面跟着变：清单变了 → 重投插槽（`MainLayout` / `SceneView` 读座位）
    reproject();

    return { id: entry.id, loaded: true, problems: [] };
}

/**
 * 卸载一个插件包：撤销它的贡献点（清单 / 引擎注册表 / 插槽）。
 *
 * **顺序要紧**：先撤引擎侧贡献（此时清单里还有它，取得到它的贡献点），
 * 再移除清单、清用户开关、重投插槽。
 *
 * ESM 里没有"卸载模块"，所以卸载的语义是"**撤销它的贡献点**"——
 * 模块本身留在模块图里（这是运行时装载的已知边界，文档里写明了）。
 *
 * @param id 插件包 id
 * @returns 是否确实卸载了（没装过返回 `false`）
 */
export function unloadPluginPackage(id: string): boolean
{
    if (!getLoaded().has(id)) return false;

    const manifests = getPlugins().filter((manifest) => manifest.id === id);

    revertPluginContributions(manifests);
    unregisterPlugins([id]);
    clearPluginSwitch(id);
    getLoaded().delete(id);
    reproject();

    return true;
}

/**
 * 已装载的插件包 id（诊断 / 测试用）。
 *
 * @returns 包 id 列表（按装载顺序）
 */
export function getLoadedPackages(): readonly string[]
{
    return [...getLoaded().keys()];
}

/**
 * 按入口图装载一批插件包（**逐个独立**：一个坏包不影响其它包）。
 *
 * @param graph 入口图
 * @returns 每个条目的装载结果（顺序与入口图一致）
 */
export async function loadPluginGraph(graph: PluginEntryGraph): Promise<readonly PluginLoadOutcome[]>
{
    const outcomes: PluginLoadOutcome[] = [];

    for (const entry of graph.entries)
    {
        outcomes.push(await loadPluginPackage(entry));
    }

    return outcomes;
}

/** 复位装载器状态（**只给单元测试**：模块级状态要能互相隔离） */
export function resetPluginLoader(): void
{
    loadedPackages = null;
}
