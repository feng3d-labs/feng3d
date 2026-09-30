/**
 * R3：纯数据声明式——禁止对「纯数据类」使用 `new`（issue #353）。
 *
 * 规范：`AGENTS.md` §2 与 §11 要求纯数据类一律用 `__type__` 字面量声明
 * （`{ __type__: 'CubeGeometry', ... }`），不许 `new CubeGeometry()`。
 * §15 的元规则要求每条规范必须有机器执行者——此前 R3 那行写的自研规则
 * `feng3d/no-imperative-construction` **并不存在**，R3 因此一直没有执行者。
 *
 * ## 判据的名单从哪来
 *
 * 「纯数据类」名单**不在这里硬编码**，而是与 `scripts/gen-objectview-schema.mjs` 同源：
 * 该生成器的产物 `packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts`
 * 里的顶层键，就是「自带 `readonly __type__: '<字面量>'` 的导出 interface」全集
 * （66 个）。本脚本直接用 TS 编译器 API **读那份产物的 AST** 取键——名单随生成器
 * 一起变，不会两处漂移。
 *
 * ## 两类必须排除的合法 `new`（这是整套检测最容易做错的地方）
 *
 * 1. **从 `@feng3d/math` 导入的同名 class**：`Color4` / `Color3` 在 `feng3d` 里是纯数据
 *    interface，在 `@feng3d/math` 里是**真的 class**。同一个名字两种来源，
 *    靠"看名字"根本分不出来——必须看**这个名字在本文件里是从哪儿导入的**。
 *    所以判据是：**该名字若能从某个「把该名字作为 class 导出」的包解析到，即放行**。
 *    典型现场：`packages/feng3d/src/textures/createTexture.ts` 的 6 处 `new Color4()`
 *    用的是 `@feng3d/math` 的 class，**合法**。
 * 2. **`packages/math` 包内部**：它**就是** `Color3`/`Color4` 这些 class 的定义处，
 *    包内 `new` 是既有实现细节，整个包直接跳过。
 *
 * 另外，名字**没有任何导入**（文件内自己声明的 class / 全局）也不报——那显然不是
 * 在用纯数据 interface 的名字。
 *
 * ## 为什么是「基线冻结 + 新增即失败」
 *
 * 实测全仓（`packages/**` + `examples/**`）有 **36 处**：`editor` 22、`examples/src` 13、
 * `webgpu/examples` 1。editor 那 22 处**没有测试覆盖**（它是 UI 应用），把
 * `new Object3D()` 改成字面量很可能引入静默行为差异，一次改完风险高。
 * 所以照 `check-toplevel-new.mjs` / `check-layer-direction.mjs` 的成熟做法：
 * 存量冻结在基线、**新增即失败**、清理完跑 `--update` 收紧。
 *
 * 用法：
 *   node scripts/check-imperative-construction.mjs            # 校验（CI 用）
 *   node scripts/check-imperative-construction.mjs --update   # 重写基线
 *   node scripts/check-imperative-construction.mjs --list     # 打印全部存量
 *   node scripts/check-imperative-construction.mjs --stats    # 打印名单与统计
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const BASELINE = join(ROOT, 'scripts', 'imperative-construction-baseline.json');

/** schema 产物（纯数据类名单的来源，与 gen-objectview-schema.mjs 同源） */
const SCHEMA_FILE = 'packages/editor/src/vue-app/objectview/generated/dataTypeSchema.ts';

/** 扫描范围：引擎本体 + 示例 + webgpu 的示例 */
const SCAN_DIRS = ['packages', 'examples'];

/** 跳过的目录（与 check-toplevel-new.mjs 对齐） */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp']);

/**
 * 整个包直接跳过。
 *
 * `packages/math` 是 `Color3`/`Color4` 等 class 的**定义处**，包内 `new` 是既有实现细节——
 * 它和 `feng3d` 里的同名纯数据 interface 是两回事（见文件头「两类必须排除」）。
 */
const SKIP_PACKAGES = new Set(['packages/math']);

/**
 * 「同名 class 的合法提供方」白名单。
 *
 * `@feng3d/math` 里的 `Color3`/`Color4` 是**真的 class**，与 `feng3d` 里同名的纯数据
 * interface 完全是两码事。只有从这个包直接导入时才算合法——`packages/math` 包内
 * 已由 `SKIP_PACKAGES` 整包跳过，所以这里只看"别的包从 math 导入"的情况。
 */
const CLASS_PROVIDERS = ['packages/math'];

const args = process.argv.slice(2);
const update = args.includes('--update');
const list = args.includes('--list');
const stats = args.includes('--stats');

// ---------------------------------------------------------------------------
// 1. 纯数据类名单：读 dataTypeSchema.ts 的顶层键
// ---------------------------------------------------------------------------

/**
 * 取 schema 产物里 `DATA_TYPE_SCHEMA` 对象字面量的顶层键。
 *
 * 用 TS 编译器 API 而不是正则：字面量键既可能是 `'CubeGeometry'` 也可能是
 * `CubeGeometry`，且文件里还有别的对象字面量（字段描述），正则很容易连它们一起捞进来。
 *
 * @returns 纯数据类名集合
 */
function readPureDataNames()
{
    const file = join(ROOT, SCHEMA_FILE);

    let source;

    try
    {
        source = readFileSync(file, 'utf8');
    }
    catch
    {
        console.error(`❌ 读不到 schema 产物 ${SCHEMA_FILE}`);
        console.error('   先跑：node scripts/gen-objectview-schema.mjs');
        process.exit(1);
    }

    const sourceFile = ts.createSourceFile(SCHEMA_FILE, source, ts.ScriptTarget.Latest, true);
    const names = new Set();

    /** @param node 语法树节点 */
    function visit(node)
    {
        if (ts.isVariableDeclaration(node)
            && node.name.getText(sourceFile) === 'DATA_TYPE_SCHEMA'
            && node.initializer
            && ts.isObjectLiteralExpression(node.initializer))
        {
            for (const prop of node.initializer.properties)
            {
                if (prop.name) names.add(prop.name.getText(sourceFile).replace(/^'|'$/g, ''));
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return names;
}

// ---------------------------------------------------------------------------
// 2. 每个包「把哪些名字作为 class 导出」——用于排除 math 的同名 class
// ---------------------------------------------------------------------------

/**
 * 收集一个文件里 `export class` 的名字，以及它转发出去的文件 / 包。
 *
 * **必须追 `export *`**：`@feng3d/math` 的入口写的是 `export * from './Color4'`，
 * 只认显式导出列表的话就会以为 math 没导出 `Color4`，进而把 6 处合法的
 * `new Color4()`（用的就是 math 的 class）全部误报成违规——实测踩过。
 *
 * @param file 绝对路径
 * @returns `{ classes, wildcards }`
 */
function scanExports(file)
{
    const classes = new Set();
    const wildcards = [];

    let text;

    try
    {
        text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
    }
    catch
    {
        return { classes, wildcards };
    }

    for (const m of text.matchAll(/\bexport\s+(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g)) classes.add(m[1]);
    for (const m of text.matchAll(/\bexport\s+default\s+(?:abstract\s+)?class(?:\s+([A-Za-z_$][\w$]*))?/g)) classes.add(m[1] ?? 'default');

    for (const m of text.matchAll(/\bexport\s+\*\s+from\s*['"]([^'"]+)['"]/g)) wildcards.push(m[1]);

    return { classes, wildcards };
}

/** 包名 → 该包对外导出的 class 名集合（惰性求值一次） */
const packageClasses = new Map();

/**
 * 取包入口导出的 class 名集合。
 *
 * 只用来回答一件事：**这个名字从这个包进来时，是不是一个真的 class**。
 * 是 → 放行（`@feng3d/math` 的 `Color4`）；不是 → 它就是这个包里的纯数据 interface
 * （`feng3d` 的 `Color4`），用 `new` 即违规。
 *
 * @param pkgRoot 包根目录（相对仓库根，如 `packages/math`）
 * @returns class 名集合（读不到入口时为空集）
 */
function classNamesOf(pkgRoot)
{
    if (packageClasses.has(pkgRoot)) return packageClasses.get(pkgRoot);

    const classes = new Set();
    const seen = new Set();
    const queue = [];

    try
    {
        const pkg = JSON.parse(readFileSync(join(ROOT, pkgRoot, 'package.json'), 'utf8'));
        const entry = pkg.exports?.['.']?.import ?? pkg.exports?.['.']?.default ?? pkg.module ?? pkg.main ?? 'src/index.ts';

        queue.push(join(ROOT, pkgRoot, entry));
    }
    catch
    {
        // 没有 package.json：当成空集
    }

    while (queue.length > 0)
    {
        const file = queue.shift().replace(/\\/g, '/');

        if (seen.has(file)) continue;
        seen.add(file);

        const { classes: own, wildcards } = scanExports(file);

        own.forEach((n) => classes.add(n));

        for (const spec of wildcards)
        {
            // 只追相对转发：`export * from '@feng3d/math'` 是**跨包再导出**，
            // 从 feng3d 侧 `new Color4()` 恰恰是本门禁要拦的（issue #353 的破坏实验②），
            // 不能因为能追到 math 的 class 就放行。
            if (!spec.startsWith('.')) continue;

            const dir = file.split('/').slice(0, -1);

            for (const part of spec.split('/'))
            {
                if (part === '' || part === '.') continue;
                else if (part === '..') dir.pop();
                else dir.push(part);
            }

            const full = dir.join('/');

            if (full.endsWith('.ts')) queue.push(full);
            else
            {
                queue.push(`${full}.ts`);
                queue.push(`${full}/index.ts`);
            }
        }
    }

    packageClasses.set(pkgRoot, classes);

    return classes;
}

// ---------------------------------------------------------------------------
// 3. 扫描源码，找 `new <纯数据类>` 且名字来自该纯数据 interface 的用法
// ---------------------------------------------------------------------------

/**
 * 把绝对路径转成仓库根相对路径（正斜杠）。
 *
 * @param file 绝对路径
 * @returns 相对路径
 */
function relOf(file)
{
    return relative(ROOT, file).replace(/\\/g, '/');
}

/**
 * 从文件路径推出所属包根目录（`packages/xxx`）。`examples` 不是包，返回自身。
 *
 * @param rel 仓库根相对路径
 * @returns 包根目录，或 null
 */
function packageRootOf(rel)
{
    const parts = rel.split('/');

    if (parts[0] === 'packages' && parts.length > 2) return `packages/${parts[1]}`;

    return null;
}

/**
 * 解析 import 说明符到"提供该名字的包根目录"。
 *
 * @param spec 说明符（如 `@feng3d/math`、`../color/Color4`）
 * @param rel 当前文件（仓库根相对路径）
 * @returns 包根目录；解析不出（第三方包、跨包相对路径等）返回 null
 */
function resolveSpecifier(spec, rel)
{
    if (spec.startsWith('@feng3d/')) return `packages/${spec.slice('@feng3d/'.length)}`;
    if (spec === 'feng3d') return 'packages/feng3d';
    if (!spec.startsWith('.')) return null;

    const base = rel.split('/').slice(0, -1);

    for (const part of spec.split('/'))
    {
        if (part === '' || part === '.') continue;
        else if (part === '..') base.pop();
        else base.push(part);
    }

    return packageRootOf(base.join('/'));
}

/**
 * 收集文件里每个名字的导入来源。
 *
 * 只看 `import { A, B as C } from '...'`。**必须看来源**：`Color4` 在 `feng3d` 是纯数据
 * interface、在 `@feng3d/math` 是 class，同样的 `new Color4()` 一个是违规一个合法。
 *
 * @param code 文件内容
 * @param rel 仓库根相对路径
 * @returns 名字 → 来源包根目录（解析不出的来源记为 null，表示"与本仓包无关，放行"）
 */
function importSourcesOf(code, rel)
{
    const sources = new Map();
    const cleaned = code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
    const RE = /\bimport\s+(?:type\s+)?(?!\()([\s\S]*?)\bfrom\s*['"]([^'"]+)['"]/g;

    for (const m of cleaned.matchAll(RE))
    {
        const clause = m[1];
        const source = resolveSpecifier(m[2], rel);
        const named = clause.match(/\{([\s\S]*?)\}/);

        if (named)
        {
            for (const part of named[1].split(','))
            {
                const raw = part.trim();
                const name = raw.split(/\s+as\s+/).pop()?.trim();

                if (name && /^[A-Za-z_$][\w$]*$/.test(name)) sources.set(name, source);
            }
        }

        // `import Color4 from '@feng3d/math'` 这种默认导入同样可能是在用 math 的 class
        const def = clause.replace(/\{[\s\S]*?\}/g, '').replace(/,/g, ' ').trim();

        if (/^[A-Za-z_$][\w$]*$/.test(def)) sources.set(def, source);
    }

    return sources;
}

/**
 * 扫描单个文件里的 `new <纯数据类>()`。
 *
 * @param file 绝对路径
 * @returns 命中的「相对路径::类型名」列表（同文件可多次重复出现）
 */
function scanFile(file)
{
    const rel = relOf(file);
    const code = readFileSync(file, 'utf8');
    const sources = importSourcesOf(code, rel);
    const found = [];

    code.split(/\r?\n/).forEach((line) =>
    {
        const t = line.trim();

        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;

        for (const m of t.matchAll(/\bnew\s+([A-Za-z_$][\w$]*)\s*\(/g))
        {
            const name = m[1];

            if (!PURE_DATA.has(name)) continue;

            // 没有导入 = 文件内自己声明的 class（或全局），不是在用纯数据 interface 的名字
            if (!sources.has(name)) continue;

            // 来源是"同名 class 的提供方"（`@feng3d/math` 的 Color4/Color3）→ 合法
            const source = sources.get(name);

            if (source && CLASS_PROVIDERS.includes(source) && classNamesOf(source).has(name)) continue;

            found.push(`${rel}::${name}`);
        }
    });

    return found;
}

/**
 * 递归扫描目录下的 .ts 文件。
 *
 * @param dir 绝对路径
 * @param out 收集数组
 * @returns 收集数组
 */
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
        const rel = relOf(full);

        if (statSync(full).isDirectory())
        {
            if (SKIP_PACKAGES.has(rel)) continue;
            walk(full, out);
        }
        else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts'))
        {
            out.push(...scanFile(full));
        }
    }

    return out;
}

// ---------------------------------------------------------------------------
// 4. 主流程
// ---------------------------------------------------------------------------

const PURE_DATA = readPureDataNames();

const found = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

/**
 * 「文件::类型」→ 出现次数。
 *
 * **为什么不只记组合、还要记次数**：只记组合的话，同一个文件里同一类型**新增第 2 处**
 * 时组合不变，门禁会漏报（实测：在 `GeometryTest.ts` 里再加一个 `new CubeGeometry()`
 * 时计数不变，破坏实验① 直接绿了）。记次数就能如实反映增长，且仍然**不含行号**——
 * 行号会随无关改动漂移，导致门禁频繁误报。
 */
const counts = new Map();

for (const key of found) counts.set(key, (counts.get(key) || 0) + 1);

const total = found.length;

if (stats)
{
    console.log(`纯数据类名单（来自 ${SCHEMA_FILE}）：${PURE_DATA.size} 个`);
    console.log(`  ${[...PURE_DATA].sort().join('、')}`);
    console.log(`\n扫描范围：${SCAN_DIRS.join('、')}（跳过 ${[...SKIP_PACKAGES].join('、')} 整包）`);

    const byArea = new Map();

    for (const key of found)
    {
        // `packages/xxx/...` 取到包名；`examples/...` 取到 examples
        const parts = key.split('/');
        const area = parts[0] === 'packages' ? parts.slice(0, 2).join('/') : parts[0];

        byArea.set(area, (byArea.get(area) || 0) + 1);
    }

    console.log(`\n命中 ${total} 处（可执行代码） / ${counts.size} 个「文件::类型」组合：`);
    [...byArea].sort().forEach(([area, n]) => console.log(`  ${area}: ${n} 处`));
    process.exit(0);
}

if (list)
{
    [...counts].sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, n]) => console.log(`  ${key}  ×${n}`));
    console.log(`\n共 ${counts.size} 个「文件::类型」组合、${total} 处`);
    process.exit(0);
}

if (update)
{
    const baseline = {
        note: 'R3（纯数据声明式，issue #353）的存量基线：对纯数据类使用 `new` 的位置与次数。新增即失败；清理掉存量后请重跑 --update。键是「相对路径::类型名」，值是出现次数——刻意不含行号（行号会随无关改动漂移，导致门禁频繁误报），但保留次数（否则同文件同类型新增第二处会被漏掉）。纯数据类名单由 scripts/gen-objectview-schema.mjs 的产物（dataTypeSchema.ts 顶层键）给出；`@feng3d/math` 的同名 class 与 packages/math 包内不计入。注意：issue #353 正文统计的 36 处**含注释里的旧写法示例**（editor 的 22 处全部是注释，核对过），本门禁只统计可执行代码，故基线是 13 处。',
        entries: Object.fromEntries([...counts].sort((a, b) => a[0].localeCompare(b[0]))),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线（${Object.keys(baseline.entries).length} 个组合、${total} 处）`);
    process.exit(0);
}

let baseline;

try
{
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
}
catch
{
    console.error(`❌ 读不到基线 ${relOf(BASELINE)}：先跑一次 --update 并提交进仓库`);
    process.exit(1);
}

const known = baseline.entries ?? {};
const increased = [];
const decreased = [];

for (const [key, n] of counts)
{
    const before = known[key] ?? 0;

    if (n > before) increased.push({ key, before, after: n });
}

for (const [key, before] of Object.entries(known))
{
    const after = counts.get(key) ?? 0;

    if (after < before) decreased.push({ key, before, after });
}

const knownTotal = Object.values(known).reduce((a, b) => a + b, 0);

if (increased.length > 0)
{
    const addCount = increased.reduce((a, v) => a + (v.after - v.before), 0);

    console.error(`❌ 新增了对纯数据类的 \`new\`（R3）：${addCount} 处，涉及 ${increased.length} 个位置`);
    increased.forEach((v) => console.error(`  + ${v.key}  ${v.before} → ${v.after} 次`));
    console.error('\n修法：改成 `__type__` 字面量声明（AGENTS.md §2 / §11），把构造交给 logic 工厂。');
    console.error('     例：new CubeGeometry() → { __type__: \'CubeGeometry\' }');
    process.exit(1);
}

console.log(`✅ R3 纯数据声明式：无新增命令式构造（存量 ${knownTotal} 处已冻结在基线，当前 ${total} 处）`);

if (decreased.length > 0)
{
    const goneCount = decreased.reduce((a, v) => a + (v.before - v.after), 0);

    console.log(`   （有 ${goneCount} 处存量已被清理，可以跑 --update 收紧基线：${decreased.slice(0, 5).map((v) => v.key).join('、')}${decreased.length > 5 ? ' …' : ''}）`);
}
