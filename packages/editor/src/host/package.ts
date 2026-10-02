/**
 * 插件包的**三端声明**契约（#276 阶段 3）。
 *
 * ## 为什么要有这一层
 *
 * 目标形态是**三端包**：同一份插件包在三处各有一个入口——
 *
 * | 端 | 入口 | 形态 | 现状 |
 * |---|---|---|---|
 * | 编辑器宿主（Node） | `"."` | cordis 插件 / 宿主服务 | 宿主进程本身待 #272 |
 * | 编辑器界面（Web） | `"./client"` | 贡献点清单 + 插槽 / Vue 组件 | 已成型 |
 * | 游戏项目端 | `"./runtime"` | 只依赖引擎 API 的运行期行为 | 本阶段立起契约与门禁 |
 *
 * 这一层把"三端声明"变成**可校验的数据**，而不是靠文档约定：
 * 声明与 `exports` 对不上、漏了 `apiVersion`、声明了 `./runtime` 却没有对应文件——
 * 都能在装载前一次性说清（`checkPluginPackage`）。配套的**依赖边界**门禁是
 * `scripts/check-runtime-half-deps.mjs`（runtime 端只能依赖引擎 API）。
 *
 * ## 判据（刻意窄，不做半套约定）
 *
 * - **`apiVersion` 必须声明**：与 `./client` 同一套核对规则（见 `../plugins/apiVersion`）；
 * - **三端入口以 `exports` 为准**：`"."` / `"./client"` / `"./runtime"`；
 *   这里的 `halves` 是**可选的自述**，写了就要求与 `exports` 一致（不一致即报错，
 *   避免"文档说三端、实际只有两端"）；
 * - **不要求三端齐全**：只有界面贡献的插件可以不写 `./runtime`；但**只要引入了新的 `__type__`，
 *   第三端就不是可选项**（编辑格式 = 运行格式），这条由 review 与 `docs` 守着，脚本不猜。
 */

import { checkApiVersion } from '../plugins/apiVersion';
import type { EditorPluginManifest } from '../plugins/types';

/** 三端的名字（顺序即文档里的叙述顺序：宿主 → 界面 → 游戏端） */
export const PLUGIN_HALVES = ['host', 'client', 'runtime'] as const;

/** 插件的一端 */
export type PluginHalf = (typeof PLUGIN_HALVES)[number];

/** 每一端在 `exports` 里的子路径（宿主端是包根） */
export const HALF_ENTRY: Readonly<Record<PluginHalf, string>> = {
    host: '.',
    client: './client',
    runtime: './runtime',
};

/** 插件包 `package.json` 里本仓认得的字段（其余字段不参与判定） */
export interface EditorPluginPackageJson
{
    /** 包名 */
    readonly name: string;

    /** 包版本 */
    readonly version?: string;

    /** 导出表（三端入口以它为准） */
    readonly exports?: Readonly<Record<string, unknown>>;

    /** 本仓的插件元数据（可选；写了就与 `exports` 互相校验） */
    readonly feng3dEditor?: {
        /** 所依赖的编辑器插件 API 版本（同清单的 `apiVersion` 规则） */
        readonly apiVersion: string;

        /** 三端自述（可选）：键是端名，值是该端的入口子路径 */
        readonly halves?: Partial<Record<PluginHalf, string>>;
    };
}

/** 一个插件包的三端入口解析结果 */
export interface PluginHalfEntries
{
    /** 声明了（且 `exports` 里确实有）的端 */
    readonly declared: readonly PluginHalf[];

    /** 端 → `exports` 里的子路径 */
    readonly entries: Readonly<Partial<Record<PluginHalf, string>>>;
}

/**
 * 从插件包声明里解析三端入口。
 *
 * **以 `exports` 为准**：只认 `exports` 里真实存在的子路径，自述（`feng3dEditor.halves`）
 * 不参与"有没有这一端"的判定——它只在 {@link checkPluginPackage} 里被用来查不一致。
 *
 * @param pkg 插件包声明
 * @returns 已声明的端与它们的子路径
 */
export function resolveHalfEntries(pkg: EditorPluginPackageJson): PluginHalfEntries
{
    const declared: PluginHalf[] = [];
    const entries: Partial<Record<PluginHalf, string>> = {};

    for (const half of PLUGIN_HALVES)
    {
        const entry = HALF_ENTRY[half];

        if (pkg.exports !== undefined && entry in pkg.exports)
        {
            declared.push(half);
            entries[half] = entry;
        }
    }

    return { declared, entries };
}

/**
 * 校验一个插件包的三端声明。
 *
 * @param pkg 插件包声明（通常是 `JSON.parse(package.json)` 的结果）
 * @returns 问题清单（空数组 = 通过）；每条都写成"哪里不对、怎么改"
 */
export function checkPluginPackage(pkg: EditorPluginPackageJson): readonly string[]
{
    const problems: string[] = [];
    const { declared } = resolveHalfEntries(pkg);
    const meta = pkg.feng3dEditor;

    if (meta === undefined)
    {
        problems.push('缺少 `feng3dEditor` 字段：插件包必须声明所依赖的编辑器插件 API 版本'
            + '（形如 `"feng3dEditor": { "apiVersion": "^1.0.0" }`）');

        return problems;
    }

    if (typeof meta.apiVersion !== 'string' || meta.apiVersion.trim().length === 0)
    {
        problems.push('`feng3dEditor.apiVersion` 必须是非空字符串（如 `^1.0.0`）');
    }

    // 自述与 exports 必须一致（避免"文档说三端、实际只有两端"）
    for (const [half, entry] of Object.entries(meta.halves ?? {}))
    {
        if (!PLUGIN_HALVES.includes(half as PluginHalf))
        {
            problems.push(`\`feng3dEditor.halves\` 里有未知的端 ${half}（只有 ${PLUGIN_HALVES.join(' / ')}）`);
            continue;
        }

        const expected = HALF_ENTRY[half as PluginHalf];

        if (entry !== expected)
        {
            problems.push(`\`feng3dEditor.halves.${half}\` 写的是 ${entry}，但这一端的入口固定是 ${expected}`);
        }

        if (!declared.includes(half as PluginHalf))
        {
            problems.push(`\`feng3dEditor.halves.${half}\` 声明了 ${half} 端，但 \`exports\` 里没有 ${expected}`);
        }
    }

    if (declared.length === 0)
    {
        problems.push('`exports` 里没有任何一端（至少要有 `"."`（宿主）/ `"./client"`（界面）/ `"./runtime"`（游戏端）之一）');
    }

    return problems;
}

/**
 * 把插件包声明接上清单的 API 版本核对。
 *
 * 宿主装载插件包时的第一步：先校验包声明（{@link checkPluginPackage}），
 * 再把 `apiVersion` 交给 `checkApiVersion` 核对——
 * **两处用的是同一条规则**，不会出现"包声明过了、清单没过"这种半套兼容。
 *
 * @param pkg 插件包声明
 * @returns 问题清单（空数组 = 通过）
 */
export function checkPluginPackageForInstall(pkg: EditorPluginPackageJson): readonly string[]
{
    const problems = [...checkPluginPackage(pkg)];

    if (pkg.feng3dEditor?.apiVersion !== undefined)
    {
        const check = checkApiVersion(pkg.feng3dEditor.apiVersion);

        if (!check.compatible) problems.push(`\`feng3dEditor.apiVersion\` 不兼容：${check.reason}`);
    }

    return problems;
}

/** 清单里用于宿主侧展示的最小形状（宿主不需要界面字段） */
export type PluginManifestSummary = Pick<EditorPluginManifest, 'id' | 'name' | 'apiVersion'>;

/**
 * 取清单的宿主侧摘要（宿主日志 / 列表用）。
 *
 * @param manifest 插件清单
 * @returns 只含宿主关心的字段
 */
export function summarizeManifest(manifest: EditorPluginManifest): PluginManifestSummary
{
    return { id: manifest.id, name: manifest.name, apiVersion: manifest.apiVersion };
}
