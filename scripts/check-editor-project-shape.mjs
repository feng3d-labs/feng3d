/**
 * 门禁：编辑器新建的项目骨架是**标准 npm 工程**（#274 P3 / D12）。
 *
 * ## 为什么需要它
 *
 * `ARCHITECTURE.md` §5.2 定了目标目录布局，而模板目录（`packages/editor/resource/template/`）
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
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const TEMPLATE_DIR = resolve(ROOT, 'packages/editor/resource/template');
const EDITOR_RS = resolve(ROOT, 'packages/editor/src/assets/EditorRS.ts');

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
const editorRsSource = readFileSync(EDITOR_RS, 'utf8');
const wiringProblems = REQUIRED.filter((name) => !templateLists(editorRsSource, name))
    .map((name) => `\`EditorRS.ts\` 的 \`templateurls\` 没列 \`${name}\`（模板有了、新项目里也不会有）`);

console.log('');
console.log('--- 判据 ---');

for (const problem of fileProblems) console.log(`  FAIL  ${problem}`);
if (fileProblems.length === 0) console.log(`  PASS  模板里有 ${REQUIRED.map((n) => `\`${n}\``).join(' + ')}，且都是合法 JSON`);

if (buildProblem) console.log(`  FAIL  ${buildProblem}`);
else if (fileProblems.length === 0) console.log('  PASS  模板 `package.json` 有 `scripts.build`');

for (const problem of wiringProblems) console.log(`  FAIL  ${problem}`);
if (wiringProblems.length === 0) console.log('  PASS  `templateurls` 列了这两个文件（接线没断）');

const failed = fileProblems.length + (buildProblem ? 1 : 0) + wiringProblems.length;
const total = SELF_CHECKS.length + 3;

console.log('');
console.log(`共 ${total} 项：通过 ${total - failed - selfFailed}，失败 ${failed + selfFailed}`);

if (failed > 0)
{
    console.error('\n❌ 新建项目骨架还不是"标准 npm 工程"（#274 P3 / D12 / 决策 13 / 16）。');
    console.error(`   目标布局见 packages/editor/docs/ARCHITECTURE.md §5.2；模板目录：${TEMPLATE_DIR}`);
    process.exit(1);
}

console.log('✅ 新建项目骨架是标准 npm 工程（package.json + feng3d.project.json，且接线完好）');
