/**
 * 模块级 `new` 的存量门禁（R2 的补强，issue #56 的副产品）。
 *
 * 背景：`scripts/check-module-side-effects.mjs` 把「顶层定时器/rAF/ticker」与「顶层
 * `Map`/`WeakMap`/`Set` 缓存」列为错误，但**其它**顶层调用只统计不拦（实测 91 处）。
 * issue #56 的根因 `new AudioContext()` 正好落在那个盲区里——它是模块顶层一个 IIFE 里
 * 的副作用，会在 import 时执行，浏览器因此报 "The AudioContext was not allowed to start"。
 *
 * 为什么不做成"直接报错"：实测全仓顶层 `new` 有 **95 处**，其中既有真副作用
 * （21 处 `new GUI`、各种 FS/渲染器/管理器的单例），也有无害的只读常量
 * （`new Float32Array` / `new Vector3` / `new Matrix4x4` / `new Date` / `new RegExp`）。
 * 一次性全报只会让人把门禁当噪音忽略——这与 `check-module-side-effects.mjs` 里
 * "一次报一百多条只会让人把这条门禁当噪音忽略"的判断一致。
 *
 * 所以采用与 `check-layer-direction.mjs` 相同的**存量冻结**策略：
 *   - 基线里的（`文件 + 构造器` 组合）视为已知存量，放行；
 *   - 基线上**新增**的即失败——挡住"又一个模块级单例悄悄出现"；
 *   - 存量减少（有人清理了）也提示基线该更新，但不失败。
 *
 * 用法：
 *   node scripts/check-toplevel-new.mjs            # 校验（CI 用）
 *   node scripts/check-toplevel-new.mjs --update   # 重写基线
 *   node scripts/check-toplevel-new.mjs --list     # 打印全部存量
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const BASELINE = join(ROOT, 'scripts', 'toplevel-new-baseline.json');
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp']);
const args = process.argv.slice(2);
const update = args.includes('--update');
const list = args.includes('--list');

/**
 * 收集模块顶层的 `new Xxx()`。
 *
 * 判据与 `check-module-side-effects.mjs` 对齐：只看**行首无空白**的行（模块顶层），
 * 跳过注释行；`new Map/WeakMap/Set` 由那条门禁负责，这里跳过以免重复报告。
 *
 * @param file 绝对路径
 * @param rel 用于报告的相对路径
 * @returns 命中的构造器名列表（同一个文件里可以出现多次）
 */
function scanFile(file, rel)
{
    const found = [];

    readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) =>
    {
        if (line.length === 0 || /^\s/.test(line)) return;

        const t = line.trim();

        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        if (/\bnew\s+(Map|WeakMap|Set)\b/.test(t)) return;

        const m = t.match(/new\s+([A-Za-z_$][\w$.]*)\s*\(/);

        if (m) found.push(`${rel}::${m[1]}`);
    });

    return found;
}

function walk(dir, out = [])
{
    let entries;

    try
    {
        entries = readdirSync(dir);
    }
    catch
    {
        return out;
    }

    for (const name of entries)
    {
        if (SKIP_DIRS.has(name)) continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory()) walk(full, out);
        else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts'))
        {
            const rel = relative(ROOT, full).replace(/\\/g, '/');

            out.push(...scanFile(full, rel));
        }
    }

    return out;
}

const found = walk(join(ROOT, 'packages'));
const foundSet = new Set(found);

if (list)
{
    [...foundSet].sort().forEach((k) => console.log(`  ${k}`));
    console.log(`\n共 ${foundSet.size} 个「文件::构造器」组合（${found.length} 处出现）`);
    process.exit(0);
}

if (update)
{
    const baseline = {
        note: '模块级 `new` 的存量基线（R2 补强）。新增即失败；清理掉存量后请重跑 --update。键是「相对路径::构造器名」，刻意不含行号——行号会随无关改动漂移，导致门禁频繁误报。',
        entries: [...foundSet].sort(),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线（${baseline.entries.length} 个组合）`);
    process.exit(0);
}

let baseline;

try
{
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
}
catch
{
    console.error(`❌ 读不到基线 ${relative(ROOT, BASELINE)}：先跑一次 --update 并提交进仓库`);
    process.exit(1);
}

const known = new Set(baseline.entries);
const added = [...foundSet].filter((k) => !known.has(k));
const removed = [...known].filter((k) => !foundSet.has(k));

if (added.length > 0)
{
    console.error(`❌ 新增了模块级 \`new\`（R2）：${added.length} 处`);
    added.forEach((k) => console.error(`  - ${k}`));
    console.error('\n修法：把创建移进函数（lazy-init），或改成纯数据字面量。');
    console.error('     若确实是必须的模块级单例，需要在基线里显式登记并说明理由。');
    process.exit(1);
}

console.log(`✅ 模块级 \`new\` 存量未增长（基线 ${known.size} 个组合，当前 ${foundSet.size} 个）`);

if (removed.length > 0)
{
    console.log(`   （有 ${removed.length} 个存量已被清理，可以跑 --update 收紧基线：${removed.slice(0, 5).join('、')}${removed.length > 5 ? ' …' : ''}）`);
}
