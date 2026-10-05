#!/usr/bin/env node
/**
 * **文档里的 `ci.yml:NN` 引用必须指向真实存在的行**（文档腐化清查，第 69 轮）。
 *
 * ## 它防的是什么
 *
 * `docs/ARCHITECTURE_V2.md` / `AGENTS.md` 用 `ci.yml:NN` 标注"这条规范由 CI 的哪一行守着"。
 * 行号是**最脆的引用形式**：上面插一行，下面全部漂一格 —— 而读者点进去会看到**另一条命令**，
 * 于是形成"以为某条门禁在 CI 上跑、其实没有"的假象。这正是 `AGENTS.md` §15 元规则要防的
 * 「门禁看起来在工作、其实空转」。
 *
 * 本批实测就抓到 2 处漂移（R3 差 1 行、R9 差 2 行，都指到了注释上）。
 *
 * ## 判据（刻意**宽松**）
 *
 * 只判**硬错误**：**越界**（文件根本没那么多行）与**空行**。
 * **不判**"指到注释" —— 有的引用**有意**指注释（例如 R8 用 `ci.yml:261` 说明
 * "e2e 只跑 `test:e2e:editor`"，那一行的内容正是它的论据）。把这类也判红会逼人删掉有信息的引用。
 *
 * 另有**空转自证**：扫到的引用数必须够多（否则文件改名/正则写错都会让判据平凡通过）。
 *
 * 离线可跑。
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

/** 查引用的文档（与 `ci.yml` 里的行号引用有关的那几份） */
const DOCS = [
    'AGENTS.md',
    'docs/CI.md',
    'docs/ARCHITECTURE_V2.md',
    'packages/editor/AGENTS.md',
    'packages/editor/docs/ARCHITECTURE.md',
];

/** 被引用的 workflow */
const WORKFLOWS = ['ci.yml', 'release.yml', 'issue-priority.yml'];

const problems = [];
const notes = [];
let total = 0;

for (const workflow of WORKFLOWS)
{
    const path = resolve(ROOT, '.github/workflows', workflow);

    if (!existsSync(path)) continue;

    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    const pattern = new RegExp(`${workflow.replace('.', '\\.')}:(\\d+)`, 'g');

    for (const doc of DOCS)
    {
        if (!existsSync(resolve(ROOT, doc))) continue;

        const text = readFileSync(resolve(ROOT, doc), 'utf8');

        for (const [index, line] of text.split(/\r?\n/).entries())
        {
            for (const matched of line.matchAll(pattern))
            {
                total += 1;

                const target = Number(matched[1]);
                const content = lines[target - 1];

                if (content === undefined)
                {
                    problems.push(`${doc}:${index + 1} 引用了 ${workflow}:${target}，而该文件只有 ${lines.length} 行`);
                }
                else if (content.trim() === '')
                {
                    problems.push(`${doc}:${index + 1} 引用了 ${workflow}:${target}，而那一行是**空行**`);
                }
            }
        }
    }
}

// ---------- 空转自证 ----------
if (total < 10)
{
    problems.push(`只扫到 ${total} 处行号引用（预期 ≥ 10）——扫描器坏了或文档被改名，判据会平凡通过`);
}

console.log('--- 文档里的 workflow 行号引用 ---');
console.log(`  扫描 ${DOCS.length} 份文档 × ${WORKFLOWS.length} 个 workflow，共 ${total} 处行号引用`);

for (const note of notes) console.log(`  ℹ ${note}`);

if (problems.length === 0)
{
    console.log(`✅ 文档里的 ${total} 处 workflow 行号引用都指向真实存在的行`);
    process.exit(0);
}

console.error(`\n❌ 文档里有 ${problems.length} 处行号引用指向空行或越界（读者点进去会看到别的东西）：`);
problems.forEach((one) => console.error(`  · ${one}`));
console.error('\n（只判"空行/越界"这类硬错误；**有意指向注释**的引用不算错——见本脚本文件头。）');

process.exit(1);
