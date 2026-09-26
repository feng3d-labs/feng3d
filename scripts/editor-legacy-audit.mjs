#!/usr/bin/env node
/**
 * 编辑器旧范式残留审计。
 *
 * 用途：核对 `packages/editor/docs/API_MIGRATION.md` 里那些**会随代码推进而过时的数字**。
 * 该文档写在迁移过程中，直接用 `Select-String` / `grep` 核对会得到错误结论——
 * 因为源码里保留了大量「迁移自旧写法 `class X extends Component`」之类的**说明性注释**，
 * 不剥注释就会把注释算成真实消费（实测曾因此得出「hideFlags 有 21 处在用」）。
 *
 * 本脚本剥掉块注释 / 行注释 / HTML 注释后再统计，避免该类误判。
 *
 * 用法：
 *   node scripts/editor-legacy-audit.mjs
 *
 * 退出码：0 正常；1 仍有旧范式残留（可用于门禁）
 */
import fs from 'node:fs';
import path from 'node:path';

const EDITOR_SRC = 'packages/editor/src';

/** 旧范式特征：出现即代表迁移未完成 */
const LEGACY_PATTERNS = [
    { name: '@RegisterComponent', re: /@RegisterComponent/g },
    { name: 'extends Component', re: /extends\s+Component\s*\{/g },
    { name: 'new Color4( / new Color3(', re: /new\s+Color[34]\(/g },
];

/** 新范式特征：用于看迁移铺开程度 */
const MODERN_PATTERNS = [
    { name: 'registerLogic(', re: /registerLogic\(/g },
    { name: 'extends XxxLogic', re: /extends\s+\w*Logic\b/g },
];

/** 剩余待办（与属性面板机制绑定，见 issue #147） */
const PENDING_PATTERNS = [
    { name: '@oav(', re: /@oav\(/g },
];

/**
 * 剥掉注释，避免把说明文字统计成代码。
 *
 * @param {string} text 源码
 * @returns {string} 去注释后的源码
 */
function stripComments(text)
{
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')     // 块注释
        .replace(/^\s*\/\/.*$/gm, '')         // 整行行注释
        .replace(/<!--[\s\S]*?-->/g, '');     // HTML 注释（.vue 模板）
}

/**
 * 递归遍历目录，对每个 .ts / .vue 文件应用回调。
 *
 * @param {string} dir 起始目录
 * @param {(file: string, code: string) => void} onFile 回调（传入去注释后的源码）
 */
function walk(dir, onFile)
{
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true }))
    {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
        {
            walk(full, onFile);
            continue;
        }
        if (!/\.(ts|vue)$/.test(full)) continue;

        onFile(full, stripComments(fs.readFileSync(full, 'utf8')));
    }
}

/**
 * 统计一组特征的出现次数与所在文件。
 *
 * @param {Array<{name: string, re: RegExp}>} patterns 特征
 * @returns {Map<string, {count: number, files: string[]}>} 统计结果
 */
function countAll(patterns)
{
    const result = new Map(patterns.map((p) => [p.name, { count: 0, files: [] }]));

    walk(EDITOR_SRC, (file, code) =>
    {
        for (const { name, re } of patterns)
        {
            const hits = (code.match(re) ?? []).length;
            if (hits === 0) continue;

            const entry = result.get(name);
            entry.count += hits;
            entry.files.push(`${file}:${hits}`);
        }
    });

    return result;
}

const legacy = countAll(LEGACY_PATTERNS);
const modern = countAll(MODERN_PATTERNS);
const pending = countAll(PENDING_PATTERNS);

console.log('=== 旧范式残留（应全为 0）===');
let legacyTotal = 0;
for (const [name, { count, files }] of legacy)
{
    legacyTotal += count;
    console.log(`  ${name}: ${count === 0 ? '0 ✅' : `${count} ❌`}`);
    for (const f of files) console.log(`      ${f}`);
}

console.log('\n=== 新范式铺开程度 ===');
for (const [name, { count, files }] of modern)
{
    console.log(`  ${name}: ${count} 处（${files.length} 个文件）`);
}

console.log('\n=== 剩余待办 ===');
for (const [name, { count, files }] of pending)
{
    console.log(`  ${name}: ${count} 处`);
    for (const f of files) console.log(`      ${f}`);
}
console.log('  （@oav 与属性面板机制绑定，见 issue #147）');

console.log('\n=== 结论 ===');
if (legacyTotal === 0)
{
    console.log('  旧范式已清零：API 迁移的类型改写部分完成。');
    console.log('  详见 packages/editor/docs/API_MIGRATION.md §5 与 §13。');
}
else
{
    console.log(`  仍有 ${legacyTotal} 处旧范式残留，迁移未完成。`);
}

process.exit(legacyTotal === 0 ? 0 : 1);
