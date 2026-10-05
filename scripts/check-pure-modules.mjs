/**
 * R13 纯函数层门禁：登记为「纯函数模块」的代码不得依赖响应式运行时，也不得依赖上层包。
 *
 * ## 为什么需要这条门禁
 *
 * 代码三分类（[docs/CODE_TAXONOMY.md](../docs/CODE_TAXONOMY.md)）把项目代码分成
 * ① 纯数据 / ② 纯计算函数 / ③ 逻辑，外加 ⓪ 响应式运行时 / ④ 边界 / ⑤ 类型层。
 * 第 ② 类的核心判据是「**模块不知道代理存在**」，理由是三条硬事实：
 *
 *   - 类型系统区分不了原始对象与 `reactive()` 代理（两者是同一种 `readonly` 形状）；
 *   - reactivity 不提供 `markRaw` / `readonly` 之类的反制手段（AGENTS.md §8.7）；
 *   - `toRaw()` 本身来自 reactivity——纯函数模块一旦 import 它，就等于承认「入参可能是代理」，
 *     那已经是第 ③ 类（逻辑）的活了。
 *
 * 所以「入参必须是干净的纯数据」这件事，正确的落点是**模块边界**而不是函数签名：
 * 纯函数模块根本不 import `@feng3d/reactivity`，清洗代理（`toRaw`）由调用方在边界完成。
 *
 * ## 判据与清单
 *
 * 清单 `scripts/pure-modules.json` 显式登记「我们希望它保持纯粹」的包目录或单文件
 * （理由写在清单条目的值上，与 R2 的应用入口清单 `ENTRY_FILES` 同一风格）。判据是
 * 下列位置出现的模块说明符不得命中清单的 `forbidden`：
 *
 *   1. 静态 `import` / `export ... from`;
 *   2. `import x = require('...')`;
 *   3. 动态 `import('...')` 与 `require('...')`。
 *
 * ## 双向校验与已知局限（如实写下，不假装彻底）
 *
 * - **反向校验**：清单登记项必须真实存在、且其下至少有 1 个 `.ts` 文件——清单不会悄悄腐化
 *   （文件被删 / 改名后过期条目会让门禁失败）。
 * - **已知局限**：「该登记却没登记」**无法自动发现**——一个模块该不该是纯函数没有客观状态可推断
 *   （不像 R6 的 strict 开关写在 `tsconfig.json` 里）。所以新增纯函数模块必须**手工登记**，
 *   这是本门禁的边界而不是缺陷；补强只能靠 code review。
 * - **不在判据内**：随机 / 时间函数（math 有意保留 `Math.random()`，见 `plane.ts` / `euler.ts` /
 *   `matrix4x4.ts`，属「非确定性纯函数」）与 `console.error` 诊断输出（math 存量，
 *   与旧实现逐字一致的报错路径）——它们是引用透明的显式例外，不是依赖问题。
 *
 * ## 用法
 *
 * ```bash
 * node scripts/check-pure-modules.mjs          # 校验（CI 用；命中即失败）
 * node scripts/check-pure-modules.mjs --stats  # 打印登记项 / 扫描文件数 / 禁用依赖清单
 * ```
 *
 * 进 CI 的方式：挂在根 `package.json` 的 `prelint:ci` 钩子上（`npm run lint:ci` 会先跑它），
 * 与 `check-math-no-class.mjs` / `check-readonly-array-fields.mjs` 同一条路——
 * 本仓惯例是门禁优先走 `prelint:ci`，而不是改 `.github/workflows/**`（推送 workflow 需要额外 scope）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/** 仓库根（本脚本位于 `scripts/` 下） */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 清单文件 */
const CONFIG_FILE = join(ROOT, 'scripts', 'pure-modules.json');

/** 递归扫描时跳过的目录 */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp']);

/**
 * 递归收集目录下的 `.ts` 源文件（排除 `.spec.ts` 与 `.d.ts`）。
 *
 * @param {string} dir 起始目录（绝对路径）
 * @param {string[]} [out] 累积器
 * @returns {string[]} 文件绝对路径
 */
function collectTsFiles(dir, out = [])
{
    for (const name of readdirSync(dir))
    {
        if (SKIP_DIRS.has(name)) continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory()) collectTsFiles(full, out);
        else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts')) out.push(full);
    }

    return out;
}

/**
 * 仓库根相对路径（正斜杠）——报告统一用这个写法，避免 Windows 反斜杠进输出。
 *
 * @param {string} file 绝对路径
 * @returns {string} 相对路径
 */
function toRelative(file)
{
    return relative(ROOT, file).split(sep).join('/');
}

/**
 * 取字符串字面量节点的文本值（非字面量返回 undefined）。
 *
 * @param {import('typescript').Node | undefined} node 节点
 * @returns {string | undefined} 文本值
 */
function stringLiteralText(node)
{
    return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

/**
 * 收集一个源文件里的**模块说明符**（静态 import / export-from / import= / 动态 import / require）。
 *
 * 刻意用一组**互斥的独立 `if`** 而不是 `if / else if`：本项目 eslint 的
 * `brace-style: allman` 下多分支的 `else` 写法容易踩格式，而这里的四个判据本来就互斥。
 *
 * @param {import('typescript').SourceFile} sourceFile 源文件
 * @returns {{ specifier: string, line: number }[]} 说明符列表
 */
function collectModuleSpecifiers(sourceFile)
{
    const found = [];
    const add = (node, specifier) =>
        {
            if (!specifier) return;

            found.push({
                specifier,
                line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
            });
        };

    const visit = (node) =>
    {
        if (ts.isImportDeclaration(node)) add(node, stringLiteralText(node.moduleSpecifier));
        if (ts.isExportDeclaration(node)) add(node, stringLiteralText(node.moduleSpecifier));
        if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference))
        {
            add(node, stringLiteralText(node.moduleReference.expression));
        }
        if (ts.isCallExpression(node))
        {
            const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
            const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';

            if (isDynamicImport || isRequire) add(node, stringLiteralText(node.arguments[0]));
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return found;
}

/** 主流程：读清单 → 扫登记项 → 报命中 / 报清单腐化 */
function main()
{
    const statsOnly = process.argv.slice(2).includes('--stats');

    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    const forbidden = config.forbidden ?? {};
    const modules = Object.entries(config.modules ?? {});

    /** 清单本身的健全性问题（登记项不存在 / 是空目录） */
    const configProblems = [];
    /** 依赖命中（真正的违规） */
    const hits = [];
    let scannedFiles = 0;

    for (const [rel, reason] of modules)
    {
        const abs = join(ROOT, rel);

        if (!existsSync(abs))
        {
            configProblems.push(`登记项不存在：${rel}（清单里写的理由是「${reason ?? ''}」）`);
            continue;
        }

        const files = statSync(abs).isDirectory() ? collectTsFiles(abs) : [abs];
        const tsFiles = files.filter((file) => file.endsWith('.ts'));

        if (tsFiles.length === 0)
        {
            configProblems.push(`登记项下没有任何 .ts：${rel}`);
            continue;
        }

        scannedFiles += tsFiles.length;

        for (const file of tsFiles)
        {
            const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

            for (const { specifier, line } of collectModuleSpecifiers(sourceFile))
            {
                if (forbidden[specifier])
                {
                    hits.push({
                        file: toRelative(file),
                        line,
                        specifier,
                        reason: forbidden[specifier],
                    });
                }
            }
        }
    }

    if (statsOnly)
    {
        console.log('R13 纯函数层 —— 登记项：');
        for (const [rel, reason] of modules) console.log(`  - ${rel}：${reason}`);
        console.log(`\n扫描 ${scannedFiles} 个 .ts 文件；禁用依赖 ${Object.keys(forbidden).length} 条：`);
        for (const [name, reason] of Object.entries(forbidden)) console.log(`  - ${name}：${reason}`);
        console.log(`\n命中：${hits.length}`);
    }

    if (configProblems.length > 0 || hits.length > 0)
    {
        console.error('R13 纯函数层门禁失败：\n');

        for (const problem of configProblems) console.error(`  [清单] ${problem}`);

        for (const { file, line, specifier, reason } of hits)
        {
            console.error(`  [依赖] ${file}:${line} 不得 import '${specifier}'`);
            console.error(`         理由：${reason}`);
        }

        console.error('\n纯函数模块不得依赖响应式运行时与上层包，判据见 docs/CODE_TAXONOMY.md §2（第 ② 类）。');
        console.error('需要把响应式代理还原成原始对象时，请由调用方（第 ③ 类逻辑）在边界用 toRaw 完成。');

        process.exitCode = 1;

        return;
    }

    console.log(`R13 纯函数层：${modules.length} 个登记项 / ${scannedFiles} 个 .ts 文件，未命中禁用依赖（${Object.keys(forbidden).length} 条）。`);
}

main();
