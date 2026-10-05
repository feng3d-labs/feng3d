/**
 * 模块级 `new` 的存量门禁（R2 的补强，issue #56 的副产品）。
 *
 * **与 `scripts/check-module-side-effects.mjs` 的分工**（issue #606 明确，消灭"我以为你管了"的夹缝）：
 *   - 那条脚本管**缓存形态**（空参 / 只有泛型实参的 `new Map/WeakMap/Set/WeakSet()`）、
 *     启动型调用（定时器 / rAF / ticker）与写 `globalThis`——**新增即失败**；
 *   - 本脚本管**其余模块级 `new`**——`export const x = new X()` 这类**声明形式**的构造，
 *     含 `new Set([...])` 只读常量集合、`new Float32Array([...])`、示例入口里的 `new GUI(...)`、
 *     以及库代码里的模块级单例。**存量冻结**，新增即失败。
 *
 * 背景：issue #56 的根因 `new AudioContext()` 是模块顶层一个 IIFE 里的副作用，会在 import 时执行，
 * 浏览器因此报 "The AudioContext was not allowed to start"——它落在上面那条脚本的统计盲区里
 * （那条只统计**裸调用语句**，声明形式的构造整行跳过），所以要独立一条门禁兜底。
 *
 * **本脚本不再跳过 `Map/WeakMap/Set`（issue #606）**：原先那句跳过写的是
 * `\bnew\s+(Map|WeakMap|Set)\b`，`\b` 边界让 **`WeakSet` 也算命中**——于是两条门禁都以为对方管了，
 * 三处模块级 `new WeakSet()`（`Entity.ts` / `WGPUBindEntry.ts` / `generate-mipmap.ts`）被**双向放行**；
 * 另外泛型写法 `new WeakSet<Components>()` 也过不了那条门禁的正则。现在本脚本对**所有**模块级 `new`
 * 生效，与那条门禁的重叠是**有意**的：**去重比漏网好**——重复报告同一处，好过"两条都不管"。
 *
 * **泛型实参不再漏网（issue #606 同批）**：判据原先是 `new\s+(名字)\s*\(`，构造器名后紧跟 `(` 才命中，
 * 于是 `new Foo<Bar>()` 整类**完全逃逸**——实测命中两处真副作用：`packages/event/src/GlobalEmitter.ts`
 * 的 `globalEmitter` 与 `packages/shortcut/src/WindowEventProxy.ts` 的 `windowEventProxy`（后者还用了顶层
 * `self`），而那条门禁也管不到它们（不是缓存形态、行首是 `export` 不算裸调用）——又一条"第三条夹缝"。
 * 现在判据放宽为 `new\s+(名字)\s*(?:<[^(]*>)?\s*\(`，与 `check-module-side-effects.mjs` 的泛型口径对齐。
 *
 * **那两处单例为什么仍冻结在基线里**（issue #606 后续，本次复核，不是遗漏）：
 * `GlobalEmitter.ts::EventEmitter` 与 `WindowEventProxy.ts::EventProxy` 保持冻结——它们是**身份敏感的对象单例**
 * （`EventEmitter` 的构造会把自己写进三个 `static` 注册表，事件路由靠 `instanceof` 与对象身份），
 * lazy-init 等于公开 API 变更（`globalEmitter` 实测 77 处 / 20 文件、`windowEventProxy` 121 处 / 23 文件，
 * 并经 `feng3d` 公开入口 `export *` 出去）；而且只改这两行**并不能**让模块变 R2 干净——`EventEmitter`
 * 自身还有三个模块级 `private static ... = new Map()`，同样是 import 时执行，却正好落在下面那条局限里
 * （改完是"看起来修好了"）。判定理由、门禁如何认可它（存量冻结）与建议的迁移路径见 docs/CI.md §2.1。
 *
 * **已知局限（本次探针实测，不要再当"本仓没有"）**：判据是**行级**的（`^\s` 判顶层 + 单行正则），
 * 因此整类漏掉：① 行首有空白的**多行声明**（`const x =\n  new Map();`）；② **顶层 IIFE**——issue #56 的根因
 * `new AudioContext()` 正是这个形态，本脚本的注释一度以为它兜住了；③ 类 **static 字段初始化器**
 * （`private static map = new ChainMap()`，本仓 42 处，其中 12 处是空参缓存，本该由
 * `check-module-side-effects.mjs` 按"新增即失败"拦下）；④ 模块级块 / 对象字面量 / 回调里的缩进行；
 * ⑤ 类型实参里含 `(` 的极端写法。本次实测：`packages/` 下真正在 import 时执行的 `new` 有 158 处，
 * 本脚本与 `check-module-side-effects.mjs` 合计只看见 97 处（换算成「文件::构造器」是 44 个未登记的键）。
 * 收紧要改用 TypeScript AST 判据（先例：`scripts/check-editor-module-effects.mjs`），
 * 但那会让基线一次性新增 40 余个键、得先逐个定性——**单开 issue，不要夹带**。
 *
 * 为什么不做成"直接报错"：全仓顶层 `new` 是大几十处的量级，其中既有真副作用
 * （示例入口的 `new GUI`、各种 FS/渲染器/管理器的单例），也有无害的只读常量
 * （`new Float32Array` / `new Vector3` / `new Matrix4x4` / `new Date` / `new RegExp`）。
 * 一次性全报只会让人把门禁当噪音忽略——这与 `check-module-side-effects.mjs` 里
 * "一次报一百多条只会让人把这条门禁当噪音忽略"的判断一致。
 * （存量规模**不写死在这个注释里**：它会随每次收紧而腐化，以脚本输出 / `--list` 为准。）
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
 * 判据与 `check-module-side-effects.mjs` 对齐：只看**行首无空白**的行（模块顶层），跳过注释行。
 * **不跳过任何构造器**（issue #606 删掉了原先的 `Map/WeakMap/Set` 跳过——它的 `\b` 边界
 * 让 `WeakSet` 也命中，造成两条门禁互相让路）：缓存形态的 `new Map()` 之类会与那条门禁
 * 重复报告，这是有意为之。
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

        const m = t.match(/new\s+([A-Za-z_$][\w$.]*)\s*(?:<[^(]*>)?\s*\(/);

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
