/**
 * 插件 API 版本契约（issue #171）。
 *
 * ## 为什么需要它
 *
 * 插件声明"我依赖哪个版本的编辑器插件 API"，编辑器在**安装时**核对——不兼容就当场报错，
 * 并指出**要求什么、现在是什么**。没有这条契约时，插件与编辑器的失联只会在运行到一半时
 * 以某个看不懂的错误暴露（本仓 `docs/ARCHITECTURE_V2.md` §5.2 记着同一类问题：
 * `@feng3d/tsl`、`@feng3d/editor` 独立在外仓，与主仓 API 失联）。
 *
 * ## 判据（完整规则，不做半套 semver）
 *
 * 声明形如 `^1.2.3` / `~1.2.3` / `1.2.3`：
 *
 * | 写法 | 含义 |
 * |---|---|
 * | `^X.Y.Z` | 主版本相同，且当前版本 **≥** `X.Y.Z` |
 * | `~X.Y.Z` | 主版本与次版本都相同，且当前版本 **≥** `X.Y.Z` |
 * | `X.Y.Z` | **完全相同** |
 *
 * 刻意不支持范围表达式（`>=`、`||`、`*`）：编辑器侧的 API 只在主版本内保持兼容，
 * 一条窄而说得清的规则比一套半实现的 semver 好——后者会让"到底算不算兼容"变成玄学。
 *
 * **必须声明**：不声明视为不兼容。契约的意义就在于"有声明可核对"，
 * 允许省略等于给"忘了声明"开后门（那是运行期才炸的那种问题）。
 */

import type { EditorPluginManifest } from './types';

/**
 * 当前编辑器的**插件 API 版本**。
 *
 * 改动插件清单的形状（新增/删除/改名贡献点字段、改语义）时**必须**动它——
 * 那是唯一能告诉外部插件"我变了"的机制。
 */
export const EDITOR_PLUGIN_API_VERSION = '1.0.0';

/** 解析后的版本号 */
export interface ParsedVersion
{
    /** 主版本 */
    readonly major: number;

    /** 次版本 */
    readonly minor: number;

    /** 修订号 */
    readonly patch: number;
}

/** 版本核对结果 */
export interface ApiVersionCheck
{
    /** 是否兼容 */
    readonly compatible: boolean;

    /** 声明的写法（原样） */
    readonly declared: string | undefined;

    /** 当前编辑器 API 版本 */
    readonly current: string;

    /** 不兼容的原因（兼容时为 `undefined`）——**必须能直接说清"要什么、现在是什么"** */
    readonly reason?: string;
}

/** 版本声明：`^X.Y.Z` / `~X.Y.Z` / `X.Y.Z` */
const VERSION_PATTERN = /^(\^|~)?(\d+)\.(\d+)\.(\d+)$/;

/**
 * 解析版本声明。
 *
 * @param text 声明文本
 * @returns 解析结果；格式不合法时返回 `null`
 */
export function parseVersion(text: string): (ParsedVersion & { readonly caret: boolean; readonly tilde: boolean }) | null
{
    const matched = VERSION_PATTERN.exec(text.trim());
    if (!matched) return null;

    return {
        major: Number(matched[2]),
        minor: Number(matched[3]),
        patch: Number(matched[4]),
        caret: matched[1] === '^',
        tilde: matched[1] === '~',
    };
}

/**
 * 比较两个版本（只比数值）。
 *
 * @param a 版本 a
 * @param b 版本 b
 * @returns 负数表示 a < b，0 表示相等，正数表示 a > b
 */
function compare(a: ParsedVersion, b: ParsedVersion): number
{
    return (a.major - b.major) || (a.minor - b.minor) || (a.patch - b.patch);
}

/**
 * 核对一个插件声明的 API 版本。
 *
 * @param declared 清单里的 `apiVersion`（可以没写——那就不兼容，理由里会说清）
 * @returns 核对结果（含"要什么、现在是什么"的说明）
 */
export function checkApiVersion(declared: string | undefined): ApiVersionCheck
{
    const current = EDITOR_PLUGIN_API_VERSION;
    const currentParsed = parseVersion(current)!;

    if (declared === undefined)
    {
        return {
            compatible: false,
            declared,
            current,
            reason: `没有声明所依赖的编辑器插件 API 版本；当前编辑器 API 版本是 ${current}——`
                + '请加上 `apiVersion`（如 `apiVersion: \'^1.0.0\'`），否则无法核对兼容性',
        };
    }

    const wanted = parseVersion(declared);
    if (!wanted)
    {
        return {
            compatible: false,
            declared,
            current,
            reason: `版本声明 ${declared} 写法不合法；只支持 ^X.Y.Z / ~X.Y.Z / X.Y.Z（如 ^1.0.0）`,
        };
    }

    const order = compare(currentParsed, wanted);
    if (wanted.caret)
    {
        if (currentParsed.major !== wanted.major || order < 0)
        {
            return {
                compatible: false,
                declared,
                current,
                reason: `${declared} 要求主版本 ${wanted.major} 且不低于 ${wanted.major}.${wanted.minor}.${wanted.patch}，`
                    + `当前编辑器 API 版本是 ${current}`,
            };
        }
    }
    else if (wanted.tilde)
    {
        if (currentParsed.major !== wanted.major || currentParsed.minor !== wanted.minor || order < 0)
        {
            return {
                compatible: false,
                declared,
                current,
                reason: `${declared} 要求 ${wanted.major}.${wanted.minor}.x 且不低于 ${wanted.major}.${wanted.minor}.${wanted.patch}，`
                    + `当前编辑器 API 版本是 ${current}`,
            };
        }
    }
    else if (order !== 0)
    {
        return {
            compatible: false,
            declared,
            current,
            reason: `${declared} 要求版本**完全等于** ${wanted.major}.${wanted.minor}.${wanted.patch}，`
                + `当前编辑器 API 版本是 ${current}（想跟随主版本请写 ^${wanted.major}.${wanted.minor}.${wanted.patch}）`,
        };
    }

    return { compatible: true, declared, current };
}

/**
 * 断言一批插件都兼容当前 API 版本，任一个不兼容就抛出。
 *
 * 抛错而不是"跳过并警告"：装了不兼容的插件后，编辑器会在某个具体功能上以看不懂的方式出错；
 * 启动时一句「插件 X 要求 ^2.0.0，当前 1.0.0」比那种现场好得多。
 *
 * @param manifests 待安装的插件清单
 * @throws 有插件不兼容时抛出，错误信息里逐条列出插件 id 与原因
 */
export function assertPluginApiVersions(manifests: readonly EditorPluginManifest[]): void
{
    const problems: string[] = [];

    for (const manifest of manifests)
    {
        const check = checkApiVersion(manifest.apiVersion);
        if (!check.compatible) problems.push(`${manifest.id}：${check.reason}`);
    }

    if (problems.length > 0)
    {
        throw new Error(`插件与编辑器 API 版本不兼容：\n  - ${problems.join('\n  - ')}`);
    }
}
