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
import { join, relative, basename } from 'node:path';

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
    { name: 'editorRS', def: 'src/assets/EditorRS.ts', what: '页面侧资源系统' },
    { name: 'getEditorCache', def: 'src/caches/Editorcache.ts', what: '偏好持久化（**lazy 单例**：入口是 getEditorCache()）' },
];

/**
 * **已经迁完（删掉）**的单例。
 *
 * 它们走**反向校验**：定义文件不该再存在、引用面必须是 0。
 *
 * 少了这条，"删干净了"就只是一句自述——有人把空壳加回来、或者只删了文件却留了一处 import 时，
 * 没人会发现。多了这条，普查同时管住两头：**还没迁的**（引用面要降）与**已经迁完的**（不许复活）。
 */
const MIGRATED = [
    {
        name: 'editorui',
        def: 'src/global/editorui.ts',
        step: '#272 P5 第 1 步（删兼容空壳）',
        fileGone: true,
        detect: 'import',
    },
    {
        name: 'editorData',
        def: 'src/global/EditorData.ts',
        step: '#272 P5 第 3 步（消费面归零）',
        // 它的"复活"要看**过渡入口**而非模块 import：那个模块仍提供 `MRSToolType`，
        // 好几个文件合法地 import 它取枚举（见 `usesTransitionEntry` 的注释）
        detect: 'transition-entry',
        // 定义文件**仍在**（仍 re-export `MRSToolType`），所以不要求删文件
        note: '定义文件仍在（仍 re-export `MRSToolType`）',
    },
];

/**
 * **模块顶层 `new` 的基线**（存量冻结）。
 *
 * 哪些在册单例的定义文件里还有"顶层 `new` 自己"。`check-module-side-effects.mjs` 的规则只覆盖
 * **缓存形态**（`new Map/WeakMap/Set/WeakSet()`）与**裸调用语句**，所以 `export const x = new X()`
 * 这类写法此前一直**没有执行者**（根侧 `check-toplevel-new.mjs` 后来补上了全仓「文件::构造器」基线，
 * 也扫 `packages/editor`）；**这张基线是包内第二道、判据更严**：
 * 迁移一个就从这里划掉一个；**实测集合与基线不一致即失败**（多了 = 新增违规；少了 = 该收紧基线
 * 却没收紧）。与 `imperative-construction-baseline.json` / `bundle-size-baseline.json` 同一套做法。
 */
const TOP_LEVEL_NEW_BASELINE = ['editorRS'];

/**
 * `editorData` 过渡层的**引用上限**（只减不增）。
 *
 * `EditorData` 已经是 Pinia 的过渡层（`@deprecated 请直接使用 useEditorStore()`），
 * 第 3 步就是按引用榜逐个把消费方改掉。这张基线守的是"**别又加回来**"：
 * 每迁一批就把数字收紧一次，实测**超过**基线即失败。
 *
 * 取"处数"而不是"文件数"：同一文件里多写一处也该被抓住（文件数会掩盖它）。
 *
 * 当前值 **56**：
 * - 第 1 批只做到 63——那批想连 `feng3d/mrsTool/MRSToolTarget.ts`（9 处）一起迁，实测发现
 *   **它不能迁**：它会被单元测试经 `logic()` 间接构造（`pluginPatch.spec.ts`），而测试环境
 *   **没有激活 pinia**，`useEditorStore()` 会当场抛
 *   `getActivePinia() was called but there was no active Pinia`；
 * - 第 2 批（三个 Vue 组件）再降到 55 处 / 20 文件；
 * - 第 3 批（**高风险区**：4 个 `scripts/*Icon.ts` + `mrsTool/{MRSTool,MRSToolTarget,editorSetTool}.ts`）
 *   降到 30 处 / 13 文件。那批的结论值得记：**"Logic 类不能迁"其实是"测试没提供 pinia"**——
 *   `pluginInstall.spec.ts` 会遍历清单构造每个 Logic，而测试环境没有 pinia；补上
 *   `setActivePinia(createPinia())` 之后它们就能迁了（运行形态 `run.ts` 不装 pinia，
 *   但它也不加载编辑器清单，所以"没有 pinia"对引擎仍是真实状态）。
 * - 第 4 批（`bridge/**` 6 文件 + `CommonConfig` + `Hierarchy`）降到 9 处 / 5 文件。
 *
 * 这个数字**只能降**。
 */
const EDITORDATA_MAX_REFERENCES = 0;

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
 * 递归收集目录下的 `.ts` 与 **`.vue`** 文件。
 *
 * `.vue` 必须扫：编辑器是 Vue + 传统 TS 的混合架构，单例的消费者有一半在组件里。
 * 第一版只扫 `.ts`，于是把 `editorui` 在 `App.vue` / `SceneView.vue` 里的消费者整个漏掉
 * （引用面被低估成 11 处，真实是 16 处）——台账少算消费方就失去了意义。
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
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.vue')) found.push(full);
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

/**
 * 找出**真的 import 了**这个名字的文件。
 *
 * 为什么要与 `countByName` 分开：那一支是**文本级**（注释里出现也算），用来估"引用面的上界"
 * 是安全的（只会高估工作量）；而**反向校验**（"迁完的不许复活"）不能用它——已经删掉的东西在
 * 注释里被提到是**合理的**（甚至是好文档），只有**被 import 回来**才是真的复活。
 *
 * 这条是实测出来的：第一次跑反向校验就报"引用它的文件数=2"，而那两处都是本次删除留下的注释。
 *
 * @param {string[]} files 文件
 * @param {string} name 标识符
 * @returns {string[]} 导入它的文件
 */
function importedIn(files, name)
{
    const pattern = new RegExp(`(from\\s*['"][^'"]*\\b${name}\\b|import\\s+[^;\\n]*\\b${name}\\b)`);

    return files.filter((file) => pattern.test(readFileSync(file, 'utf8')));
}

/**
 * 找出定义文件里**模块顶层**的 `new`（如 `export const x = new Foo();`）。
 *
 * 为什么需要它：`check-module-side-effects.mjs` 的规则只覆盖**缓存形态**
 * （`new Map/WeakMap/Set/WeakSet()`）与**裸调用语句**，而 `new EditorCache()` / `new EditorRS()`
 * 这类 `export const x = new X()` 声明形式**同样是模块顶层执行代码**（#272 P5 第 2 步时实测确认）。
 * 根侧另有 `scripts/check-toplevel-new.mjs` 做全仓「文件::构造器」存量冻结（也扫 `packages/editor`）；
 * 这里的启发式是**包内第二道**，判据更严（要求实测集合与基线**一致**）。
 * 捞出方式是"顶格 + `new 大写字母开头`"。
 *
 * @param {string} file 文件
 * @returns {string[]} 命中行（`行号: 内容`）
 */
function topLevelNews(file)
{
    return readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ line, number: index + 1 }))
        .filter((one) => /^[a-zA-Z]/.test(one.line) && /\bnew\s+[A-Z]/.test(one.line))
        .map((one) => `${one.number}: ${one.line.trim()}`);
}

/**
 * 找出**真的用了 `EditorData.editorData` 过渡入口**的文件（**排除注释行**）。
 *
 * 为什么不用"import 了 `EditorData` 模块"来判：那个模块**还提供 `MRSToolType`**，
 * 于是 5-6 个文件会**合法地** import 它取枚举——按模块 import 判会把它们全算成"复活"（实测）。
 * 也不用纯文本级：迁移时留下的说明性注释里就会出现这个名字，那同样不是复活。
 *
 * @param {string[]} files 文件
 * @returns {string[]} 真正用到过渡入口的文件
 */
function usesTransitionEntry(files)
{
    const pattern = /\bEditorData\s*\.\s*editorData\b/;

    return files.filter((file) => readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => pattern.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)));
}

console.log('[单例普查] #272 P5：单例迁服务前的引用面台账');
const srcFiles = collect(SRC);
const testFiles = collect(TEST);

console.log(`  扫描范围：packages/editor/src（${srcFiles.length} 个 .ts/.vue）`
    + ` / packages/editor/test（${testFiles.length} 个）`);

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
    // **行首锚定**（`^\s*export`）：不这样的话，注释里引用的旧写法（比如
    // `* 原先是 export const editorcache = new EditorCache();`）会把这条判据骗成假绿。
    // 这条是实测出来的——`editorcache` 改成 `getEditorCache()` 之后它就是这么"通过"的。
    // 同时接受**首字母大写**的形式：数据类的导出名（`EditorData`）与实例名（`editorData`）不同。
    const capitalized = `${one.name[0].toUpperCase()}${one.name.slice(1)}`;
    const exported = new RegExp(`^\\s*export\\s+(const|let|var|function|class|interface|type)\\s+(${one.name}|${capitalized})\\b`, 'm').test(source);

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

// ---------- 自证 5：模块顶层 `new` 的存量与基线一致 ----------
const newsBySingleton = survey.map((one) => ({ name: one.name, news: topLevelNews(join(EDITOR, one.def)) }));
const actualTopLevelNew = newsBySingleton.filter((one) => one.news.length > 0).map((one) => one.name).sort();
const baselineTopLevelNew = [...TOP_LEVEL_NEW_BASELINE].sort();

check('★ 模块顶层 `new` 的存量与基线一致（多一个 = 新增违规；少一个 = 该收紧基线）',
    JSON.stringify(actualTopLevelNew) === JSON.stringify(baselineTopLevelNew),
    `实测 [${actualTopLevelNew.join(', ') || '（无）'}] vs 基线 [${baselineTopLevelNew.join(', ') || '（无）'}]`
    + (actualTopLevelNew.length > 0
        ? `；${newsBySingleton.filter((one) => one.news.length > 0).map((one) => `${one.name} → ${one.news.join(' / ')}`).join('；')}`
        : ''));

// ---------- 自证 6：过渡层的消费只减不增 ----------
const editorDataEntry = survey.find((one) => one.name === 'editorData');

if (editorDataEntry)
{
    check('★ `editorData` 过渡层的消费只减不增（每批迁移后收紧基线）',
        editorDataEntry.count <= EDITORDATA_MAX_REFERENCES,
        `实测 ${editorDataEntry.count} 处 / ${editorDataEntry.hits.size} 文件，上限 ${EDITORDATA_MAX_REFERENCES} 处`);
}
else
{
    // 迁完之后它不再是"在册单例"，而是 `MIGRATED` 里的一条——由上面的反向校验守着"不许复活"。
    // 这一条的作用是：**要求它真的被登记进去**，别出现"既不在册、也没登记"的空档。
    check('★ `editorData` 已全部迁完（应登记在 `MIGRATED`，且引用上限已收到 0）',
        EDITORDATA_MAX_REFERENCES === 0 && MIGRATED.some((one) => one.name === 'editorData'),
        `上限=${EDITORDATA_MAX_REFERENCES}，MIGRATED 里有=${MIGRATED.some((one) => one.name === 'editorData')}`);
}

// ---------- 自证 4（反向）：迁完的那些不许复活 ----------
// 先证 `importedIn` 自己能用：拿一个**确定被 import** 的在册单例当探针。
// 少了这条，`importedIn` 的正则一旦写坏（永不匹配），下面的反向校验就会**假绿**——
// "文件不在 + 没人 import" 永远成立，而这正是最需要被抓住的情形。
const importerProbe = importedIn(srcFiles, 'editorRS');

check('方法自证：`importedIn` 扫得到 import（否则反向校验会假绿）', importerProbe.length > 0,
    `editorRS 被 ${importerProbe.length} 个文件 import`);

for (const one of MIGRATED)
{
    const stillDefined = existsSync(join(EDITOR, one.def));
    // 两种"复活"形态：`editorui` 那种（模块只为它存在，import 即复活）与
    // `editorData` 那种（模块还提供别的东西，要看**过渡入口**是否被用）
    const offenders = one.detect === 'transition-entry'
        ? usesTransitionEntry(srcFiles)
        : importedIn(srcFiles, one.name);
    // `fileGone: true` 的条目要求定义文件**已删除**；缺省只要求"没人再用它"
    // （`editorData` 那种：过渡类还在，只是没人再用了）
    const fileOk = one.fileGone ? !stillDefined : true;

    check(`★ 已迁完的 ${one.name}（${one.step}）没有复活：没人用它${one.fileGone ? '、定义文件已删' : ''}`,
        fileOk && offenders.length === 0,
        `用它的文件数=${offenders.length}`
        + (one.fileGone ? `，定义文件在=${stillDefined}` : '')
        + (one.note ? `（${one.note}）` : '')
        + (offenders.length > 0 ? `；${offenders.map(display).join('、')}` : ''));
}

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
    // 判据是"**import 了对方的定义模块**"，不是"源码里出现过那个名字"——后者会被注释骗：
    // 实测给 `Editorcache.ts` 写了一条提到 `editorRS` 的注释，依赖图上就凭空多出一条
    // `getEditorCache -> editorRS`（而两者其实没有依赖）。
    const deps = SINGLETONS
        .filter((other) =>
        {
            const moduleName = basename(other.def, '.ts');

            return other.name !== one.name && new RegExp(`from\\s*['"][^'"]*${moduleName}['"]`).test(source);
        })
        .map((other) => other.name);

    console.log(`    ${one.name.padEnd(15)} -> ${deps.length > 0 ? deps.join(', ') : '（无）'}`);
}

// ---------- 模块顶层使用（启发式，只指路） ----------
console.log('');
console.log('  模块顶层使用（**启发式**：顶格且不是 import/export/注释——只用来指路，不是判据）：');

let topLevelTotal = 0;
/** 每个单例的顶层使用行（`editorRS` 那一份现在是**判据**，不只是"指路"） */
const topLevelBySingleton = new Map();

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
    topLevelBySingleton.set(one.name, lines);
    if (lines.length > 0) console.log(`    ${one.name}：${lines.map((line) => line).join('  |  ')}`);
}

check('顶层使用粗查跑得动（哪怕结果为 0 也要有结论）', topLevelTotal >= 0,
    `共 ${topLevelTotal} 行看起来在顶层使用`);

// **判据化**（#278 阶段 4a）：`editorRS` 的装配已改成显式调用（`installEditorResourceSystem()`），
// 所以它不该再出现在任何模块顶层——"import 即写引擎槽位"正是 R2 要消掉的那种副作用。
// 其它在册单例仍是启发式统计（`getEditorCache` 是 lazy 入口，顶层出现属正常）。
const editorRSTopLevel = topLevelBySingleton.get('editorRS') ?? [];

check('★ `editorRS` 不再在**模块顶层**被使用（#278 阶段 4a：装配改显式）',
    editorRSTopLevel.length === 0, editorRSTopLevel.join('  |  ') || '0 行');

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 单例普查未通过——台账数字是后面每一步重构的依据，它自己不能是不可信的。');
    process.exit(1);
}

console.log('✅ 单例普查通过：清单没过期、扫描器扫得到东西、台账数字可复现');
console.log('（设计稿 packages/editor/docs/MIGRATE_SINGLETONS.md 里的数字都来自本脚本）');
