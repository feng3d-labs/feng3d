#!/usr/bin/env node
/**
 * 门禁：编辑器源码里不允许有**模块级注册副作用**（issue #170，对齐 R2）。
 *
 * ## 为什么需要它
 *
 * "有哪些功能"如果不是由清单决定，就藏进了 `import` 图的执行顺序里：
 * 漏 import 一个文件，某个类型的 Logic 就静默失去行为（`logic()` 返回 `null`，
 * 控制台一句报错，很可能没人看见）。这类问题**代码评审记不住**——
 * 加一个 Logic 类时顺手在文件末尾写一行 `registerLogic(...)` 是最自然的动作。
 * 所以按根规范 §15「每条规范必须有机器执行者」，这里把它机器化。
 *
 * ## 判据（为什么是 AST 而不是正则）
 *
 * 只看**模块顶层语句**：函数/类/对象内部调用 `registerXxx` 是正常的（那是运行时逻辑）。
 * 正则做不到这一点（要判断"这一行在不在函数里"就得理解大括号配对，正则做不到），
 * 用 TypeScript 的 AST 一行就能问清。
 *
 * ## 入口白名单
 *
 * 应用入口（`src/vue-app/main.ts`）**必须**在 import 时执行代码——它就是干这个的。
 * 所以白名单是"合法安装点"的显式登记，并且脚本会**反向校验**：
 * 白名单里的文件必须存在、且确实还有注册调用（否则说明登记项已过期，该删掉）。
 * 白名单只有一项时也不把它写死成通配，是为了让"又多了一个安装点"这件事必须经人确认。
 *
 * ## 用法
 *
 * ```
 * node scripts/check-editor-module-effects.mjs           # 人读的报告
 * node scripts/check-editor-module-effects.mjs --json    # 机器读（CI 汇总用）
 * ```
 *
 * 退出码：0 = 干净；1 = 有违规（并指出该怎么改）。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

/** 扫描根（相对仓库根） */
const SRC = 'packages/editor/src';

/**
 * 合法的安装点：应用入口。
 *
 * 值是**为什么它可以有模块级注册**——写下来是为了下一个人加白名单前先读一遍，
 * 而不是顺手把报错的文件名贴进来。
 */
const ENTRY_ALLOWLIST = new Map([
    ['packages/editor/src/vue-app/main.ts',
        '应用入口：挂载 Vue 应用之前必须完成安装（注册 objectview 组件 / 内置插件 / 字段提示）'],
]);

/** 模块级注册调用的名字形状 */
const REGISTRATION_CALL = /^(register[A-Z]\w*|setDefault[A-Z]\w*|create[A-Z]\w*Component|install[A-Z]\w*)$/;

/**
 * 模块级可变缓存容器（R2 的另一半；本 issue 只报告不拦，见输出说明）。
 *
 * 只认**无参**构造（`new Set()` / `new Map<K, V>()`）：带字面量参数的
 * （`new Set(['a', 'b'])`）是常量查找表，不是缓存，不该报。
 * 泛型参数可能有嵌套（`new Set<Tween<any>>()`），所以不能简单用 `[^>]*` 匹配。
 */
const MUTABLE_MODULE_CACHE = /^new\s+(Map|WeakMap|Set|WeakSet)\b[^(]*\(\s*\)$/;

/**
 * 递归收集待扫描的 .ts 文件。
 *
 * @param dir 目录
 * @returns 文件路径（仓库根相对）
 */
function collect(dir)
{
    const out = [];
    for (const name of readdirSync(dir))
    {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...collect(full));
        else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) out.push(full);
    }

    return out;
}

/**
 * 扫一个文件的模块顶层语句。
 *
 * @param file 仓库根相对路径
 * @returns `{ registrations, caches }`，各自为 `{ line, text }` 数组
 */
function scanFile(file)
{
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const registrations = [];
    const caches = [];

    for (const statement of source.statements)
    {
        if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression))
        {
            const callee = statement.expression.expression.getText(source);
            if (REGISTRATION_CALL.test(callee)) registrations.push({ line: lineOf(source, statement), text: `${callee}()` });
        }

        if (ts.isVariableStatement(statement))
        {
            for (const declaration of statement.declarationList.declarations)
            {
                const init = declaration.initializer?.getText(source) ?? '';
                if (MUTABLE_MODULE_CACHE.test(init)) caches.push({ line: lineOf(source, statement), text: `${declaration.name.getText(source)} = ${init}` });
            }
        }
    }

    return { registrations, caches };
}

/**
 * 取语句所在行号（1 起）。
 *
 * @param source 源文件
 * @param node 节点
 */
function lineOf(source, node)
{
    return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

/**
 * 扫描全部文件。
 *
 * @returns `{ violations, allowed, caches, scanned }`
 */
function scanAll()
{
    const files = collect(SRC).map((file) => file.split('\\').join('/'));
    const violations = [];
    const allowed = [];
    const caches = [];

    for (const file of files)
    {
        const { registrations, caches: fileCaches } = scanFile(file);
        const isEntry = ENTRY_ALLOWLIST.has(file);

        for (const hit of registrations) (isEntry ? allowed : violations).push({ file, ...hit });
        for (const hit of fileCaches) caches.push({ file, ...hit });
    }

    // 反向校验白名单：登记项必须存在且确实有注册调用，否则是过期登记
    const staleEntries = [...ENTRY_ALLOWLIST.keys()].filter(
        (file) => !files.includes(file) || !allowed.some((hit) => hit.file === file),
    );

    return { violations, allowed, caches, staleEntries, scanned: files.length };
}

const result = scanAll();

if (process.argv.includes('--json'))
{
    console.log(JSON.stringify(result, null, 2));
}
else
{
    console.log(`[编辑器模块级副作用] 扫描 ${result.scanned} 个 .ts 文件`);

    for (const [file, reason] of ENTRY_ALLOWLIST)
    {
        const hits = result.allowed.filter((hit) => hit.file === file);
        console.log(`  ✅ 入口白名单：${file}（${reason}）`);
        for (const hit of hits) console.log(`       :${hit.line}  ${hit.text}`);
    }

    if (result.staleEntries.length > 0)
    {
        console.log(`\n❌ 白名单里有过期登记（文件不存在或已无注册调用）：`);
        for (const file of result.staleEntries) console.log(`   - ${file}`);
    }

    if (result.violations.length === 0)
    {
        console.log(`\n✅ 除入口外没有模块级注册副作用（R2）`);
    }
    else
    {
        console.log(`\n❌ 除入口外发现 ${result.violations.length} 处模块级注册副作用：`);
        for (const hit of result.violations) console.log(`   - ${hit.file}:${hit.line}  ${hit.text}`);
        console.log('\n   怎么改：把注册写成**清单声明**，再由核心显式安装——');
        console.log('   · Logic：加进 packages/editor/src/plugins/builtinLogics.ts 的 contributes.logics（类型名 + 类）');
        console.log('   · 面板 / 场景浮层：加进 packages/editor/src/plugins/builtin.ts 的 contributes');
        console.log('   清单在启动时由 installBuiltinPlugins() 统一安装（见 src/plugins/install.ts）。');
    }

    // 缓存容器是 R2 的另一半，但不属于本 issue 的范围（issue #170 只管注册副作用），
    // 所以只报告不拦——把它当门禁会让本次改动一夜之间变红，然后被加白名单绕过
    if (result.caches.length > 0)
    {
        console.log(`\nℹ️  另有 ${result.caches.length} 处模块级可变缓存容器（R2 的另一半，本次不拦）：`);
        for (const hit of result.caches) console.log(`   - ${hit.file}:${hit.line}  ${hit.text}`);
    }
}

process.exit(result.violations.length === 0 && result.staleEntries.length === 0 ? 0 : 1);
