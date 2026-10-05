/**
 * 门禁：**已删除的模块不许复活**（#280 起）。
 *
 * ## 为什么需要它
 *
 * 本仓删东西时习惯在文档里写一句"不复活这段"（例如 §7 债务表的第 12 项：
 * 旧网络客户端 `src/net/client.ts` 带硬编码 6502 端口与写死的用户名，已删）。
 * 但**写在文档里的话没有执行者**——下次有人"顺手加回来"（或新写一个同名文件）不会有人发现。
 * 这条判据就是那句话的机器执行者。
 *
 * ## 判据
 *
 * 1. 清单里每个路径**确实不存在**（`existsSync` 为假）；
 * 2. **没有任何 `.ts` / `.vue` 文件 import 或 re-export 它**——
 *    防"文件删了、引用还留着"，也防"换个位置又长出来"（引用的名字仍然指向它）；
 * 3. **判据自证**（照 issue #652 做法 2）：判据函数喂正 / 负样例，判据写错时不会静默全绿；
 * 4. **空转检查**：清单不能是空的（否则这一组检查什么也没验）。
 *
 * 退出码：0 = 通过；1 = 有复活或自证失败。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const EDITOR_SRC = resolve(ROOT, 'packages/editor/src');

/**
 * 已删除、**不许复活**的模块。
 *
 * 加一条时请写清"为什么删"与"真要它时该怎么做"——不然下一个人只会看到一条禁令。
 */
const REMOVED = [
    {
        path: 'packages/editor/src/net/client.ts',
        specifier: 'net/client',
        reason: '旧网络客户端残留（硬编码 6502 端口、用户名写死）——已删（2026-10-05，#280）',
        instead: '多人协作尚未立项（一致性模型的候选与代价见 ARCHITECTURE.md §11 问题 23），真要实现时重新写',
    },
    {
        path: 'packages/editor/libs/typescriptServices.js',
        specifier: 'typescriptServices',
        reason: '6.23 MB 的 TypeScript 3.0 编译器，全仓 0 引用（`ScriptCompiler` 已随 #275 删除）',
        instead: '编译与类型检查交给项目自己的 `npm run build`（决策 4 = vite、决策 13 = 走项目 scripts）',
    },
    {
        path: 'packages/editor/libs/typescriptServices.d.ts',
        specifier: 'typescriptServices',
        reason: '同上（它的类型声明，0.27 MB，全仓 0 引用）',
        instead: '同上（要对照 TypeScript 旧行为请从上游取值，不要在编辑器里内置一份）',
    },
    {
        path: 'packages/editor/libs/jquery.js',
        specifier: 'libs/jquery',
        reason: 'jQuery 本体（0.26 MB），全仓 0 引用 —— 二维码功能已改用 npm 包 qrcode（src/utils/QRCode.ts 的注释写着「不依赖 jQuery」）',
        instead: '需要 DOM 便利方法时用原生 API 或 Vue；需要二维码用 qrcode',
    },
    {
        path: 'packages/editor/libs/jquery.d.ts',
        specifier: 'libs/jquery',
        reason: '同上（jQuery 的类型声明，0.36 MB，0 引用）',
        instead: '同上',
    },
    {
        path: 'packages/editor/libs/jquery.qrcode.js',
        specifier: 'libs/jquery.qrcode',
        reason: 'jQuery 版二维码插件，0 引用 —— 现用 npm 包 qrcode',
        instead: '用 qrcode（src/utils/QRCode.ts 已是这个实现）',
    },
    {
        path: 'packages/editor/libs/require.min.js',
        specifier: 'libs/require.min',
        reason: 'AMD loader，0 引用（构建与运行都不再走 AMD）',
        instead: 'ESM —— vite 的入口图',
    },
    {
        path: 'packages/editor/libs/exml.e.d.ts',
        specifier: 'exml.e.d.ts',
        reason: 'Egret EXML 的类型声明，0 引用（feng3d 之前的历史遗留）',
        instead: '不需要',
    },
];

/** 采集一个目录下所有 `.ts` / `.vue` 文件 */
function collect(dir)
{
    const found = [];

    for (const entry of readdirSync(dir))
    {
        const full = join(dir, entry);

        if (statSync(full).isDirectory()) found.push(...collect(full));
        else if (entry.endsWith('.ts') || entry.endsWith('.vue')) found.push(full);
    }

    return found;
}

/**
 * 判据 2 的判据函数：源码里是否还**引用**某个已删模块。
 *
 * 只认"导入 / 再导出"这类**依赖关系**，不认注释与普通字符串：
 * 文档与注释里提到 `net/client` 恰恰是**说明它删了**，不该算复活。
 *
 * @param {string} source 源码
 * @param {string} specifier 被引用的路径片段（如 `net/client`）
 * @returns {boolean} 是否命中（true = 违规）
 */
function referencesModule(source, specifier)
{
    return source
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .filter((line) => !/^\s*(\/\*|\*)/.test(line))
        .some((line) => /\b(?:import|export)\b/.test(line) && line.includes(specifier));
}

// ---------- 自证（issue #652 做法 2） ----------
const SELF_CHECKS = [
    {
        title: '`import ... from \'./net/client\'` → 报',
        run: () => referencesModule("import { NetClient } from './net/client';", 'net/client'),
        expect: true,
    },
    {
        title: '`export * from \'./net/client\'` → 报（再导出同样算引用）',
        run: () => referencesModule("export * from './net/client';", 'net/client'),
        expect: true,
    },
    {
        title: '注释里提到它 → 不报（那正是"说明它删了"）',
        run: () => referencesModule('// 曾：src/net/client.ts（已删）', 'net/client'),
        expect: false,
    },
    {
        title: '普通字符串提到它 → 不报（不是依赖关系）',
        run: () => referencesModule("const note = 'net/client 已删';", 'net/client'),
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

// ---------- 空转检查 ----------
if (REMOVED.length === 0)
{
    console.error('❌ 已删模块清单是空的——这一组检查什么也没验（加一条进来，或删掉这个门禁）。');
    process.exit(1);
}

// ---------- 判据 1 + 2 ----------
const files = collect(EDITOR_SRC);
const problems = [];

for (const item of REMOVED)
{
    const full = resolve(ROOT, item.path);
    // 引用判据用**显式**的 `specifier`：从路径推，对 `src/` 下的文件成立，
    // 但对 `libs/xxx.js` 会推出整条路径 —— 于是「没人引用」恒真、判据空转。
    const specifier = item.specifier;

    if (existsSync(full))
    {
        problems.push(`\`${item.path}\` **又出现了**（${item.reason}；${item.instead}）`);

        continue;
    }

    const referencing = files
        .filter((file) => referencesModule(readFileSync(file, 'utf8'), specifier))
        .map((file) => relative(ROOT, file).split('\\').join('/'));

    if (referencing.length > 0)
    {
        problems.push(`\`${item.path}\` 已被引用（文件不在、引用还在）：${referencing.join(' / ')}`);
    }
}

console.log('');
console.log('--- 判据 ---');
console.log(`  ${problems.length === 0 ? 'PASS' : 'FAIL'}  已删的 ${REMOVED.length} 个模块都没复活（文件不存在 + 没人引用）`);

for (const problem of problems) console.log(`        ${problem}`);

console.log('');
console.log(`共 ${SELF_CHECKS.length + 2} 项：通过 ${SELF_CHECKS.length + 2 - problems.length - selfFailed}，失败 ${problems.length + selfFailed}`);

if (problems.length > 0)
{
    console.error('\n❌ 已删除的模块复活了。真需要它时请看清单里写的"该怎么做"，不要照旧实现搬回来。');
    process.exit(1);
}

console.log('✅ 已删模块清单里没有复活迹象');
