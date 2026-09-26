/**
 * 根据发布报告生成 GitHub Release 的正文（Markdown）。
 *
 * 为什么需要它：用 `--bump-all` 发布时各包版本号互不相同
 * （`feng3d@0.9.1`、`@feng3d/math@0.8.5`、`@feng3d/webgpu@0.6.1`…），
 * 而 tag 只有一个（如 `v0.6.1`）。只看 Release 页面的标题，没人知道这批
 * 究竟发了哪些版本、各自为什么是这个号。这里把发布报告翻译成版本台账。
 *
 * 本文件只放纯逻辑（便于单元测试），命令行入口见 release-notes-cli.mjs。
 */

/** Markdown 表格单元格里的竖线会破坏列结构，必须转义 */
function escapeCell(text)
{
    return String(text ?? '').replace(/\|/g, '\\|').trim();
}

/**
 * 由报告生成版本台账 Markdown。
 *
 * @param {object} report release-packages.mjs 写出的报告
 * @returns {string} Markdown 正文
 */
export function buildNotes(report)
{
    const published = report?.published ?? [];
    const lines = [];

    if (published.length === 0)
    {
        lines.push('本次没有包被发布（版本均已存在，或全部被跳过）。');
        lines.push('');

        return lines.join('\n');
    }

    const firstPublish = published.filter((p) => p.isFirstPublish);
    lines.push(`本次将 **${published.length}** 个子包发布到 npm。`);
    lines.push('');
    lines.push('| 包 | 版本 | 版本来源 |');
    lines.push('|---|---|---|');

    for (const pkg of published)
    {
        const marks = [];
        if (pkg.isFirstPublish) marks.push('**首次发布**');
        marks.push(escapeCell(pkg.reason));

        lines.push(`| \`${pkg.name}\` | \`${pkg.version}\` | ${marks.filter(Boolean).join('；')} |`);
    }

    lines.push('');
    if (firstPublish.length > 0)
    {
        lines.push(`其中首次发布的有 ${firstPublish.length} 个：${firstPublish.map((p) => `\`${p.name}\``).join('、')}`);
        lines.push('');
    }

    lines.push('安装：');
    lines.push('');
    lines.push('```bash');
    lines.push(`npm i ${published.map((p) => `${p.name}@${p.version}`).join(' ')}`);
    lines.push('```');
    lines.push('');

    return lines.join('\n');
}

/**
 * 取 GitHub 自动生成的 release notes（PR / 提交归类）。
 *
 * 失败时返回空串——自动说明是锦上添花，不该因为它让发布流程失败。
 *
 * @param {{ owner: string, repo: string, tag: string, token: string }} options 参数
 * @returns {Promise<string>} 自动生成的 Markdown，取不到则为空串
 */
export async function fetchGeneratedNotes(options)
{
    const { owner, repo, tag, token } = options;
    if (!owner || !repo || !tag || !token) return '';

    try
    {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/generate-notes`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'feng3d-release-notes',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tag_name: tag }),
        });

        if (!response.ok) return '';

        const json = await response.json();

        return typeof json.body === 'string' ? json.body : '';
    }
    catch
    {
        return '';
    }
}

/**
 * 组装完整正文：版本台账 + 自动变更说明。
 *
 * @param {object} report 发布报告
 * @param {{ owner?: string, repo?: string, tag?: string, token?: string, withGenerated?: boolean }} options 选项
 * @returns {Promise<string>} 完整 Markdown
 */
export async function composeReleaseNotes(report, options = {})
{
    let notes = buildNotes(report);

    if (!options.withGenerated) return notes;

    const generated = await fetchGeneratedNotes(options);
    notes += generated.trim()
        ? `\n---\n\n${generated.trim()}\n`
        : '\n---\n\n（未能生成自动变更说明）\n';

    return notes;
}
