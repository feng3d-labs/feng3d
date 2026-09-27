/**
 * R11：`FRAMEWORK_DESIGN.md` 每章必须有「现状」标签（issue #78）。
 *
 * DESIGN 写的是**目标态**：读者照它评估完成度会系统性高估（仓库分析已经因此误判两处）。
 * 所以每个 `## ` 章节顶部必须有且只有一行状态标签：
 *
 *     > 现状：✅ 已落地 / 🔶 部分 / ⬜ 未开始（证据：文件:行 或 issue 号）
 *
 * 本脚本只校验「标签存在 + 状态符号合法 + 证据非空」——标签内容是否准确仍需人工判断，
 * 机器能做的是不让人**忘记**标注。
 *
 * 用法：`node scripts/check-doc-status-labels.mjs`
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FILE = 'FRAMEWORK_DESIGN.md';
const lines = readFileSync(join(ROOT, FILE), 'utf8').split('\n');
const problems = [];
let chapters = 0;
let labeled = 0;

lines.forEach((line, i) =>
{
    if (!/^## /.test(line)) return;
    chapters++;

    // 标题后 3 行内必须出现标签
    const label = lines.slice(i + 1, i + 4).find((l) => l.startsWith('> 现状：'));

    if (!label)
    {
        problems.push(`${FILE}:${i + 1} 「${line.trim()}」缺少 \`> 现状：\` 标签`);

        return;
    }
    labeled++;

    if (!/[✅🔶⬜]/.test(label))
    {
        problems.push(`${FILE}:${i + 1} 「${line.trim()}」的标签缺少状态符号（✅ / 🔶 / ⬜）`);
    }

    // 证据：标签里应当有括号或 issue / 文件引用，避免写成空话
    if (!/[（(].+[）)]/.test(label))
    {
        problems.push(`${FILE}:${i + 1} 「${line.trim()}」的标签没有写证据（应带括号说明，如（issue #89））`);
    }
});

if (chapters === 0) problems.push(`${FILE} 里没有解析到任何 \`## \` 章节`);

if (problems.length > 0)
{
    console.error(`❌ 文档现状标签校验失败：${problems.length} 项`);

    for (const p of problems) console.error(`  - ${p}`);
    console.error('\n每个章节标题下方补一行：`> 现状：✅ 已落地（证据：文件:行）`');
    process.exit(1);
}

console.log(`✅ ${FILE} 现状标签校验通过：${chapters} 章全部带标签（${labeled} 处）`);
