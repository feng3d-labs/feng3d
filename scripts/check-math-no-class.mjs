/**
 * math 去 class 化（issue #134）：禁止 `packages/math` 里新增目标类型的 `export class`。
 *
 * 规范：`docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §7 阶段 C 第 7 条——
 * `packages/math/src` 内除白名单外不得出现 `export class`。
 *
 * ## 范围已扩大（用户明确要求）：math **全树**去 class，分批收敛
 *
 * 原方案 §8 把范围划成「数值 / 几何 + 渐变」，把曲线 / 形状 / 字体与 `Mathf` / `Noise` / `Time`
 * 都排除在外。用户后来把范围**扩大到 `packages/math` 全树**（不必出现 class，全部纯数据 + 函数），
 * 所以本判据的**终极目标是 math 全树 `export class` 为 0**——但仍是**分批收敛**：
 * 每批扩一次名单、`--update` 收紧一次基线，**不是**一次改成「所有 `export class`」（理由见下）。
 *
 * 判据名单分三组（**27 个**）：
 *
 * - **阶段 C1**：第一批「数值 / 几何类型」**19 个**；
 * - **渐变族**：`Gradient` / `MinMaxGradient` **2 个**（issue #134 收尾批落地）；
 * - **批 A「纯 static 工具容器」**：`Mathf` / `Time` / `ShapeUtils` / `Interpolations` /
 *   `HighFunction` / `EquationSolving` **6 个**（本批新增，见同文 §11.18）——
 *   它们无继承、无多态分发，转换方式就是「`static` 方法 → 模块级纯函数」，所以先做。
 *
 * ## 为什么判据是「显式写死的 27 个名字」而不是「所有 export class」
 *
 * 实测（批 A 收尾）`packages/math/src` 里剩 **23 个 `export class`**：
 *
 * - **16 个**是 `shape/` 的继承树与曲线族（`shape/core` 的 `Curve<T>` 基类 / `CurvePath` / `Font` /
 *   `Path2` / `Shape2` / `ShapePath2` + `shape/curves` 的 10 个 `extends Curve<T>` 的子类）——
 *   纯函数形态需要「tagged union + 分发」或保留继承，**改造性质与前面几批不同**（同文 §8 划界）；
 * - **4 个**是 `curve/` 的 `AnimationCurve` / `AnimationCurveVector3` / `MinMaxCurve` /
 *   `MinMaxCurveVector3`（依赖链要先理清）；
 * - **2 个**是 `bezier/Bezier` 与 `curve/BezierCurve`——**逐方法重复的两份实现**
 *   （`packages/feng3d/test/bezierConsistency.spec.ts` 专门钉住它们行为一致），
 *   去 class 化是**把它们合并成一份的唯一窗口**，要单列一批；
 * - **1 个**是 `src/Noise`（有实例状态，形态要先定）。
 *
 * 所以「所有 `export class`」当判据会**一次误伤这 23 个**、门禁第一天就是红的。
 * 名单显式写在这里是**有意的**：每删掉一批就 `--update` 收紧一次基线，
 * **`entries` 归零即「math 全树再无 `export class`」——那是本方案的终点**。
 *
 * **补充（`MathUtil` 迁移批）**：`packages/polyfill/src/MathUtil.ts` 的 `class MathUtil`
 * 已迁入 `packages/math/src/mathutil.ts` 并纯函数化（`mathUtil*` 前缀），本判据不受影响
 * （`MathUtil` 从来不在写死的 27 个目标类型里），但它让 math 全树的 `export class` 又少 1 个。
 *
 * ## 判据口径
 *
 * - **只看 `export class`**：非导出的内部 class 不构成对外 API，不管；
 * - **看整个 `packages/math/src` 全树**（不是只看已知文件）：把目标类型搬进新文件、
 *   或在别的文件里再写一份 `export class Vector3`，都会成为**新键**而被拦下；
 * - **键是「相对路径::类型名」，值是出现次数**（照 `check-imperative-construction.mjs` 的成熟做法）：
 *   不含行号（行号随无关改动漂移会让门禁频繁误报），但保留次数（同文件同类型新增第二处会被漏掉）；
 * - **新增即失败**；删完了跑 `--update` 收紧基线。
 *
 * ## 与 R3 门禁的分工（不要合并）
 *
 * `check-imperative-construction.mjs`（R3）拦的是「对纯数据类用 `new`」，其名单取自
 * `gen-objectview-schema.mjs` 的产物，**本来就不含 `Vector3` 等**（实测产物里只有
 * `Color3` / `Color4`，见方案 §5.9）。所以：
 *
 * | 想拦的东西 | 该用哪条门禁 |
 * |---|---|
 * | `new Vector3()` 这类命令式构造 | **本脚本**（名字——它现在真的是 class） |
 * | math 的 `Color3`/`Color4` class 被 `new` | `check-imperative-construction.mjs`（R3，收 `CLASS_PROVIDERS` 豁免） |
 * | 删完 class 之后的 `new Vector3()` / `new Gradient()` | R3（`Gradient` / `MinMaxGradient` 加进判据后已由 R3 覆盖，见方案 §11.16） |
 *
 * 三件事互相补充，不是重复。
 *
 * 用法：
 *   node scripts/check-math-no-class.mjs            # 校验（CI 用）
 *   node scripts/check-math-no-class.mjs --update   # 重写基线
 *   node scripts/check-math-no-class.mjs --list     # 打印全部存量
 *   node scripts/check-math-no-class.mjs --stats    # 打印名单与统计
 *
 * ## 怎么进 CI 的（以及为什么不直接写进 `.github/workflows/ci.yml`）
 *
 * 挂在根 `package.json` 的 **`prelint:ci`** 钩子上（`npm run lint:ci` 会自动先跑它），
 * 而 `.github/workflows/ci.yml` 的质量门禁 job 第一步就是 `npm run lint:ci`——所以它随那一步进 CI。
 *
 * 这么做是**照仓库既有先例**，不是绕路：改 workflow 文件需要 `workflow` scope 的凭据，
 * 本仓的推送凭据只有 `repo` / `gist` / `read:org`，改动会被 GitHub 直接拒收
 * （实测：`refusing to allow an OAuth App to create or update workflow ... without workflow scope`）。
 * `scripts/check-examples-imports.mjs` 当年正是因为同一个限制才挂在 `prelint:examples` 上
 * （见 `docs/CI.md` §2.1 末尾的说明）。等有 `workflow` scope 时，把下面这步并列加到
 * 「纯数据声明式（R3，issue #353）」之后即可（脚本本身无需改动）：
 *
 * ```yaml
 *       - name: math 目标类型禁止新增 class（issue #134）
 *         run: node scripts/check-math-no-class.mjs
 * ```
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { assertScanVolume } from './scan-volume.mjs';

const ROOT = process.cwd();
const BASELINE = join(ROOT, 'scripts', 'math-no-class-baseline.json');

/** 扫描范围：math 包源码全树（含尚未建目录的子路径） */
const SCAN_DIR = 'packages/math/src';

/** 跳过的目录 */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', '.git', 'tmp']);

/**
 * 判据名单：**已经去 class 化、不允许再变回 class** 的目标类型。
 *
 * **这是有意的硬编码**——不要改成「扫出所有 `export class`」，理由见文件头。
 *
 * - 第一批（阶段 C1，19 个）：与 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §8 的「第一批」逐字一致；
 * - 渐变族（issue #134 收尾批，2 个）：与同文 §8 的「渐变（2）」一致——
 *   该组的改造性质与数值类型相同（数据容器 + 取值函数，无继承），所以不随「曲线 / 形状」
 *   那一批押后；加进名单后它们不能再变回 class；
 * - 批 A「纯 static 工具容器」（6 个）：`Mathf` / `Time` / `ShapeUtils` / `Interpolations` /
 *   `HighFunction` / `EquationSolving`——用户把范围扩到 math 全树后的第一批，
 *   转换方式都是「`static` / 无状态实例方法 → 模块级纯函数」（同文 §11.18）。
 */
const TARGET_TYPES = [
    // 向量 / 旋转 / 矩阵
    'Vector2', 'Vector3', 'Vector4', 'Quaternion', 'Matrix3x3', 'Matrix4x4',
    // 颜色
    'Color3', 'Color4',
    // 几何体
    'Box3', 'Euler', 'Frustum', 'Line3', 'Plane', 'Ray3', 'Rectangle', 'Segment3',
    'Sphere', 'Triangle3', 'TriangleGeometry',
    // 渐变（第二批「渐变族」，issue #134 收尾批）
    'Gradient', 'MinMaxGradient',
    // 批 A：纯 static 工具容器（用户把范围扩到 math 全树后的第一批，见 §11.18）
    'Mathf', 'Time', 'ShapeUtils', 'Interpolations', 'HighFunction', 'EquationSolving',
];

const args = process.argv.slice(2);
const update = args.includes('--update');
const list = args.includes('--list');
const stats = args.includes('--stats');

// ---------------------------------------------------------------------------
// 1. 扫描 `packages/math/src` 全树的 `export class`
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
 * 收集一个文件里 `export class` 的 **目标类型** 名字。
 *
 * 先删注释再匹配：文件头 / JSDoc 里写 `export class Vector3` 当反例说明是常见写法，
 * 不删注释会把文档当违规（`check-imperative-construction.mjs` 的 `scanExports` 同款处理）。
 *
 * @param code 文件内容
 * @returns 命中的类型名数组（同一名字可多次出现）
 */
function scanExportClasses(code)
{
    const cleaned = code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
    const found = [];

    for (const m of cleaned.matchAll(/\bexport\s+(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g))
    {
        if (TARGET_TYPES.includes(m[1])) found.push(m[1]);
    }

    // `export default class Vector3` / `export default class`（匿名）
    for (const m of cleaned.matchAll(/\bexport\s+default\s+(?:abstract\s+)?class(?:\s+([A-Za-z_$][\w$]*))?/g))
    {
        if (m[1] && TARGET_TYPES.includes(m[1])) found.push(m[1]);
    }

    return found;
}

/**
 * 全树统计：`export class` 总数（含非目标类型，用于让「判据边界」可见）与目标类型命中。
 *
 * @returns `{ counts, allClasses, files }`
 */
function scan()
{
    const counts = new Map();
    const allClasses = new Map();
    const files = [];

    /** @param dir 绝对路径 */
    function walk(dir)
    {
        let entries;

        try
        {
            entries = readdirSync(dir);
        }
        catch
        {
            return;
        }

        for (const name of entries)
        {
            if (SKIP_DIRS.has(name)) continue;

            const full = join(dir, name);

            if (statSync(full).isDirectory()) { walk(full); continue; }
            if (!name.endsWith('.ts') || name.endsWith('.d.ts')) continue;

            files.push(relOf(full));

            const code = readFileSync(full, 'utf8');
            const target = scanExportClasses(code);

            for (const type of target)
            {
                const key = `${relOf(full)}::${type}`;

                counts.set(key, (counts.get(key) || 0) + 1);
            }

            // 非目标类型也要数，才能把「50 个里只判 19 个」这个边界如实打出来
            const cleaned = code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

            for (const m of cleaned.matchAll(/\bexport\s+(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g))
            {
                allClasses.set(m[1], (allClasses.get(m[1]) || 0) + 1);
            }
        }
    }

    walk(join(ROOT, SCAN_DIR));

    return { counts, allClasses, files };
}

// ---------------------------------------------------------------------------
// 2. 主流程
// ---------------------------------------------------------------------------

const { counts, allClasses, files } = scan();

assertScanVolume({
    label: 'math 去 class 扫描（packages/math/src 下的 .ts）',
    count: files.length,
    min: 1,
    detail: `扫描范围：${SCAN_DIR}；命中数为 0 是终极目标（不是异常），但扫到的文件数不能为 0。`,
});

const total = [...counts.values()].reduce((a, b) => a + b, 0);
const allTotal = [...allClasses.values()].reduce((a, b) => a + b, 0);
const outside = [...allClasses.keys()].filter((n) => !TARGET_TYPES.includes(n)).sort();

if (stats)
{
    console.log(`目标类型名单（写死在脚本里的 ${TARGET_TYPES.length} 个）：`);
    console.log(`  ${TARGET_TYPES.join('、')}`);
    console.log(`\n扫描范围：${SCAN_DIR}（${files.length} 个 .ts 文件）`);
    console.log(`math 全树 export class（目标为 0，分批收敛中）：${allTotal} 个`);
    console.log(`其中目标类型命中：${total} 个「文件::类型」组合`);
    console.log(`不在判据内（后续批次，${outside.length} 个）：`);
    console.log(`  ${outside.join('、')}`);
    process.exit(0);
}

if (list)
{
    [...counts].sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, n]) => console.log(`  ${key}  ×${n}`));
    console.log(`\n共 ${counts.size} 个「文件::类型」组合、${total} 个 export class`);
    process.exit(0);
}

if (update)
{
    const baseline = {
        note: `math 全树去 class 的存量基线（C1 建立、每批删完就收紧一次）：packages/math/src 里「目标类型」的 export class 位置与个数。判据名单写死在 scripts/check-math-no-class.mjs 的 TARGET_TYPES（${TARGET_TYPES.length} 个名字 = 阶段 C1 的 19 个 + 渐变族 2 个 + 批 A 的 6 个纯 static 工具容器）——刻意不用「所有 export class」当判据，因为 math 全树还剩 ${allTotal} 个 export class，其中 ${outside.length} 个（曲线 / 形状继承树、Noise、curve/ 家族、Bezier 重复对）要按批推进。**终极目标是 entries 归零（math 全树无 export class）**，分批收敛。键是「相对路径::类型名」，值是出现次数：不含行号（行号会随无关改动漂移导致误报），但保留次数（否则同文件同类型新增第二处会被漏掉）。新增即失败；每删掉一批就重跑 --update 收紧基线。`,
        entries: Object.fromEntries([...counts].sort((a, b) => a[0].localeCompare(b[0]))),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线（${Object.keys(baseline.entries).length} 个组合、${total} 个 export class）`);
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

    console.error(`❌ packages/math 新增了目标类型的 \`export class\`（math 全树去 class）：${addCount} 处，涉及 ${increased.length} 个位置`);
    increased.forEach((v) => console.error(`  + ${v.key}  ${v.before} → ${v.after} 个`));
    console.error('\n修法：本方案的目标是**消灭**这些 class，不是新增。');
    console.error('     数据定义改成 `export interface Xxx extends XxxLike { readonly __type__: \'Xxx\' }`，');
    console.error('     行为放进同目录的 `xxx.ts` 纯函数（AGENTS.md §11.1 / 方案 §7 C 第 1 条）。');
    console.error('     若确实要保留某个 class，必须先改方案文档 §8 的范围并说明理由。');
    process.exit(1);
}

console.log(`✅ math 目标类型无新增 class：当前 ${total} 个（存量 ${knownTotal} 个已冻结在基线）`);
console.log(`   （判据是写死的 ${TARGET_TYPES.length} 个目标类型；math 全树另有 ${outside.length} 个后继批次的 export class，未计入——终极目标是全树归零）`);

if (decreased.length > 0)
{
    const goneCount = decreased.reduce((a, v) => a + (v.before - v.after), 0);

    console.log(`   （有 ${goneCount} 个目标类型 class 已被清理，可以跑 --update 收紧基线：${decreased.slice(0, 5).map((v) => v.key).join('、')}${decreased.length > 5 ? ' …' : ''}）`);
}
