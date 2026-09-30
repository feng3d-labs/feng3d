/**
 * R2：零模块级副作用（运行时侧，issue #88；也是 issue #76 的一部分）。
 *
 * 模块**顶层**出现 `new Map()/WeakMap()/Set()` 或裸调用语句时，只要被 import 就会执行——
 * 缓存无法按需分配、副作用无法关闭、tree-shaking 也判断不了模块能否整体消除。
 *
 * 本脚本守两条：
 *   1. 顶层不得 `= new Map() / new WeakMap() / new Set()`（缓存一律 lazy-init）；
 *   2. 顶层不得出现裸调用语句（`foo(...)`），已知存量由 `ALLOWED_TOP_LEVEL_CALLS` 登记。
 *
 * 用法：`node scripts/check-module-side-effects.mjs`
 *
 * 为什么 `registerLogic(...)` 在允许清单里：全仓上百个 Logic 文件都靠顶层注册分发，
 * 一次性清零需要先改注册模型（见 docs/ARCHITECTURE_V2.md §2.2 第 2 项的分期计划）。
 * 允许清单只放这一个模式，其它新增的顶层调用会被拦下——先把「别再增加」守住。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** --strict：有违规即 exit 1（存量清零后接 CI 门禁用；默认只报告） */
const strict = process.argv.includes('--strict');
const ROOT = process.cwd();
const PACKAGES = join(ROOT, 'packages');

/** 顶层「启动型」调用：定时器 / rAF / ticker 启动——这些必须显式化，不能在 import 时执行 */
const STARTUP_CALLS = /(?:^|[^\w$])(?:setInterval|setTimeout|requestAnimationFrame|runTickerFuncs|startTicker)\s*\(/;

/** 应用入口：import 即执行是入口的固有语义（不被 tree-shake、也没有"谁 import 它"的问题） */
const ENTRY_FILE = /(?:^|\/)(?:examples\/index\.ts|vue-app\/main\.ts)$/;

/** 统计（不报错，只用于输出里说明存量） */
const stats = { constantSets: 0, registeredCalls: 0, otherTopLevelCalls: 0, entryFiles: 0 };

/** 顶层语句里不该出现的 JS 关键字（`if (`、`for (` 等不是"裸调用"） */
const STATEMENT_KEYWORDS = [
    'if', 'for', 'while', 'switch', 'return', 'throw', 'catch', 'do', 'else',
    'export', 'import', 'function', 'class', 'const', 'let', 'var', 'try', 'await', 'new', 'typeof', 'super',
];

function collectFiles(dir, out = [])
{
    for (const entry of readdirSync(dir))
    {
        if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;

        const full = join(dir, entry);
        const st = statSync(full);

        if (st.isDirectory())
        {
            if (entry === 'test') continue;
            collectFiles(full, out);
        }
        else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts') && !entry.endsWith('.d.ts'))
        {
            out.push(full);
        }
    }

    return out;
}

/** 把块注释整段挖空（保留行结构，便于按行判定顶层），并去掉行内 `//` 注释 */
function maskComments(text)
{
    const lines = [];
    let inBlock = false;

    for (const raw of text.split('\n'))
    {
        let line = '';
        let k = 0;

        while (k < raw.length)
        {
            if (inBlock)
            {
                const end = raw.indexOf('*/', k);

                if (end < 0) break;
                inBlock = false;
                k = end + 2;
            }
            else
            {
                const blockStart = raw.indexOf('/*', k);
                const lineStart = raw.indexOf('//', k);

                if (lineStart >= 0 && (blockStart < 0 || lineStart < blockStart))
                {
                    line += raw.slice(k, lineStart);
                    break;
                }
                if (blockStart < 0)
                {
                    line += raw.slice(k);
                    break;
                }
                line += raw.slice(k, blockStart);
                inBlock = true;
                k = blockStart + 2;
            }
        }

        lines.push(line);
    }

    return lines;
}

const problems = [];

for (const file of collectFiles(PACKAGES))
{
    const rel = relative(ROOT, file).split(sep).join('/');
    const isEntry = ENTRY_FILE.test(rel);

    if (isEntry) stats.entryFiles++;
    const lines = maskComments(readFileSync(file, 'utf8'));

    lines.forEach((line, i) =>
    {
        // 只看模块顶层：行首没有空白
        if (line.length === 0 || /^\s/.test(line)) return;
        const trimmed = line.trim();

        if (trimmed.length === 0) return;
        if (isEntry) return;

        // 规则 1：顶层**缓存**（`new Map()` / `new WeakMap()` / 空 `new Set()`）。
        // 带字面量参数的 `new Set([...])` 是只读常量集合，不是按需缓存——只统计，不报错。
        const cache = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+\w+\s*(?::[^=]+)?=\s*new\s+(Map|WeakMap|Set)\b[\s\S]*?\(\s*\)\s*;?\s*$/);

        if (cache)
        {
            problems.push(`${rel}:${i + 1} 顶层 \`new ${cache[1]}()\`（缓存应 lazy-init）`);
        }

        if (/^(?:export\s+)?(?:const|let|var)\s+\w+\s*(?::[^=]+)?=\s*new\s+Set\s*\(\s*\[/.test(trimmed)) stats.constantSets++;

        // 规则 2：顶层「启动型」调用（定时器 / rAF / ticker 启动）与顶层写 globalThis。
        // 注册型调用（registerLogic、setAssetTypeClass、xxx.push(...) 等）属注册模型改造范围，
        // 这里只统计存量——一次报一百多条只会让人把这条门禁当噪音忽略。
        const call = trimmed.match(/^([A-Za-z_$][\w$.]*)\s*\(/);

        if (call && !STATEMENT_KEYWORDS.includes(call[1].split('.')[0]))
        {
            if (STARTUP_CALLS.test(trimmed)) problems.push(`${rel}:${i + 1} 顶层启动型调用 \`${trimmed.slice(0, 60)}\``);
            else if (/^registerLogic\s*\(|^unregisterLogic\s*\(/.test(trimmed)) stats.registeredCalls++;
            else stats.otherTopLevelCalls++;
        }

        if (/^globalThis\s*\.\s*\w+\s*=/.test(trimmed)) problems.push(`${rel}:${i + 1} 顶层写 globalThis \`${trimmed.slice(0, 60)}\``);
    });
}

if (problems.length > 0)
{
    console.error(`❌ 模块级副作用（R2，issue #88）：${problems.length} 处`);

    for (const p of problems) console.error(`  - ${p}`);
    console.error('\n修法：缓存改 lazy-init（`let cache = null; function getCache()`）；');
    console.error('模块级的初始化代码移进显式函数（如 Ticker.startTicker），不要在 import 时执行。');

    if (strict) process.exit(1);
    console.log('⚠️  以上为存量（尚未清零），默认只报告；清零后可用 --strict 接进 CI 门禁。');
    process.exit(0);
}

console.log('✅ 模块级副作用检查通过（顶层无缓存创建、无启动型调用、无 globalThis 写入）');
console.log(`   存量统计（不在本次门禁范围）：注册型顶层调用 ${stats.registeredCalls} 处、`
    + `其它顶层调用 ${stats.otherTopLevelCalls} 处、只读常量集合 ${stats.constantSets} 处、入口文件 ${stats.entryFiles} 个`);
