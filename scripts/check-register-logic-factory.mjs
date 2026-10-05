/**
 * registerLogic 第二实参必须是工厂函数，且 Logic 不再有 class——机器执行者（issue #653 / #674）。
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
 * - 工厂函数名（cameraLogic / geometryLogic / scriptDemoLogic …，issue #674 起 Logic 一律是工厂函数）；
 * - 箭头函数 / 函数表达式；
 * - 数据传递（编辑器清单边界 entry.logic，其类型是 LogicFactoryRef）。
 *
 * ## 另一条判据：Logic 不许再是 class（issue #674）
 *
 * 全部批次迁完后本仓不再有 `class XxxLogic`：一律 `interface XxxLogic` + 文件级共享 proto + 工厂函数。
 * 本脚本一并按 AST 拦下新写的 `class XxxLogic` / `class XxxLogicBase`。
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
import { assertScanVolume } from './scan-volume.mjs';

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
            return { ok: false, reason: '裸 class 标识符「' + node.text + '」——请传工厂函数（issue #674：Logic 不再有 class）' };
        }

        return { ok: true };
    }

    // XxxLogic.create 与清单边界的 entry.logic 都走这里
    if (ts.isPropertyAccessExpression(node)) return { ok: true };

    return { ok: false, reason: '无法确认是工厂函数（' + ts.SyntaxKind[node.kind] + '）——请传工厂函数名或箭头函数' };
}

/** Logic 类名判据：XxxLogic / XxxLogicBase（issue #674 起一律是 interface + 工厂函数） */
const LOGIC_CLASS_NAME = /Logic(Base)?$/;

/** 扫描一个文件里的 `class XxxLogic` 定义 */
function scanLogicClass(sourceFile, file, violations)
{
    const visit = (node) =>
    {
        if (ts.isClassDeclaration(node) && node.name && LOGIC_CLASS_NAME.test(node.name.text))
        {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

            violations.push({
                file,
                line,
                reason: 'Logic 不许再是 class（issue #674）：改为 interface + 文件级 proto + 工厂函数',
                text: node.getText(sourceFile).replace(/\s+/g, ' ').slice(0, 160),
            });
        }

        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
}

/** 已删除 API 判据：Logic 不再用共享原型（2026-10-05 口径修订） */
function scanDeprecatedProtoApi(sourceFile, file, violations)
{
    const visit = (node) =>
    {
        if (ts.isIdentifier(node) && node.text === 'createLogicProto')
        {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

            violations.push({
                file,
                line,
                reason: 'createLogicProto 已删除（Logic 改为「工厂闭包直接返回对象字面量」）',
                text: node.getText(sourceFile),
            });
        }

        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
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
function selfCheckFactory()
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

    console.log('工厂形态判据自检通过（裸 class / as 断言 / as never 三类都被拦下）');
}

/** class 判据自检：XxxLogic / XxxLogicBase 必须被拦下，interface 与普通 class 放行 */
function selfCheckLogicClass()
{
    const sample = [
        'class CameraLogic { }',
        'class ComponentLogicBase { }',
        'class FooStub { }',
        'interface BarLogic { }',
    ].join('\n');
    const sourceFile = ts.createSourceFile('self-check-class.ts', sample, ts.ScriptTarget.Latest, true);
    const violations = [];

    scanLogicClass(sourceFile, 'self-check-class.ts', violations);

    const actual = violations.map((v) => v.text.match(/class (\w+)/)[1]);

    if (actual.join(',') !== 'CameraLogic,ComponentLogicBase')
    {
        console.error('❌ class 判据自检失败：期望 CameraLogic,ComponentLogicBase，实测 ' + actual.join(','));
        process.exit(1);
    }

    console.log('class 判据自检通过（XxxLogic / XxxLogicBase 被拦下，interface 与普通 class 放行）');
}

/** 已删除 API 判据自检：createLogicProto 出现即违规 */
function selfCheckDeprecatedProto()
{
    const sample = [
        "import { createLogicProto } from '@feng3d/reactivity';",
        'const proto = createLogicProto(null, {});',
        'const fine = createGeometryLogicState(() => ({}), () => [], {});',
    ].join('\n');
    const sourceFile = ts.createSourceFile('self-check-proto.ts', sample, ts.ScriptTarget.Latest, true);
    const violations = [];

    scanDeprecatedProtoApi(sourceFile, 'self-check-proto.ts', violations);

    if (violations.length !== 2)
    {
        console.error('❌ createLogicProto 判据自检失败：期望 2 处，实测 ' + violations.length);
        process.exit(1);
    }

    console.log('createLogicProto 判据自检通过（import 与调用都被拦下）');
}

selfCheckFactory();
selfCheckLogicClass();
selfCheckDeprecatedProto();

if (process.argv.includes('--self-check')) process.exit(0);

const files = collectTargets();

assertScanVolume({
    label: 'registerLogic 工厂形态扫描（各包 src/test + examples/src + test 下的 TS）',
    count: files.length,
    min: 1,
    detail: '扫描根：packages/<pkg>/{src,test}、examples/src、test（本脚本的 collectTargets）',
});

const violations = [];

for (const file of files)
{
    const text = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);

    const hasProtoApi = text.includes('createLogicProto');

    if (!text.includes('registerLogic(') && !/class\s+\w*Logic\b/.test(text) && !hasProtoApi) continue;

    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    if (/class\s+\w*Logic\b/.test(text))
    {
        scanLogicClass(sourceFile, rel, violations);
    }

    if (hasProtoApi)
    {
        scanDeprecatedProtoApi(sourceFile, rel, violations);
    }

    if (text.includes('registerLogic('))
    {
        scanSource(sourceFile, rel, violations);
    }
}

if (violations.length > 0)
{
    console.error('❌ registerLogic 工厂形态 / Logic class 违规（issue #653 / #674）：');
    for (const v of violations)
    {
        console.error('  ' + v.file + ':' + v.line + '  ' + v.reason);
        console.error('    ' + v.text);
    }
    console.error('');
    console.error('统一写法：registerLogic(\'Xxx\', xxxLogic)——Logic 一律是 interface + 共享 proto + 工厂函数（issue #674）。');
    process.exit(1);
}

console.log('✅ registerLogic 工厂形态检查通过（扫描 ' + files.length + ' 个 TS 文件）');
