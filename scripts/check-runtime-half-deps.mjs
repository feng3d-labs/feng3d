#!/usr/bin/env node
/**
 * 门禁：**插件 runtime 端（游戏项目端）只能依赖引擎 API，禁止依赖编辑器 API**。
 *
 * ## 这条规范来自哪
 *
 * #276 的第三端是"游戏项目端"——插件包用 `"./runtime"` 入口贡献运行期 Logic / 组件行为，
 * 它会被**打进游戏产物**（决策 A：构建时打入）。所以一旦 runtime 端 import 了编辑器 API
 * （`feng3d-editor` / Vue / Element Plus / 编辑器源码），产物就会把整个编辑器拖进去。
 * 见 [PLUGIN_TRIPLE_HALF.md 的 §4.4](../packages/editor/docs/PLUGIN_TRIPLE_HALF.md) 与
 * [ARCHITECTURE.md 的「第三端」](../packages/editor/docs/ARCHITECTURE.md)。
 *
 * 对齐根 `AGENTS.md` §15 的元规则：**每条规范必须有机器执行者**——这条在本文档里躺了很久
 * （"runtime 端只能依赖引擎 API"），但一直没有执行者，所以就一直没有被真正遵守过。
 *
 * ## 判据（对一个包的 `"./runtime"` 入口，递归它自己的相对 import 闭包）
 *
 * 1. **裸模块**：命中禁止清单即失败（编辑器包 / `@feng3d/editor*` / `vue` / `element-plus`）；
 * 2. **相对路径穿越**：解析后落到 `packages/editor/**` 也失败（`../../editor/src/...` 这种写法
 *    绕过了包名检查，但同样把编辑器拖进产物）。
 *
 * ## 为什么带自检
 *
 * 现在仓库里**一个 runtime 端都还没有**（第三端要到 P5/P6 才落地），于是这个门禁天然"永远绿"。
 * 门禁最怕永远绿——所以脚本内置三条合成样例（允许一条、禁止两条），**样例判错就整体失败**。
 * 这样等真的写出第一个 `./runtime` 时，扫描器已经被证明是有效的，而不是等着那时候才发现它坏着。
 *
 * 用法：
 *   node scripts/check-runtime-half-deps.mjs
 *
 * 退出码：0 通过（含自检）；1 有违规或自检失败。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const EDITOR_ROOT = resolve(ROOT, 'packages', 'editor');

/** 禁止的裸模块（判据 1） */
const FORBIDDEN = [
    { match: (spec) => spec === 'feng3d-editor' || spec.startsWith('feng3d-editor/'), why: '编辑器包本身' },
    { match: (spec) => spec.startsWith('@feng3d/editor'), why: '编辑器 API' },
    { match: (spec) => spec === 'vue' || spec.startsWith('vue/'), why: 'Vue（编辑器 UI 层）' },
    { match: (spec) => spec === 'element-plus' || spec.startsWith('element-plus/'), why: 'Element Plus（编辑器 UI 层）' },
];

/** 相对路径候选后缀（仓库是 TS 源码发布，没有 dist） */
const RESOLVE_SUFFIXES = ['', '.ts', '.mts', '.js', '.mjs', '.tsx', '/index.ts', '/index.js'];

/**
 * 判定一个 specifier 是否违规。
 *
 * 抽成纯函数是为了让自检能直接喂样例（见文件末尾的自检），不必往磁盘写东西。
 *
 * @param {string} spec 模块说明符（`import ... from '<spec>'` 里的那个）
 * @param {string} fromFile 引用方文件的绝对路径
 * @returns {{ forbidden: boolean, why?: string }} 判定结果
 */
function judge(spec, fromFile)
{
    if (spec.startsWith('.') || spec.startsWith('/'))
    {
        const resolved = resolveModule(fromFile, spec);
        // 解析不出来（如写错路径）交给 tsc 报，这里只管"落到编辑器源码里"这一条
        if (resolved && (resolved === EDITOR_ROOT || resolved.startsWith(EDITOR_ROOT + sep)))
        {
            return { forbidden: true, why: `相对路径穿越到编辑器源码（${spec}）` };
        }

        return { forbidden: false };
    }

    const hit = FORBIDDEN.find((rule) => rule.match(spec));

    return hit ? { forbidden: true, why: hit.why } : { forbidden: false };
}

/**
 * 把相对 specifier 解析成绝对文件路径。
 *
 * @param {string} fromFile 引用方文件
 * @param {string} spec 相对 specifier
 * @returns {string|null} 命中时返回绝对路径，都不存在时返回 `null`
 */
function resolveModule(fromFile, spec)
{
    const base = resolve(dirname(fromFile), spec);

    for (const suffix of RESOLVE_SUFFIXES)
    {
        const candidate = base + suffix;
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }

    return null;
}

/** 从一个文件里抠出所有模块说明符 */
const SPECIFIER_PATTERNS = [
    /from\s*['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /^\s*import\s*['"]([^'"]+)['"]/gm,
];

/**
 * 递归收集一个入口的依赖闭包（只跟**相对** import，裸模块就是依赖本身）。
 *
 * @param {string} entry 入口绝对路径
 * @returns {{ specifiers: Map<string, string[]>, files: string[] }} 说明符 → 引用它的文件；扫描过的文件
 */
function collectClosure(entry)
{
    const specifiers = new Map();
    const files = [];
    const seen = new Set();
    const queue = [entry];

    while (queue.length > 0)
    {
        const file = queue.pop();
        if (seen.has(file)) continue;
        seen.add(file);
        files.push(file);

        const text = readFileSync(file, 'utf-8');
        for (const pattern of SPECIFIER_PATTERNS)
        {
            for (const match of text.matchAll(pattern))
            {
                const spec = match[1];
                const referrers = specifiers.get(spec) ?? [];
                referrers.push(file);
                specifiers.set(spec, referrers);

                if (!spec.startsWith('.')) continue;
                const resolved = resolveModule(file, spec);
                if (resolved && !seen.has(resolved)) queue.push(resolved);
            }
        }
    }

    return { specifiers, files };
}

/**
 * 找所有声明了 `"./runtime"` 入口的包。
 *
 * 只扫 `packages/*`（workspace 成员）——`packages/editor/packages/*` 那几个子包既不参与安装
 * 也不参与发布（见 `packages/editor/AGENTS.md`），不作为插件包看待。
 *
 * @returns {{ name: string, entry: string }[]} 包名与 runtime 入口绝对路径
 */
function findRuntimeEntries()
{
    const found = [];
    const packagesDir = join(ROOT, 'packages');

    for (const name of readdirSync(packagesDir))
    {
        const manifestPath = join(packagesDir, name, 'package.json');
        if (!existsSync(manifestPath)) continue;

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        const exported = manifest.exports?.['./runtime'];
        if (!exported) continue;

        const relative = typeof exported === 'string' ? exported : (exported.default ?? exported.types);
        if (typeof relative !== 'string') continue;

        const entry = resolve(packagesDir, name, relative);
        if (existsSync(entry)) found.push({ name: manifest.name ?? name, entry });
    }

    return found;
}

// ---- 自检：扫描器必须能判对样例（否则这个门禁等于没有）----
const SELF_CHECKS = [
    { title: '引擎 API（feng3d）允许', spec: 'feng3d', expect: false },
    { title: '引擎侧包（@feng3d/math）允许', spec: '@feng3d/math', expect: false },
    { title: '编辑器包禁止', spec: 'feng3d-editor', expect: true },
    { title: '编辑器 API（@feng3d/editor/*）禁止', spec: '@feng3d/editor/plugins', expect: true },
    { title: 'Vue 禁止', spec: 'vue', expect: true },
    { title: 'Element Plus 禁止', spec: 'element-plus', expect: true },
    {
        // 相对路径那条判据：引用方真实存在，解析结果落在 packages/editor 下 → 违规
        title: '相对路径落在编辑器源码下禁止',
        spec: './types',
        from: 'packages/editor/src/plugins/index.ts',
        expect: true,
    },
    {
        // 反例：同样落在编辑器下但引用的是**引擎**源码，不该误报
        title: '相对路径落在引擎源码下允许',
        spec: './core/HideFlags',
        from: 'packages/feng3d/src/index.ts',
        expect: false,
    },
];

let failed = 0;

console.log('--- 自检（扫描器判据）---');
for (const sample of SELF_CHECKS)
{
    const fromFile = resolve(ROOT, sample.from ?? 'packages/some-plugin/src/runtime.ts');
    const verdict = judge(sample.spec, fromFile).forbidden;
    const ok = verdict === sample.expect;
    if (!ok) failed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${sample.title}`);
}

// ---- 真扫：目前仓库里还没有 runtime 端，扫到 0 个是正常状态 ----
const targets = findRuntimeEntries();

console.log(`\n--- 扫描（${targets.length} 个 runtime 端）---`);

if (targets.length === 0)
{
    console.log('  当前没有包声明 "./runtime"（第三端要到 P5/P6 才落地）——门禁就位，等它出现');
}

for (const target of targets)
{
    const { specifiers, files } = collectClosure(target.entry);
    const violations = [];

    for (const [spec, referrers] of specifiers)
    {
        // **逐个引用方判**：相对路径的解析结果取决于**引用方所在目录**——只看第一个引用方会漏报
        // （同一个字符串被两个不同深度的文件引用时，是否违规取决于遍历顺序，那是假阴性）
        const reported = new Set();

        for (const referrer of referrers)
        {
            const verdict = judge(spec, referrer);
            if (!verdict.forbidden) continue;

            const message = `${spec}（${verdict.why}）← ${referrer}`;
            if (reported.has(message)) continue;
            reported.add(message);
            violations.push(message);
        }
    }

    if (violations.length > 0)
    {
        failed += violations.length;
        console.log(`  FAIL  ${target.name}：runtime 端依赖了编辑器 API`);
        for (const violation of violations) console.log(`        ${violation}`);
    }
    else
    {
        console.log(`  PASS  ${target.name}：${files.length} 个文件、${specifiers.size} 个依赖，都是引擎侧`);
    }
}

console.log(`\n${failed === 0 ? '✅' : '❌'} runtime 端依赖门禁：${failed === 0 ? '通过' : `${failed} 项失败`}`);
process.exit(failed === 0 ? 0 : 1);
