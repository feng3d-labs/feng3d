/**
 * registerLogic 第二实参必须是工厂函数——机器执行者（issue #653）。
 *
 * ## 为什么需要它
 *
 * registerLogic 的类型 LogicFactory（packages/reactivity/src/logic.ts）只有调用签名，
 * class 构造函数（只有构造签名）无法赋给它——类型层已挡住「直接注册 class」。
 * 但类型检查只覆盖各包 src：packages/<pkg>/test 与 examples/src 不在统一类型
 * 检查范围内，而且 as 断言可以绕过任何类型约束。本脚本按 AST 把这两类漏网堵上：
 *
 * - 第二实参带类型断言（as / <T>）→ 违规（要求直接传函数本身）；
 * - 第二实参是**同文件内声明的 class**（裸标识符）→ 违规——logic() 直接调用工厂，
 *   class 构造函数被当普通函数调用会抛 Class constructor ... cannot be invoked without new。
 *
 * ## 允许的形态
 *
 * - XxxLogic.create（本仓统一形态：protected constructor 的唯一出口）；
 * - 函数名（geometryLogic / scriptDemoLogic / 测试里的 InitSpyCompLogic）；
 * - 箭头函数 / 函数表达式；
 * - 数据传递（编辑器清单边界 entry.logic，其类型是 LogicFactoryRef）。
 *
 * ## 扫描范围
 *
 * packages/<pkg>/src、packages/<pkg>/test、examples/src、test。
 * 字符串字面量里的 registerLogic 调用不会被误报（AST 只认真实调用）。
 *
 * 用法：
 *   node scripts/check-register-logic-factory.mjs
 *   node scripts/check-register-logic-factory.mjs --self-check
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp', '.temp', 'coverage']);
const PACKAGE_SUBDIRS = ['src', 'test'];
const EXTRA_ROOTS = ['examples/src', 'test'];

/** 收集一个目录下的所有 TS 文件（跳过生成物目录与隐藏目录） */
function collectTsFiles(dir, out)
{
    let entries;

    try
    {
        entries = readdirSync(dir, { withFileTypes: true });
    }
    catch
    {
        return;
    }

    for (const entry of entries)
    {
        if (entry.isDirectory())
        {
            if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
            collectTsFiles(join(dir, entry.name), out);
        }
        else if (/\.(ts|tsx|mts)$/.test(entry.name))
        {
            out.push(join(dir, entry.name));
        }
    }
}

/** 扫描范围：各包的 src / test，加上示例与仓库根测试 */
function collectTargets()
{
    const files = [];

    for (const pkg of readdirSync(join(ROOT, 'packages'), { withFileTypes: true }))
    {
        if (!pkg.isDirectory() || pkg.name.startsWith('.')) continue;
        for (const sub of PACKAGE_SUBDIRS) collectTsFiles(join(ROOT, 'packages', pkg.name, sub), files);
    }

    for (const root of EXTRA_ROOTS) collectTsFiles(join(ROOT, root), files);

    return files;
}

/** 文件里声明的全部 class 名（含嵌套在函数 / 块里的，如测试内的局部 class） */
function collectClassNames(sourceFile)
{
    const names = new Set();

    const visit = (node) =>
    {
        if (ts.isClassDeclaration(node) && node.name) names.add(node.name.text);
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    return names;
}

/** 判定一个 registerLogic 的第二实参 */
function judgeFactoryArg(arg, classNames)
{
    if (!arg) return { ok: false, reason: '缺少第二实参（工厂函数必填）' };

    let node = arg;

    while (ts.isParenthesizedExpression(node)) node = node.expression;

    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)
        || node.kind === ts.SyntaxKind.SatisfiesExpression)
    {
        return { ok: false, reason: '第二实参带类型断言（as / <T>）——直接传工厂函数本身' };
    }

    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return { ok: true };

    if (ts.isIdentifier(node))
    {
        if (classNames.has(node.text))
        {
            return { ok: false, reason: '裸 class 标识符「' + node.text + '」——请写「' + node.text + '.create」或工厂函数' };
        }

        return { ok: true };
    }

    // XxxLogic.create 与清单边界的 entry.logic 都走这里
    if (ts.isPropertyAccessExpression(node)) return { ok: true };

    return { ok: false, reason: '无法确认是工厂函数（' + ts.SyntaxKind[node.kind] + '）——请传 XxxLogic.create、函数名或箭头函数' };
}

/** 扫描一个已解析的文件，收集违规项 */
function scanSource(sourceFile, file, violations)
{
    const classNames = collectClassNames(sourceFile);

    const visit = (node) =>
    {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'registerLogic')
        {
            const result = judgeFactoryArg(node.arguments[1], classNames);

            if (!result.ok)
            {
                const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

                violations.push({
                    file,
                    line,
                    reason: result.reason,
                    text: node.getText(sourceFile).replace(/\s+/g, ' ').slice(0, 160),
                });
            }
        }

        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
}

/** 判据自检：样例文本必须恰好产出期望的违规（破坏性验证，防判据被改坏） */
function selfCheck()
{
    const sample = [
        'class CameraLogic { protected constructor(d: unknown) { void d; } }',
        'function cameraLogic(d: unknown): unknown { return new CameraLogic(d); }',
        'class FooLogic {}',
        "registerLogic('A', CameraLogic);",
        "registerLogic('B', CameraLogic.create);",
        "registerLogic('C', (d) => new CameraLogic(d));",
        "registerLogic('D', CameraLogic as unknown as new (d: unknown) => unknown);",
        "registerLogic('E', cameraLogic);",
        "registerLogic('F', manifest.logic);",
        "registerLogic('G', FooLogic as never);",
    ].join('\n');
    const sourceFile = ts.createSourceFile('self-check.ts', sample, ts.ScriptTarget.Latest, true);
    const violations = [];

    scanSource(sourceFile, 'self-check.ts', violations);

    const expected = ['A', 'D', 'G'];
    const actual = violations.map((v) => v.text.match(/registerLogic\('([A-G])'/)[1]);

    if (actual.join(',') !== expected.join(','))
    {
        console.error('❌ 判据自检失败：期望违规 ' + expected.join(',') + '，实测 ' + actual.join(','));
        process.exit(1);
    }

    console.log('判据自检通过（裸 class / as 断言 / as never 三类都被拦下）');
}

selfCheck();

if (process.argv.includes('--self-check')) process.exit(0);

const files = collectTargets();
const violations = [];

for (const file of files)
{
    const text = readFileSync(file, 'utf8');

    if (!text.includes('registerLogic(')) continue;

    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    scanSource(sourceFile, relative(ROOT, file), violations);
}

if (violations.length > 0)
{
    console.error('❌ registerLogic 第二实参不是工厂函数（issue #653）：');
    for (const v of violations)
    {
        console.error('  ' + v.file + ':' + v.line + '  ' + v.reason);
        console.error('    ' + v.text);
    }
    console.error('');
    console.error('统一写法：registerLogic(\'Xxx\', XxxLogic.create)；新 Logic 同样用 static create 作为唯一创建入口。');
    process.exit(1);
}

console.log('✅ registerLogic 工厂形态检查通过（扫描 ' + files.length + ' 个 TS 文件）');
