/**
 * #276 前置验证 spike（S3）：cordis 各包的**运行时归属**——哪些能进浏览器，哪些是 Node-only。
 *
 * ## 它回答什么
 *
 * 三端形态里"Web 半也是 cordis 插件"（`docs/ARCHITECTURE.md` §6.6 / D4）容易被读成
 * "cordis 全家桶都能在浏览器跑"。实测不是：**核心能进浏览器，`loader` / `include` 不能**
 * （它们直接 import `node:module` / `node:fs/promises` 等）。这条决定了一件**与选型无关**的工程量：
 * 浏览器端的装载必须自建（照 DSH 的 vendored Loader + `internal` 契约）。
 *
 * 顺带校正一个口径：`docs/PLUGINS.md` 记的"cordis 进浏览器 27.2 KB"是 **KiB**，
 * 且**只覆盖核心**（不含 loader / include / schemastery）——见 `cordis-bundle.mjs`。
 *
 * ## 判据
 *
 * 扫描的是**模块引用**（`from 'node:x'` / `require('node:x')` / `import('node:x')`），
 * 不是裸字符串 `node:`——否则错误消息里写一句 `{ node: ChatNode }` 都会被算成 Node 依赖。
 *
 * ## 怎么跑
 *
 * ```bash
 * node packages/editor/spikes/cordis-runtime-surface.mjs
 * ```
 *
 * 探测 `$DSH_HOME/profiles/node_modules/@deepseek-ai`（可用 `CORDIS_PACKAGES_DIR` 覆盖）。
 * 核心包（cordis / cosmokit / schemastery / timer / group）出现 Node 引用时退出码 1；
 * 否则 0——`loader` / `include` 有 Node 引用是**预期**，不算失败。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** 探测 cordis 相关包所在的目录 */
function resolvePackagesDir()
{
    if (process.env.CORDIS_PACKAGES_DIR) return process.env.CORDIS_PACKAGES_DIR;

    const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh');

    return join(dshHome, 'profiles', 'node_modules', '@deepseek-ai');
}

/**
 * 递归收集目录下的脚本文件。
 *
 * 范围刻意限定在**运行时目录** `lib/`（没有 `lib/` 时退回包根），并排除 `bin*`：
 * 首版扫描整个包根时误报过一次——`cordis/bin.js`（CLI 入口）里 `import 'node:url'`，
 * 但它既不在 `lib/` 下，也不在包 `exports` 的入口闭包里，**跟浏览器加载没有关系**。
 * 浏览器真正加载的是 `exports["."].default`（`lib/index.js`）及其相对 import 闭包，
 * 而"入口闭包到底带不带 Node 依赖"由 `cordis-bundle.mjs` 的**打包实测**回答（那才是硬判据）。
 *
 * @param dir 目录
 * @param out 收集结果
 * @returns 脚本文件路径列表
 */
function collectScripts(dir, out = [])
{
    if (!existsSync(dir)) return out;

    for (const entry of readdirSync(dir))
    {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory())
        {
            // 类型声明、源码目录、CLI 目录都不参与浏览器入口闭包
            if (entry === 'types' || entry === 'src' || entry === 'bin') continue;
            collectScripts(full, out);
        }
        else if (/\.(js|mjs|cjs)$/.test(entry) && !/^bin\./.test(entry))
        {
            out.push(full);
        }
    }

    return out;
}

const packagesDir = resolvePackagesDir();
if (!existsSync(packagesDir))
{
    console.error(`未找到 cordis 相关包目录：${packagesDir}`);
    console.error('用 CORDIS_PACKAGES_DIR=<...>/node_modules/@deepseek-ai 指定');
    process.exit(2);
}

/** 关注的包（核心 + 插件），顺序即输出顺序 */
const PACKAGES = [
    'cordis',
    'cosmokit',
    'schemastery',
    'cordis-plugin-loader',
    'cordis-plugin-include',
    'cordis-plugin-group',
    'cordis-plugin-timer',
];

/** 核心包：出现 Node 引用即为失败（它们要能进浏览器） */
const BROWSER_CORE = new Set(['cordis', 'cosmokit', 'schemastery', 'cordis-plugin-group', 'cordis-plugin-timer']);

/** 模块引用正则（刻意不含裸 `node:` 字符串） */
const NODE_IMPORT_PATTERNS = [
    /from\s*['"]node:([a-z/0-9_-]+)['"]/g,
    /require\(\s*['"]node:([a-z/0-9_-]+)['"]\s*\)/g,
    /import\(\s*['"]node:([a-z/0-9_-]+)['"]\s*\)/g,
];

const rows = [];
let failed = 0;

for (const name of PACKAGES)
{
    const dir = join(packagesDir, name);
    if (!existsSync(dir)) { rows.push({ name, missing: true }); continue; }

    const modules = new Set();
    let processRefs = 0;

    for (const file of collectScripts(dir))
    {
        const text = readFileSync(file, 'utf-8');

        for (const pattern of NODE_IMPORT_PATTERNS)
        {
            for (const match of text.matchAll(pattern)) modules.add(`node:${match[1]}`);
        }
        processRefs += (text.match(/\bprocess\./g) ?? []).length;
    }

    const isCore = BROWSER_CORE.has(name);
    const clean = modules.size === 0 && processRefs === 0;
    if (isCore && !clean) failed++;

    rows.push({ name, modules: [...modules].sort(), processRefs, isCore, clean });
}

console.log(`扫描目录：${packagesDir}`);
console.log('扫描范围：各包的运行时目录（`lib/`，排除 `bin*` 与 `types/`）——CLI 入口不参与浏览器入口闭包');
console.log('');
console.log('包                              定位        node: 模块（模块引用）                        process.');
for (const row of rows)
{
    if (row.missing) { console.log(`${row.name.padEnd(32)}未安装      —`); continue; }
    const kind = row.isCore ? '浏览器核心' : 'Node-only ';
    const mods = row.modules.length === 0 ? '—' : row.modules.join('、');
    const verdict = row.clean ? '' : (row.isCore ? '  ← 意外！' : '  （预期）');
    console.log(`${row.name.padEnd(32)}${kind}  ${mods.padEnd(46)}${String(row.processRefs).padEnd(4)}${verdict}`);
}

console.log('');
console.log('结论：核心侧可进浏览器；loader / include 是 Node-only → 浏览器端装载必须自建');
console.log(failed === 0 ? '断言通过：浏览器核心包没有 Node 依赖' : `断言失败：${failed} 个核心包带了 Node 依赖`);
process.exit(failed === 0 ? 0 : 1);
