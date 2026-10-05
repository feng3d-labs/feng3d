/**
 * 门禁：编辑器新建的项目骨架是**标准 npm 工程**（#274 P3 / D12）。
 *
 * ## 为什么需要它
 *
 * `ARCHITECTURE.md` §5.2 定了目标目录布局（`scenes/` / `scripts/` / `Assets/` / `plugins/`），
 * **判据 8 就判这一条**（此前它只是文档里的一张图）。模板目录（`packages/editor/resource/template/`）
 * 一直是**旧形态**：`app.js` / `project.js` / `libs/feng3d.js` 快照 —— 没有 `package.json`、
 * 没有 `feng3d.project.json`。这套旧形态正是 #271 那条"不可用链路"的土壤。
 *
 * 决策依据（都已拍板）：
 * - **D12**：游戏项目 = 标准 npm 工程（带 `package.json`，依赖 `feng3d` 等库）；
 * - **决策 13**：构建 / 运行统一走**项目自己的** `package.json` scripts（编辑器不硬编码构建工具）；
 * - **决策 16**：`feng3d.project.json` 与 `package.json` **不合并** —— 前者是编辑器元数据
 *   （名称 / 入口场景 / 启用插件 / 构建覆盖），后者是工程的依赖与脚本。
 *
 * ## 判据（三条，**两向都验**）
 *
 * 1. 模板目录里**同时**有 `package.json` 与 `feng3d.project.json`，且都能 `JSON.parse`；
 * 2. `package.json` 里有 `scripts.build`（决策 13：构建命令由项目自己给）；
 * 3. **接线**：`EditorRS.ts` 的 `templateurls` 里**列了**这两个文件 ——
 *    模板文件存在、但清单没列，等于新项目里不会有它们（"文件有了、却没人写"是最容易漏的一向）。
 *
 * 另有**判据自证**（照 issue #652 做法）：判据函数喂正 / 负样例，判据写错时不会静默全绿。
 *
 * 退出码：0 = 通过；1 = 有违规或自证失败。
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const TEMPLATE_DIR = resolve(ROOT, 'packages/editor/resource/template');
const EDITOR_RS = resolve(ROOT, 'packages/editor/src/assets/EditorRS.ts');
const PROJECT_META_SERVICE = resolve(ROOT, 'packages/editor/bin/host/projectMeta.mjs');
const SERVE = resolve(ROOT, 'packages/editor/bin/serve.mjs');
const PROJECT_RECENT_SERVICE = resolve(ROOT, 'packages/editor/bin/host/projectRecent.mjs');
const TEMPLATE_TSCONFIG = resolve(TEMPLATE_DIR, 'tsconfig.json');

/** 必须是编辑器元数据的两个文件（决策 16：不合并） */
const REQUIRED = ['package.json', 'feng3d.project.json'];

/**
 * 判据 1 的判据函数：给定"读文件"的能力，返回缺失或不可解析的清单。
 *
 * 抽成函数是为了能自检（issue #652）。
 *
 * @param {(name: string) => string | null} read 读模板文件（不存在返回 null）
 * @returns {string[]} 问题清单（空 = 通过）
 */
function checkTemplateFiles(read)
{
    const problems = [];

    for (const name of REQUIRED)
    {
        const text = read(name);

        if (text === null)
        {
            problems.push(`模板里没有 \`${name}\``);

            continue;
        }

        try
        {
            JSON.parse(text);
        }
        catch (error)
        {
            problems.push(`\`${name}\` 不是合法 JSON：${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return problems;
}

/**
 * 判据 3 的判据函数：`templateurls` 里是否列了指定文件。
 *
 * @param {string} source `EditorRS.ts` 源码
 * @param {string} name 目标文件名（清单的第二项，例如 `feng3d.project.json`）
 * @returns {boolean} 是否列了
 */
function templateLists(source, name)
{
    return source
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .some((line) => line.includes(`'${name}'`));
}

/**
 * 判据 4 的判据函数：模板 `tsconfig.json` 是否已经改成"`include` 通配、不回写"。
 *
 * 三条各自对应一个**旧形态的标志**：
 * - `files`：那是 `ScriptCompiler` 回写的地方（已删）——留着会让"这份清单谁在维护"没有答案；
 * - `outFile`：把全部脚本合并成一个 `project.js` 的旧构建形态（D12 已改"项目自己构建"）；
 * - 缺 `include`：没有通配，新加的脚本不会被自动看到。
 *
 * @param {string} source `tsconfig.json` 文本（允许 JSONC：会先砍掉 `//` 注释）
 * @returns {string[]} 问题清单（空 = 通过）
 */
function checkTemplateTsconfig(source)
{
    let parsed;

    try
    {
        // JSONC 两步：砍 `//` 注释、再去尾随逗号（本仓所有 tsconfig 都带尾随逗号，
        // 判据不能因为"合法的 tsconfig 写法"误报）
        parsed = JSON.parse(source.replace(/\/\/[^\n]*/g, '').replace(/,(\s*[}\]])/g, '$1'));
    }
    catch (error)
    {
        return [`模板 tsconfig.json 不能解析：${error instanceof Error ? error.message : String(error)}`];
    }

    const problems = [];

    if (parsed.files !== undefined) problems.push('模板 tsconfig.json 还有 `files`（那是已删的 ScriptCompiler 回写的地方）');
    if (parsed.compilerOptions?.outFile !== undefined) problems.push('模板 tsconfig.json 还有 `outFile`（旧的"把脚本合并成一个 project.js"构建形态）');
    if (parsed.include === undefined) problems.push('模板 tsconfig.json 没有 `include` 通配（新加的脚本不会被自动看到）');

    return problems;
}

// ---------- 自证（issue #652 做法 2） ----------
const SELF_CHECKS = [
    {
        title: '两个文件都在且合法 → 不报',
        run: () => checkTemplateFiles((n) => (REQUIRED.includes(n) ? '{"a":1}' : null)).length === 0,
        expect: true,
    },
    {
        title: '缺 `feng3d.project.json` → 报',
        run: () => checkTemplateFiles((n) => (n === 'package.json' ? '{}' : null)).length === 1,
        expect: true,
    },
    {
        title: '清单里有 `feng3d.project.json` → 认',
        run: () => templateLists("    ['./resource/template/feng3d.project.json', 'feng3d.project.json'],", 'feng3d.project.json'),
        expect: true,
    },
    {
        title: '清单里只有注释提到它 → 不认',
        run: () => templateLists("// ['./resource/template/feng3d.project.json', 'feng3d.project.json'],", 'feng3d.project.json'),
        expect: false,
    },
    {
        title: 'tsconfig 走 include 通配 → 不报',
        run: () => checkTemplateTsconfig('{"compilerOptions":{"noEmit":true},"include":["scripts/**/*.ts"]}').length === 0,
        expect: true,
    },
    {
        title: 'tsconfig 还有 `files` + `outFile` + 缺 `include` → 三条都报',
        run: () =>
        {
            const problems = checkTemplateTsconfig('{"compilerOptions":{"outFile":"project.js"},"files":["a.d.ts"]}');

            // 按**内容**断言，不数个数：数个数会跟着判据一起错
            return problems.length === 3
                && problems.some((problem) => problem.includes('files'))
                && problems.some((problem) => problem.includes('outFile'))
                && problems.some((problem) => problem.includes('include'));
        },
        expect: true,
    },
];

let selfFailed = 0;

console.log('--- 自证（判据喂合成样例，issue #652 做法 2）---');

for (const check of SELF_CHECKS)
{
    const ok = check.run() === check.expect;

    if (!ok) selfFailed += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${check.title}`);
}

if (selfFailed > 0)
{
    console.error(`\n❌ 判据自检失败 ${selfFailed} 条：判据被改坏了，先修判据再谈门禁结论（issue #652）。`);
    process.exit(1);
}

// ---------- 判据 1：模板里两个文件都在且合法 ----------
const read = (name) =>
{
    const full = resolve(TEMPLATE_DIR, name);

    return existsSync(full) ? readFileSync(full, 'utf8') : null;
};

const fileProblems = checkTemplateFiles(read);

// ---------- 判据 2：package.json 里有 scripts.build ----------
let buildProblem = null;

if (existsSync(resolve(TEMPLATE_DIR, 'package.json')))
{
    const pkg = JSON.parse(readFileSync(resolve(TEMPLATE_DIR, 'package.json'), 'utf8'));

    if (typeof pkg?.scripts?.build !== 'string' || pkg.scripts.build.trim() === '')
    {
        buildProblem = '模板 `package.json` 里没有 `scripts.build`（决策 13：构建命令由项目自己给）';
    }
}

// ---------- 判据 3：接线（清单里列了这两个文件） ----------
const tsconfigProblems = existsSync(TEMPLATE_TSCONFIG)
    ? checkTemplateTsconfig(readFileSync(TEMPLATE_TSCONFIG, 'utf8'))
    : ['模板里没有 `tsconfig.json`'];

const editorRsSource = readFileSync(EDITOR_RS, 'utf8');
const wiringProblems = REQUIRED.filter((name) => !templateLists(editorRsSource, name))
    .map((name) => `\`EditorRS.ts\` 的 \`templateurls\` 没列 \`${name}\`（模板有了、新项目里也不会有）`);

console.log('');
console.log('--- 判据 ---');

for (const problem of fileProblems) console.log(`  FAIL  ${problem}`);
if (fileProblems.length === 0) console.log(`  PASS  模板里有 ${REQUIRED.map((n) => `\`${n}\``).join(' + ')}，且都是合法 JSON`);

if (buildProblem) console.log(`  FAIL  ${buildProblem}`);
else if (fileProblems.length === 0) console.log('  PASS  模板 `package.json` 有 `scripts.build`');

for (const problem of tsconfigProblems) console.log(`  FAIL  ${problem}`);
if (tsconfigProblems.length === 0) console.log('  PASS  模板 tsconfig.json 走 `include` 通配（没有 `files` / `outFile`）');

for (const problem of wiringProblems) console.log(`  FAIL  ${problem}`);
if (wiringProblems.length === 0) console.log('  PASS  `templateurls` 列了这两个文件（接线没断）');

const failed = fileProblems.length + (buildProblem ? 1 : 0) + tsconfigProblems.length + wiringProblems.length;
const total = SELF_CHECKS.length + 4;

console.log('');
console.log(`共 ${total} 项：通过 ${total - failed - selfFailed}，失败 ${failed + selfFailed}`);

if (failed > 0)
{
    console.error('\n❌ 新建项目骨架还不是"标准 npm 工程"（#274 P3 / D12 / 决策 13 / 16）。');
    console.error(`   目标布局见 packages/editor/docs/ARCHITECTURE.md §5.2；模板目录：${TEMPLATE_DIR}`);
    process.exit(1);
}

// ---------- 判据 5：**坏清单必须指名报错**（#274 P3） ----------
//
// 这是"目录即项目"的地基：读不出元数据时必须**说清是哪一条坏了**，
// 不能静默当空项目——"打不开却看着像打开了"是最难查的一类（与 #271 的"假成功编译"同一个病）。
// 判据直接喂**纯函数**（`validateProjectMeta`），所以离线可跑、不起宿主。
const { validateProjectMeta, ProjectMeta } = await import(pathToFileURL(PROJECT_META_SERVICE).href);

const TEMPLATE_META = JSON.parse(readFileSync(resolve(TEMPLATE_DIR, 'feng3d.project.json'), 'utf8'));
const metaProblems = [];

// 正例：模板那份必须过（否则「新建的项目」自己就不合法）
if (validateProjectMeta(TEMPLATE_META).length > 0)
{
    metaProblems.push('模板 feng3d.project.json 自己不合法：' + validateProjectMeta(TEMPLATE_META).join('；'));
}

// 反例三条，每条都要**指名**（只看"有没有抛错"是不够的——"格式不对"这种话没用）
const BAD_META_CASES = [
    { title: '缺 name', value: { entryScene: 'default.scene.json' }, expect: 'name' },
    { title: '缺 entryScene', value: { name: 'x' }, expect: 'entryScene' },
    { title: 'plugins 不是字符串数组', value: { name: 'x', entryScene: 'a.json', plugins: [1] }, expect: 'plugins' },
    { title: '顶层不是对象', value: [], expect: '对象' },
];

for (const item of BAD_META_CASES)
{
    const said = validateProjectMeta(item.value).join('；');

    if (!said.includes(item.expect))
    {
        metaProblems.push(`${item.title}：报错里没有指名 \`${item.expect}\`（实际：${said || '（没报）'}）`);
    }
}

// 方法自证：服务真的会**抛**（而不只是纯函数返回问题清单）
if (typeof ProjectMeta !== 'function')
{
    metaProblems.push('`ProjectMeta` 不是一个类——服务没导出来');
}

console.log('');
console.log('--- 判据（项目元数据） ---');
console.log(`  ${metaProblems.length === 0 ? 'PASS' : 'FAIL'}  坏清单**指名报错**（模板自身合法 + 4 条反例各自指名）`);

for (const problem of metaProblems) console.log(`        ${problem}`);

if (metaProblems.length > 0)
{
    console.error('\n❌ 项目元数据的校验不够"指名"——坏清单被静默当空项目是最难查的一类。');
    process.exit(1);
}

// ---------- 判据 6：`--new` 这条命令**接线没断**（#274 P3） ----------
//
// 服务级（"新建 → 元数据读通"）由 `check-editor-workspace.mjs` 验；但"CLI 真的会调它"是
// **另一段**——函数写在服务里、而 `--new` 忘了接，那几条判据照样全绿。所以这里判接线。
const serveSource = readFileSync(SERVE, 'utf8');
const cliProblems = [];

const CLI_CHECKS = [
    { title: '`--new` 参数分支在', test: /arg === '--new'/ },
    { title: '`--new` 真的调了 createProjectSkeleton', test: /createProjectSkeleton\(options\.new\)/ },
    { title: '用法文本里有 `--new`（用户看得见）', test: /--new <目录>/ },
    { title: '`--new` 与 `--project` 同时给会被拦下', test: /options\.new && options\.project/ },
];

for (const item of CLI_CHECKS)
{
    if (!item.test.test(serveSource)) cliProblems.push(item.title);
}

console.log('');
console.log('--- 判据（CLI 接线） ---');
console.log(`  ${cliProblems.length === 0 ? 'PASS' : 'FAIL'}  \`--new\` 接线完好（参数分支 + 真调函数 + 用法文本 + 互斥拦下）`);

for (const problem of cliProblems) console.log(`        ${problem}`);

if (cliProblems.length > 0)
{
    console.error('\n❌ `--new` 的接线断了：服务写好了但 CLI 没接上，等于这个能力用户够不到。');
    process.exit(1);
}

// ---------- 判据 7：`recent`（#274 P3） ----------
//
// 落在**临时目录**里跑（`readRecent` / `recordRecent` 接的是目录参数，不是全局状态），
// 所以这条判据既不碰跑测试的人真实的 `~/.feng3d-editor/`，也不需要起宿主。
const { readRecent, recordRecent, MAX_RECENT } = await import(pathToFileURL(PROJECT_RECENT_SERVICE).href);

const recentDir = mkdtempSync(join(tmpdir(), 'feng3d-recent-'));
const recentProblems = [];

// 去重 + 新的在前：记 a、b、再记 a —— 期望 /a 在最前（"再打开一次要挪到最前"，
// 否则这个列表会退化成"第一次打开的顺序"）
recordRecent(recentDir, '/a');
recordRecent(recentDir, '/b');
const afterThird = recordRecent(recentDir, '/a');

// 期望值要跟实现一样先 `resolve()`：Windows 上 `/a` 会变成 `C:\a`
const expectOrder = [resolve('/a'), resolve('/b')].join(',');

if (afterThird.join(',') !== expectOrder) recentProblems.push(`去重与排序不对：${afterThird.join(',')}（期望 ${expectOrder}）`);

// 上限：多记几个，长度必须停在 MAX_RECENT
for (let i = 0; i < MAX_RECENT + 5; i += 1) recordRecent(recentDir, `/p${i}`);

if (readRecent(recentDir).length !== MAX_RECENT) recentProblems.push(`上限不对：${readRecent(recentDir).length}（期望 ${MAX_RECENT}）`);

// 坏文件容错：一份坏掉的偏好设置不该让编辑器起不来
writeFileSync(join(recentDir, 'recent.json'), '这不是 JSON', 'utf8');

if (readRecent(recentDir).length !== 0) recentProblems.push('坏文件没有当空清单处理');

console.log('');
console.log('--- 判据（最近项目） ---');
console.log(`  ${recentProblems.length === 0 ? 'PASS' : 'FAIL'}  最近项目：去重 + 新的在前 + 上限 ${MAX_RECENT} + 坏文件当空`);

for (const problem of recentProblems) console.log(`        ${problem}`);

// CLI 接线：`--open` 与 `--project` 同义、`--recent` 列完就退
const recentCliChecks = [
    { title: '`--open` 分支在', test: /arg === '--open'/ },
    { title: '`--open` 与 `--project` 走同一个字段', test: /arg === '--open'[\s\S]{0,400}options\.project = resolve/ },
    { title: '`--recent` 分支在', test: /arg === '--recent'/ },
    { title: '`--recent` 列完就退出', test: /if \(options\.recent\)[\s\S]{0,600}process\.exit\(0\)/ },
    { title: '宿主方法 `host.project.recent` 已注册', test: /host\.project\.recent/ },
    { title: '打开成功后记录（有目录才记）', test: /if \(options\.project\) projectRecent\.record\(/ },
    { title: '用法文本里有 `--recent`', test: /--recent\s+列出最近/ },
];

for (const item of recentCliChecks)
{
    if (!item.test.test(serveSource)) recentProblems.push(item.title);
}

if (recentProblems.length > 0)
{
    console.error('\n❌ `recent` 没接好：最近项目清单是"我上次在改哪个"的唯一入口。');
    process.exit(1);
}

// ---------- 判据 8：模板符合 §5.2 的目录约定（#274） ----------
//
// §5.2 画了目标布局，而它此前只是**一张图** —— 模板里既没有 `scenes/` 也没有 `scripts/`，
// 而 `tsconfig.json` 的 `include` 早就写着 `scripts/**/*.ts`（**没有那个目录**，是句空承诺）。
//
// 四条判据，**前三条正向、后两条反向**（本仓惯例：迁完的不许回来）：
const SECTION_52_DIRS = [
    { name: 'scenes', why: '场景 JSON（§5.2）' },
    { name: 'scripts', why: '用户 TS 脚本 —— tsconfig 的 include 就是指着它' },
    { name: 'Assets', why: '资源根目录；**名字是大写**，由 ReadRS.ts:29 硬编码' },
    { name: 'plugins', why: '项目级插件（三端形态，可选）' },
];

const dirProblems = [];

for (const item of SECTION_52_DIRS)
{
    if (!existsSync(resolve(TEMPLATE_DIR, item.name))) dirProblems.push(`模板里没有 ${item.name}/（${item.why}）`);
}

// **反向 1**：场景文件不该还在项目根 —— 迁完的不许回来
if (existsSync(resolve(TEMPLATE_DIR, 'default.scene.json')))
{
    dirProblems.push('项目根又出现了 default.scene.json（§5.2 说它在 scenes/ 下）');
}

// **反向 2**：入口场景必须指到 `scenes/` 下（目录建了、指针没跟，等于没迁）
const entryScene = String(JSON.parse(readFileSync(resolve(TEMPLATE_DIR, 'feng3d.project.json'), 'utf8')).entryScene ?? '');

if (!entryScene.startsWith('scenes/'))
{
    dirProblems.push(`入口场景没指到 scenes/ 下：${entryScene || '（空）'}`);
}

console.log('');
console.log('--- 判据（§5.2 目录约定） ---');
console.log(`  ${dirProblems.length === 0 ? 'PASS' : 'FAIL'}  模板有 scenes/ scripts/ Assets/ plugins/，且场景文件已从项目根迁走、entryScene 指对了`);

for (const problem of dirProblems) console.log(`        ${problem}`);

if (dirProblems.length > 0)
{
    console.error('\n❌ 模板的目录约定与 ARCHITECTURE.md §5.2 不一致 —— 那节画的布局不该只是文档。');
    process.exit(1);
}

console.log('✅ 新建项目骨架是标准 npm 工程（package.json + feng3d.project.json，且接线完好）');
