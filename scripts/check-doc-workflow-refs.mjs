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

// ---------- 第二组：§2.1 步骤表的每条命令真的在 CI 里 ----------
//
// `docs/CI.md` §2.1 断言"第 N 步跑某命令"。若某条命令其实**已移出 CI**，读者会以为它守着规范——
// 而这正是 §15 元规则要防的"门禁空转"。
//
// **判据必须认 `prelint:ci` 链路**：第 22 步（`check-register-logic-factory.mjs`）在 `ci.yml` 里
// 搜不到，但它经由 `npm run lint:ci` → `prelint:ci` 真的在 CI 里跑（表里也写明了这一点）。
// 不认这条链路就会误报一条**本来正确**的文档。
const packageJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const prelint = packageJson.scripts['prelint:ci'] ?? '';
const ciYml = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');
const ciMd = readFileSync(resolve(ROOT, 'docs/CI.md'), 'utf8').split(/\r?\n/);

const tableStart = ciMd.findIndex((line) => /^###\s*2\.1\s/.test(line));
const tableEnd = ciMd.findIndex((line, index) => index > tableStart && /^###\s/.test(line));
let stepCount = 0;

for (let index = tableStart; index < tableEnd; index += 1)
{
    const matched = ciMd[index].match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|/);

    if (!matched) continue;

    stepCount += 1;

    const command = matched[3].trim();
    // 去掉参数尾部（`--force --no-build` 在 yml 里可能顺序不同）
    const probe = command.split(/\s+--/)[0];

    if (!ciYml.includes(probe) && !prelint.includes(probe))
    {
        problems.push(`docs/CI.md:${index + 1} 第 ${matched[1]} 步的命令 \`${command}\` 在 ci.yml 与 prelint:ci 里都找不到`);
    }
}

if (stepCount < 15)
{
    problems.push(`§2.1 只解析出 ${stepCount} 步（预期 ≥ 15）——表格格式变了或正则写错，判据会平凡通过`);
}

notes.push(`§2.1 步骤表：${stepCount} 步，命令都在 ci.yml 或 prelint:ci 链路上`);

// ---------- 第三组：文档里"当前有多少条"的断言 ----------
//
// **只判两处**，理由：泛化地判"文档里所有数字"必然误报 —— 文档里绝大多数数字是**历史读数**
// （"当时 249 个测试文件"、"第 22 个包"）或**语境相关的计数**（"发布 21 个公共包"），
// 它们**不该**等于当前值。这两处则是明确的**现状断言**，且都真的漂过：
//   · `docs/CI.md` 说 `gates:host`「共 N 条」—— 第 69 轮加了一个脚本就让 N 差 1；
//   · `AGENTS.md` 说 `prelint:ci` 钩子跑 N 条 —— 实测 6 条，而原文只列了 2 条（漏列型腐化）。
const gatesHostCount = (packageJson.scripts['gates:host'] ?? '').split(' && ').length;
const prelintCount = prelint.split(' && ').length;
const ciMdText = ciMd.join('\n');

{
    // **扫全部匹配**（原来只取第一处）：\`gates:host\` 的条数在文档里出现在不止一处 ——
    // \`:867\` 的"共 N 条"与 \`:888\` 的"N 条全绿"。只匹配第一处会漏掉后者（实测漏过）。
    const found = [
        ...ciMdText.matchAll(/共 \*\*(\d+) 条\*\*[^\n]*gates:host|gates:host[^\n]*共 \*\*(\d+) 条\*\*/g),
        ...ciMdText.matchAll(/(\d+) 条全绿/g),
    ];

    if (found.length === 0)
    {
        problems.push('docs/CI.md 里找不到 gates:host 的条数断言——措辞变了，判据会平凡通过');
    }

    let consistent = 0;

    for (const matched of found)
    {
        const stated = Number(matched[1] ?? matched[2]);

        if (stated !== gatesHostCount)
        {
            problems.push(`docs/CI.md 说 gates:host 是 ${stated} 条，而 package.json 实际是 ${gatesHostCount} 条`);
        }
        else
        {
            consistent += 1;
        }
    }

    if (consistent > 0 && consistent === found.length) notes.push(`gates:host 条数断言一致（${consistent} 处）`);
}

{
    const agents = readFileSync(resolve(ROOT, 'AGENTS.md'), 'utf8');
    const matched = agents.match(/prelint:ci` 钩子还会先跑 (\d+) 条/);

    if (!matched)
    {
        problems.push('AGENTS.md 里找不到 prelint:ci 的「先跑 N 条」断言——措辞变了，判据会平凡通过');
    }
    else if (Number(matched[1]) !== prelintCount)
    {
        problems.push(`AGENTS.md 说 prelint:ci 先跑 ${matched[1]} 条，而 package.json 实际是 ${prelintCount} 条`);
    }
    else
    {
        notes.push(`prelint:ci 条数断言一致（${prelintCount}）`);
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
