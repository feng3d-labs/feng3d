/**
 * 漏标检测：列出全部开放 issue，任何一条**没有**优先级标签（或带了多个 / 非规范档位）
 * 都以非零码退出并逐条列出。规范见 `docs/ISSUE_PRIORITY.md`。
 *
 * 用法：
 *   node scripts/check-issue-priority.mjs                  # 走 GitHub API（需要 GITHUB_TOKEN）
 *   node scripts/check-issue-priority.mjs --from <file>    # 从本地 JSON 读（离线调试 / 测试）
 *   node scripts/check-issue-priority.mjs --number 123     # 只检查单个 issue（给 issue 事件的 Action 用）
 *
 * 为什么用 `fetch` 而不是 `gh api`：
 *   本仓库的运行环境（含 CI 与受限沙箱）里，子进程的 stdio 管道可能不可用
 *   （`spawn` + `stdio: 'pipe'` 会 EPERM）。用 `fetch` + `GITHUB_TOKEN` 既避开子进程，
 *   也让凭据来源显式可控（环境变量，而不是依赖 `gh` 的登录态）。
 */
import { readFileSync } from 'node:fs';
import { evaluateIssuePriorities, formatPriorityReport } from './issue-utils/issue-priority.mjs';

const REPO = process.env.GITHUB_REPOSITORY || 'feng3d-labs/feng3d';
const API = `https://api.github.com/repos/${REPO}/issues`;

function argValue(name)
{
    const i = process.argv.indexOf(name);

    return i >= 0 ? process.argv[i + 1] : undefined;
}

/** 从 GitHub 拉全部开放 issue（跳过 PR——REST 的 issues 端点会把 PR 也列出来） */
async function fetchOpenIssues()
{
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

    if (!token)
    {
        throw new Error('缺少 GITHUB_TOKEN（或 GH_TOKEN）环境变量；离线调试请用 --from <file>');
    }

    const issues = [];

    for (let page = 1; page <= 20; page++)
    {
        const url = `${API}?state=open&per_page=100&page=${page}`;
        let res;

        // 网络抖动是常态（尤其是走代理的环境），重试几次再放弃
        for (let attempt = 0; ; attempt++)
        {
            res = await fetch(url, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'feng3d-check-issue-priority',
                },
            });

            if (res.ok || attempt >= 4) break;
            await new Promise((r) => setTimeout(r, 1500));
        }

        if (!res.ok) throw new Error(`拉取 ${url} 失败：HTTP ${res.status}`);

        const batch = await res.json();

        if (!Array.isArray(batch) || batch.length === 0) break;

        // issues 端点混有 PR，用 pull_request 字段剔除
        issues.push(...batch.filter((v) => !v.pull_request));
    }

    return issues;
}

/** 只拉一个 issue（issue 事件的 Action 用：新开的 issue 只需要检查它自己） */
async function fetchOneIssue(number)
{
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

    if (!token)
    {
        throw new Error('缺少 GITHUB_TOKEN（或 GH_TOKEN）环境变量');
    }

    const url = `${API}/${number}`;
    let res;

    for (let attempt = 0; ; attempt++)
    {
        res = await fetch(url, {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'feng3d-check-issue-priority',
            },
        });

        if (res.ok || attempt >= 4) break;
        await new Promise((r) => setTimeout(r, 1500));
    }

    if (!res.ok) throw new Error(`拉取 ${url} 失败：HTTP ${res.status}`);

    return [await res.json()];
}

function readIssuesFromFile(file)
{
    const data = JSON.parse(readFileSync(file, 'utf8'));

    // 允许两种形态：直接的数组，或 GitHub 的分页响应包了一层
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.issues)) return data.issues;

    throw new Error(`${file} 里没有找到 issue 数组（期望顶层数组，或 { issues: [...] }）`);
}

const from = argValue('--from');
const number = argValue('--number');
let issues;
let source;

if (number)
{
    issues = await fetchOneIssue(number);
    source = `GitHub ${REPO} #${number}`;
}
else if (from)
{
    issues = readIssuesFromFile(from).filter((v) => !v.pull_request);
    source = from;
}
else
{
    issues = await fetchOpenIssues();
    source = `GitHub ${REPO}`;
}

const result = evaluateIssuePriorities(issues);

formatPriorityReport(result, { source }).forEach((line) => console.log(line));

if (!result.ok)
{
    console.log('\n按 docs/ISSUE_PRIORITY.md §2 的三步给上面这些 issue 定级，然后重跑本脚本。');
    process.exit(1);
}