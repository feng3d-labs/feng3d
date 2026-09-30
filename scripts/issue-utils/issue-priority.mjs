/**
 * issue 优先级标签的判定逻辑（纯函数，便于离线测试）。
 *
 * 规范见 `docs/ISSUE_PRIORITY.md`：每条 issue 必须**恰好**带一个优先级标签。
 * 这份文件只做判定与渲染，不做 IO——拉取真实数据由 `scripts/check-issue-priority.mjs`
 * 负责，测试则直接 import 这里的函数（见 `test/IssuePriority.spec.ts`）。
 */

/** 优先级标签的前缀 */
export const PRIORITY_PREFIX = '优先级-';

/** 四档，顺序即强弱（报告里按这个顺序排） */
export const PRIORITY_LEVELS = ['优先级-阻塞', '优先级-高', '优先级-中', '优先级-低'];

/** 从 issue 的 labels 里取出名字（GitHub 有时给对象、有时给字符串） */
export function labelNames(labels)
{
    if (!Array.isArray(labels)) return [];

    return labels
        .map((v) => (typeof v === 'string' ? v : v && v.name))
        .filter((v) => typeof v === 'string' && v.length > 0);
}

/** 简短标识：`#123 标题` */
function describe(issue)
{
    const number = issue && issue.number !== undefined ? `#${issue.number}` : '(无编号)';
    const title = issue && issue.title ? String(issue.title) : '(无标题)';

    return `${number} ${title}`;
}

/**
 * 判定一批 issue 的优先级标签是否合规。
 *
 * 三类问题分别记录（都用 `#编号 标题` 描述，便于直接拿去修）：
 * - `missing`：一个优先级标签都没有；
 * - `duplicated`：带了多个优先级标签（档位自相矛盾）；
 * - `unknown`：带了 `优先级-` 前缀但不是四档之一（多半是拼错，或新档次没进规范）。
 *
 * @param issues issue 列表（GitHub REST 的形态：`{ number, title, labels }`）
 * @returns 判定结果；`ok` 为 `true` 表示全部合规
 */
export function evaluateIssuePriorities(issues)
{
    const list = Array.isArray(issues) ? issues : [];
    const missing = [];
    const duplicated = [];
    const unknown = [];
    const distribution = {};

    for (const issue of list)
    {
        const priorities = labelNames(issue.labels).filter((name) => name.startsWith(PRIORITY_PREFIX));

        if (priorities.length === 0)
        {
            missing.push(describe(issue));
            continue;
        }

        if (priorities.length > 1)
        {
            duplicated.push(`${describe(issue)} → ${priorities.join(' + ')}`);
            continue;
        }

        const level = priorities[0];

        if (!PRIORITY_LEVELS.includes(level))
        {
            unknown.push(`${describe(issue)} → ${level}`);
            continue;
        }

        distribution[level] = (distribution[level] || 0) + 1;
    }

    // 未知档位不计入分布，同样不算"合规"
    const ok = missing.length === 0 && duplicated.length === 0 && unknown.length === 0;

    return {
        ok,
        total: list.length,
        missing,
        duplicated,
        unknown,
        distribution,
    };
}

/**
 * 渲染成给人看的文本。
 *
 * @param result `evaluateIssuePriorities` 的返回值
 * @param options.source 数据来源的描述（如 `GitHub feng3d-labs/feng3d` 或文件名）
 */
export function formatPriorityReport(result, options = {})
{
    const lines = [];
    const source = options.source ? `（${options.source}）` : '';

    lines.push(`issue 优先级检查${source}：开放 ${result.total} 条`);

    for (const level of PRIORITY_LEVELS)
    {
        lines.push(`  ${level}: ${result.distribution[level] || 0}`);
    }

    if (result.ok)
    {
        lines.push('✅ 全部 issue 都恰好带一个优先级标签');

        return lines;
    }

    lines.push('❌ 优先级标签不合规：');

    if (result.missing.length > 0)
    {
        lines.push(`  ${result.missing.length} 条**没有任何优先级标签**（按 docs/ISSUE_PRIORITY.md §2 定级后补上）：`);
        result.missing.forEach((v) => lines.push(`    ${v}`));
    }

    if (result.duplicated.length > 0)
    {
        lines.push(`  ${result.duplicated.length} 条带了**多个**优先级标签（档位自相矛盾，只保留一个）：`);
        result.duplicated.forEach((v) => lines.push(`    ${v}`));
    }

    if (result.unknown.length > 0)
    {
        lines.push(`  ${result.unknown.length} 条带了**非规范档位**（要么拼错，要么新档次没先进 docs/ISSUE_PRIORITY.md）：`);
        result.unknown.forEach((v) => lines.push(`    ${v}`));
    }

    return lines;
}