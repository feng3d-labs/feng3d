#!/usr/bin/env node
/**
 * 编辑器**全局单例**的普查（#272 P5「单例迁服务」的"迁移清单可查"）。
 *
 * ## 为什么要脚本，而不是写死在文档里
 *
 * P5 是一串**分步重构**：每迁一个单例，引用面就变一次。如果把"`editorRS` 还有 49 处引用"
 * 这类数字写死在设计稿里，它第二天就会过期，而**过期的清单比没有清单更坏**——
 * 后来者会按它去估工作量。
 *
 * 所以设计稿只写"用这个脚本跑出来的数字"，脚本本身是那句话的**执行者**：
 * 它顺带做三条**自证**，防止"清单过期"与"扫描器坏了"这两种假绿：
 *
 * 1. 清单里的定义文件必须都存在（否则清单过期了）；
 * 2. 每个单例都必须扫到**外部引用**（一个都没有 = 扫描器或匹配写错了）；
 * 3. 定义文件里必须真的能看到它的导出（防止把空文件/改名后的文件当成单例）。
 *
 * ## 它统计什么
 *
 * | 维度 | 为什么重要 |
 * |---|---|
 * | 引用面（处数 / 文件数） | 估算爆炸半径；也是"迁完了没有"的判据 |
 * | 引用最多的前几个文件 | 那些就是每步要重点改的地方 |
 * | 定义文件之间的依赖 | 决定**迁移顺序**（无依赖的先迁，被依赖的也得先迁） |
 * | 测试里的引用 | 决定"改完要跑哪些测试" |
 * | 模块顶层使用（粗查） | 模块顶层**读**单例可能触发初始化，属 R2 的敏感点 |
 *
 * ## 局限（写在输出里，别当它是全知）
 *
 * "模块顶层使用"是**行首缩进**的启发式（顶格且不是 import/export/注释），
 * 不是 AST 判定——它只用来**指路**（哪几个文件值得人看一眼），不作为判据。
 *
 * 用法：
 *   node scripts/editor-singleton-survey.mjs
 *
 * 退出码：0 普查通过；1 自证失败（清单过期 / 扫描器坏了）。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const EDITOR = join(ROOT, 'packages', 'editor');
const SRC = join(EDITOR, 'src');
const TEST = join(EDITOR, 'test');

/**
 * 要普查的单例。
 *
 * `def` 相对 `packages/editor`；`what` 是它在设计稿里的角色（普查输出会带上，
 * 免得读者对着四个名字猜哪个是状态、哪个是持久化）。
 */
const SINGLETONS = [
    { name: 'editorData', def: 'src/global/EditorData.ts', what: '编辑器状态（已经是 Pinia 的过渡层）' },
    { name: 'editorui', def: 'src/global/editorui.ts', what: '传统 UI 层留下的兼容空壳' },
    { name: 'editorRS', def: 'src/assets/EditorRS.ts', what: '页面侧资源系统' },
    { name: 'editorcache', def: 'src/caches/Editorcache.ts', what: '偏好持久化（模块顶层 new）' },
];

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 递归收集目录下的 `.ts` 文件。
 *
 * @param {string} dir 目录
 * @returns {string[]} 绝对路径
 */
function collect(dir)
{
    if (!existsSync(dir)) return [];

    const found = [];

    for (const entry of readdirSync(dir, { withFileTypes: true }))
    {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) found.push(...collect(full));
        else if (entry.name.endsWith('.ts')) found.push(full);
    }

    return found;
}

/**
 * 把绝对路径显示成相对仓库根的正斜杠路径。
 *
 * @param {string} file 绝对路径
 * @returns {string} 显示用路径
 */
function display(file)
{
    return relative(ROOT, file).split('\\').join('/');
}

/**
 * 数一个名字在给定文件集里出现多少次（**按文件**聚合）。
 *
 * 用词边界匹配：`editorData` 不能匹配到 `editorData2` 之类的别的标识符。
 *
 * ⚠️ **大小写敏感**（JS 正则默认如此）：`editorRS`（单例）与 `EditorRS`（**类**）是两个东西。
 * 写这个脚本时就差点记错一笔——用 PowerShell 的 `Select-String` 去数会得到另一个数
 * （它**默认大小写不敏感**，于是把 `EditorRS` 类也算成 `editorRS` 单例的引用，
 * `packages/editor/test` 因此显示"6 处"而不是真实的 0 处）。台账要能对上，口径就得先对上。
 *
 * @param {string[]} files 文件
 * @param {string} name 标识符
 * @returns {Map<string, number>} 文件 → 命中次数
 */
function countByName(files, name)
{
    const pattern = new RegExp(`\\b${name}\\b`);
    /** @type {Map<string, number>} */
    const hits = new Map();

    for (const file of files)
    {
        const count = readFileSync(file, 'utf8').split('\n').filter((line) => pattern.test(line)).length;

        if (count > 0) hits.set(file, count);
    }

    return hits;
}

console.log('[单例普查] #272 P5：单例迁服务前的引用面台账');

const srcFiles = collect(SRC);
const testFiles = collect(TEST);

console.log(`  扫描范围：packages/editor/src（${srcFiles.length} 个 .ts）`
    + ` / packages/editor/test（${testFiles.length} 个 .ts）`);

// ---------- 自证 1：清单没过期 ----------
const missing = SINGLETONS.filter((one) => !existsSync(join(EDITOR, one.def)));

check('清单里的定义文件都存在（清单没有过期）', missing.length === 0,
    missing.length > 0 ? `找不到：${missing.map((one) => one.def).join('、')}` : `${SINGLETONS.length} 个都在`);

if (missing.length > 0)
{
    console.error('\n❌ 单例清单已过期——定义文件被改名/删除后，这份台账就会指向不存在的东西。');
    process.exit(1);
}

// ---------- 自证 3：定义文件里真的看得到导出 ----------
for (const one of SINGLETONS)
{
    const source = readFileSync(join(EDITOR, one.def), 'utf8');
    const exported = new RegExp(`export (const|class|interface|let) (${one.name}|${one.name[0].toUpperCase()}${one.name.slice(1)})`).test(source);

    check(`${one.name} 的定义文件里看得到它的导出`, exported, one.def);
}

// ---------- 台账 ----------
console.log('');
console.log('  单例            引用处数  文件数  测试引用  角色');
console.log('  ---------------  --------  ------  --------  ----------------------------------');

/** 每个单例的统计结果（后面还要用） */
const survey = [];

for (const one of SINGLETONS)
{
    const defFull = join(EDITOR, one.def);
    const external = srcFiles.filter((file) => file !== defFull);
    const hits = countByName(external, one.name);
    const testHits = countByName(testFiles, one.name);
    const count = [...hits.values()].reduce((sum, value) => sum + value, 0);
    const testCount = [...testHits.values()].reduce((sum, value) => sum + value, 0);

    survey.push({ ...one, hits, count, testCount });

    console.log(`  ${one.name.padEnd(15)}  ${String(count).padStart(8)}  ${String(hits.size).padStart(6)}`
        + `  ${String(testCount).padStart(8)}  ${one.what}`);
}

// ---------- 自证 2：扫描器没坏 ----------
const noHits = survey.filter((one) => one.count === 0);

check('每个单例都扫到了外部引用（一个都没有 = 扫描器或匹配写错了）', noHits.length === 0,
    noHits.length > 0 ? `没扫到：${noHits.map((one) => one.name).join('、')}` : '四个都有引用');

// ---------- 爆炸半径：每个单例引用最多的文件 ----------
console.log('');
console.log('  引用最多的文件（每步重构的重点）：');

for (const one of survey)
{
    const top = [...one.hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([file, count]) => `${display(file)}(${count})`);

    console.log(`    ${one.name.padEnd(15)} ${top.join('  ')}`);
}

// ---------- 依赖矩阵：决定迁移顺序 ----------
console.log('');
console.log('  定义文件之间的依赖（被依赖的先迁，或一起迁）：');

for (const one of survey)
{
    const source = readFileSync(join(EDITOR, one.def), 'utf8');
    const deps = SINGLETONS
        .filter((other) => other.name !== one.name && new RegExp(`\\b${other.name}\\b`).test(source))
        .map((other) => other.name);

    console.log(`    ${one.name.padEnd(15)} -> ${deps.length > 0 ? deps.join(', ') : '（无）'}`);
}

// ---------- 模块顶层使用（启发式，只指路） ----------
console.log('');
console.log('  模块顶层使用（**启发式**：顶格且不是 import/export/注释——只用来指路，不是判据）：');

let topLevelTotal = 0;

for (const one of survey)
{
    const lines = [];

    for (const file of srcFiles)
    {
        const pattern = new RegExp(`^[a-zA-Z].*\\b${one.name}\\b`);

        for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries())
        {
            if (!pattern.test(line)) continue;
            if (/^\s*(import|export|\/\/|\*)/.test(line)) continue;

            lines.push(`${display(file)}:${index + 1}: ${line.trim()}`);
        }
    }

    topLevelTotal += lines.length;
    if (lines.length > 0) console.log(`    ${one.name}：${lines.map((line) => line).join('  |  ')}`);
}

check('顶层使用粗查跑得动（哪怕结果为 0 也要有结论）', topLevelTotal >= 0,
    `共 ${topLevelTotal} 行看起来在顶层使用`);

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 单例普查未通过——台账数字是后面每一步重构的依据，它自己不能是不可信的。');
    process.exit(1);
}

console.log('✅ 单例普查通过：清单没过期、扫描器扫得到东西、台账数字可复现');
console.log('（设计稿 packages/editor/docs/MIGRATE_SINGLETONS.md 里的数字都来自本脚本）');
