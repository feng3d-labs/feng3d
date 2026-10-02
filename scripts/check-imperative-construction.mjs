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
 * ## 两处 math 豁免已收回（issue #134 阶段 C 收尾）
 *
 * 本脚本原先有两处豁免，都只为 `@feng3d/math` 里 `Color3` / `Color4` / `Vector2` /
 * `Vector3` / `Vector4` 的**同名 class** 而存在：
 *
 * 1. `SKIP_PACKAGES = new Set(['packages/math'])`——整个 math 包跳过；
 * 2. `CLASS_PROVIDERS = ['packages/math']`——别的包从 math 导入同名 class 时放行。
 *
 * 阶段 C（C-a…C-f）删掉了 math 里全部 19 个数值 / 几何 class，这 5 个名字在 math 里
 * **已经是纯数据 interface**（与 feng3d 里的同名 interface 同源），两处豁免**再无豁免对象**，
 * 是纯死代码——留着反而会把 `new Vector3()` 这类真违规放过去。因此 C 收尾一并删除，
 * 并把基线按实测收紧（旧基线里 12 条存量早已在 HEAD 上不存在）。
 *
 * 现在唯一的排除规则是：**名字在本文件里没有任何导入**（文件内自己声明的 class / 全局）
 * 不报——那显然不是在用纯数据 interface 的名字。
 *
 * ## 最后一处存量是「同名假阳性」（issue #134 R3 收尾）
 *
 * 基线最后一条是 `packages/webgpu/examples/src/webgpu/cornell/index.ts::Scene`，
 * 它**不是**在用引擎的纯数据 interface `Scene`：那一行是 `import Scene from './scene'`，
 * 指向示例同目录的 `scene.ts`（`export default class Scene`，constructor 里构建顶点 / 索引 /
 * quad 数据，无 `__type__`），与引擎 `Scene` 毫无关系。本脚本的判据是「名字有导入 +
 * 名字在纯数据类名单里」、**不看导入来源**，于是把它误判成违规——按判据改成
 * `{ __type__: 'Scene' }` 会让示例直接崩掉（`radiosity.ts` / `rasterizer.ts` 要用
 * `scene.quads` / `scene.quadBuffer` / `scene.vertexAttributes`）。
 * 处置是**重命名示例本地类** `Scene` → `CornellScene`（纯机械重命名、行为零变化），
 * 同名歧义与假阳性一起消失，判据与严格性未动。
 *
 * **已知局限（待办）**：判据不看导入来源，因此任何「本地类型与纯数据类同名」的位置都会被
 * 误报。更精确的做法是要求该名字来自 `@feng3d/*` 或 schema 产物里的模块，需要时单开 issue。
 *
 * ## 为什么是「基线冻结 + 新增即失败」
 *
 * 实测全仓（`packages/**` + `examples/**`）曾有 **36 处**：`editor` 22、`examples/src` 13、
 * `webgpu/examples` 1（#353 正文统计，含注释里的旧写法）。editor 那 22 处**没有测试覆盖**
 * （它是 UI 应用），把 `new Object3D()` 改成字面量很可能引入静默行为差异，一次改完风险高。
 * 所以照 `check-toplevel-new.mjs` / `check-layer-direction.mjs` 的成熟做法：
 * 存量冻结在基线、**新增即失败**、清理完跑 `--update` 收紧。
 *
 * **现状：基线 `entries` 已为空（0 处）**——`examples/src` 的 12 处在阶段 C 收尾按实测收紧
 * （它们当时在 HEAD 上早已不存在），最后 1 处（cornell）经核实是上文的同名假阳性。
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
// 2. 扫描源码，找 `new <纯数据类>` 且名字来自该纯数据 interface 的用法
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
 * 收集文件里被 import 进来的名字（含 `as` 别名与默认导入）。
 *
 * **只看"有没有导入"，不看从哪儿导入**：阶段 C 收尾删掉了两处 math 豁免之后，
 * `Color3` / `Color4` / `Vector2` / `Vector3` / `Vector4` 在 math 里也不再有同名 class，
 * 「同一个名字两种来源」的歧义随之消失——现在只要名字有导入、且名字在纯数据类名单里，
 * 用 `new` 就是违规。
 *
 * @param code 文件内容
 * @returns 导入的名字集合
 */
function importedNamesOf(code)
{
    const names = new Set();
    const cleaned = code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
    const RE = /\bimport\s+(?:type\s+)?(?!\()([\s\S]*?)\bfrom\s*['"]([^'"]+)['"]/g;

    for (const m of cleaned.matchAll(RE))
    {
        const clause = m[1];
        const named = clause.match(/\{([\s\S]*?)\}/);

        if (named)
        {
            for (const part of named[1].split(','))
            {
                const raw = part.trim();
                const name = raw.split(/\s+as\s+/).pop()?.trim();

                if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
            }
        }

        // 默认导入（`import Color4 from '...'`）同样算"有导入"
        const def = clause.replace(/\{[\s\S]*?\}/g, '').replace(/,/g, ' ').trim();

        if (/^[A-Za-z_$][\w$]*$/.test(def)) names.add(def);
    }

    return names;
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
    const imported = importedNamesOf(code);
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
            if (!imported.has(name)) continue;

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

        if (statSync(full).isDirectory())
        {
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
    console.log(`\n扫描范围：${SCAN_DIRS.join('、')}（无整包豁免；math 的数值 / 几何 class 已在 issue #134 阶段 C 删完）`);

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
        note: 'R3（纯数据声明式，issue #353）的存量基线：对纯数据类使用 `new` 的位置与次数。**基线已归零（entries 为空）**，新增即失败。键是「相对路径::类型名」，值是出现次数——刻意不含行号（行号会随无关改动漂移，导致门禁频繁误报），但保留次数（否则同文件同类型新增第二处会被漏掉）。纯数据类名单由 scripts/gen-objectview-schema.mjs 的产物（dataTypeSchema.ts 顶层键）给出。issue #134 阶段 C 收尾时已收回两处 math 豁免（`@feng3d/math` 的同名 class 与 `packages/math` 包内——那些 class 已全部删除），并按实测把基线从 13 处收紧到 1 处；R3 收尾时最后 1 处（cornell）经核实是「本地 class 与纯数据类同名」的假阳性，已用重命名消除，基线清零。',
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

if (knownTotal === 0 && total === 0)
{
    console.log('✅ R3 纯数据声明式：全仓无对纯数据类的 `new`（基线 entries 为空，新增即失败）');
}
else
{
    console.log(`✅ R3 纯数据声明式：无新增命令式构造（存量 ${knownTotal} 处已冻结在基线，当前 ${total} 处）`);
}

if (decreased.length > 0)
{
    const goneCount = decreased.reduce((a, v) => a + (v.before - v.after), 0);

    console.log(`   （有 ${goneCount} 处存量已被清理，可以跑 --update 收紧基线：${decreased.slice(0, 5).map((v) => v.key).join('、')}${decreased.length > 5 ? ' …' : ''}）`);
}
