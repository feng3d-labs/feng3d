#!/usr/bin/env node
/**
 * 宿主门禁（#272 P0）。
 *
 * 宿主进程（`packages/editor/bin/`）是**最上层**：它跑编辑器产物、将来还要装插件、
 * 管项目工作区。这个脚本守四条，全部要求"有机器执行者"（根 AGENTS.md §15 元规则）：
 *
 * 1. **入口白名单 + 反向校验**：进程入口（`bin/serve.mjs`）在模块顶层建 context、装服务、
 *    启动监听——那是它的职责。白名单是"合法启动点"的**显式登记**，并且反向校验：
 *    登记的文件必须存在、且确实还有启动调用（否则说明登记过期）。
 *    （为什么不在 `check-editor-module-effects.mjs` 里：那个脚本的范围是浏览器侧
 *    `packages/editor/src/**` 的 `.ts`，宿主是 Node 侧的 `.mjs`，两边的"入口"是两件事。）
 * 2. **依赖方向（R1）**：宿主是最上层，**不得**反向依赖浏览器侧代码——
 *    `bin/**` 里不许出现 `vue` / `element-plus`，也不许用相对路径穿越到 `packages/editor/src/**`。
 * 3. **服务级：能起、能停**（平台无关）：`StaticServer.start()` 能起来并能响应 HTTP，
 *    `ctx.fiber.dispose()` 之后端口释放——"能停"的机制在这里验，不依赖进程信号。
 * 4. **进程级：能报版本、能被终止**：`--version` 打印版本串并退出 0；
 *    真起一个进程能响应，终止后端口释放。
 *
 * 用法：
 *   node scripts/check-editor-host.mjs
 *
 * 退出码：0 通过（含自检）；1 有违规或自检失败。
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { StaticServer } from '../packages/editor/bin/host/staticServer.mjs';
import { HostInfo } from '../packages/editor/bin/host/hostInfo.mjs';

const ROOT = process.cwd();
const BIN_DIR = resolve(ROOT, 'packages', 'editor', 'bin');
const SRC_DIR = resolve(ROOT, 'packages', 'editor', 'src');
const SERVE = resolve(BIN_DIR, 'serve.mjs');

/**
 * 进程入口白名单：值是**为什么它可以模块级启动**。
 *
 * 反向校验：登记项必须存在、且确实还有启动调用（`staticServer.start()`）。
 */
const ENTRY_ALLOWLIST = new Map([
    ['packages/editor/bin/serve.mjs',
        '进程入口：模块顶层建 cordis context、装服务、启动监听——它就是干这个的'],
]);

/** 禁止的裸模块（判据 2） */
const FORBIDDEN = [
    { match: (spec) => spec === 'vue' || spec.startsWith('vue/'), why: 'Vue（浏览器侧界面层）' },
    { match: (spec) => spec === 'element-plus' || spec.startsWith('element-plus/'), why: 'Element Plus（浏览器侧界面层）' },
    { match: (spec) => spec === 'feng3d' || spec.startsWith('@feng3d/'), why: '引擎 / 编辑器内核（宿主不该跑渲染）' },
];

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
 * 递归收集某目录下的 `.mjs` 文件。
 *
 * @param {string} dir 目录
 * @param {string[]} out 收集结果
 * @returns {string[]} 文件绝对路径
 */
function collect(dir, out = [])
{
    if (!existsSync(dir)) return out;

    for (const entry of readdirSync(dir))
    {
        const full = join(dir, entry);
        const st = statSync(full);

        if (st.isDirectory()) collect(full, out);
        else if (entry.endsWith('.mjs')) out.push(full);
    }

    return out;
}

/**
 * 抽出一个文件里的裸模块与相对说明符。
 *
 * @param {string} text 文件内容
 * @returns {{ specifiers: string[], hasStartCall: boolean }} 说明符与是否含启动调用
 */
function scanFile(text)
{
    const specifiers = [];
    const pattern = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    for (const matched of text.matchAll(pattern))
    {
        if (matched[1]) specifiers.push(matched[1]);
        if (matched[2]) specifiers.push(matched[2]);
    }

    return { specifiers, hasStartCall: /staticServer\.start\s*\(/.test(text) };
}

/**
 * 判定一个说明符是否违规（抽成纯函数是为了让自检能直接喂样例）。
 *
 * @param {string} spec 说明符
 * @param {string} fromFile 引用方文件绝对路径
 * @returns {{ forbidden: boolean, why?: string }} 判定结果
 */
function judge(spec, fromFile)
{
    if (spec.startsWith('.') || spec.startsWith('/'))
    {
        const resolved = resolve(fromFile, '..', spec);

        if (resolved === SRC_DIR || resolved.startsWith(SRC_DIR + sep))
        {
            return { forbidden: true, why: `相对路径穿越到浏览器侧源码（${spec}）` };
        }

        return { forbidden: false };
    }

    for (const rule of FORBIDDEN)
    {
        if (rule.match(spec)) return { forbidden: true, why: rule.why };
    }

    return { forbidden: false };
}

console.log('[宿主门禁] #272 P0：入口登记 / 依赖方向 / 能起能停能报版本');

// ---------- 判据 1：入口白名单 + 反向校验 ----------
const hostFiles = collect(BIN_DIR).map((file) => file.split(sep).join('/'));

// 逐条校验登记：文件必须存在、且确实还有启动调用——登记过期就是失败
for (const [file, reason] of ENTRY_ALLOWLIST)
{
    const full = resolve(ROOT, file);
    const exists = existsSync(full);
    const scan = exists ? scanFile(readFileSync(full, 'utf8')) : { hasStartCall: false };

    check(`入口登记有效：${file}`, exists && scan.hasStartCall, `${reason}${exists ? '' : '（文件不存在）'}`);
}

// ---------- 判据 2：依赖方向 ----------
const violations = [];

for (const file of hostFiles)
{
    const { specifiers } = scanFile(readFileSync(file, 'utf8'));

    for (const spec of specifiers)
    {
        const verdict = judge(spec, file);

        if (verdict.forbidden)
        {
            violations.push(`${file.split(sep).join('/').replace(`${ROOT.split(sep).join('/')}/`, '')} -> ${spec}（${verdict.why}）`);
        }
    }
}

check('宿主不反向依赖浏览器侧代码（R1：宿主是最上层）', violations.length === 0, violations.slice(0, 3).join(' | '));
check('宿主文件都在（bin/ 有内容）', hostFiles.length >= 3, `${hostFiles.length} 个 .mjs`);

// 自检：判据 2 本身要能被证明有效
const selfChecks = [
    ['Vue 被拦下', judge('vue', join(BIN_DIR, 'x.mjs')).forbidden],
    ['Element Plus 被拦下', judge('element-plus', join(BIN_DIR, 'x.mjs')).forbidden],
    ['引擎被拦下', judge('feng3d', join(BIN_DIR, 'x.mjs')).forbidden],
    ['编辑器内核被拦下', judge('@feng3d/particlesystem', join(BIN_DIR, 'x.mjs')).forbidden],
    ['相对路径穿越到 src 被拦下', judge('../../src/vue-app/main.ts', join(BIN_DIR, 'host', 'x.mjs')).forbidden],
    ['Node 内置允许', !judge('node:http', join(BIN_DIR, 'x.mjs')).forbidden],
    ['cordis 允许', !judge('@deepseek-ai/cordis', join(BIN_DIR, 'x.mjs')).forbidden],
    ['同目录相对允许', !judge('./hostInfo.mjs', join(BIN_DIR, 'x.mjs')).forbidden],
];

for (const [title, ok] of selfChecks)
{
    check(`自检：${title}`, ok);
}

// ---------- 判据 3：服务级能起能停（平台无关） ----------
const ctx = new Context();
const hostInfo = new HostInfo(ctx);
const staticServer = new StaticServer(ctx, { root: resolve(ROOT, 'packages', 'editor'), host: '127.0.0.1', port: 0 });

let serviceUrl = '';

try
{
    serviceUrl = await staticServer.start();
}
catch (error)
{
    check('服务能启动', false, String(error?.message ?? error));
}

check('服务能启动并报出地址', /^http:\/\/127\.0\.0\.1:\d+\/$/.test(serviceUrl), serviceUrl);

try
{
    const response = await fetch(new URL('index.html', serviceUrl));

    check('服务能响应静态资源', response.ok, `GET index.html → ${response.status}`);
}
catch (error)
{
    check('服务能响应静态资源', false, String(error?.message ?? error));
}

// 卸载 context：服务的清理函数应当跑（关闭监听）——这就是"能停"的机制
await ctx.fiber.dispose();

let portReleased = false;

try
{
    await fetch(new URL('index.html', serviceUrl));
}
catch
{
    portReleased = true;
}

check('卸载 context 后端口释放（生命周期交给 cordis）', portReleased, serviceUrl);

check('宿主能报版本（服务级）', /feng3d-editor\/\d+\.\d+\.\d+/.test(hostInfo.describe()), hostInfo.describe());

// ---------- 判据 4：进程级 --version 与终止 ----------
/**
 * 跑一个子进程并等它结束。
 *
 * @param {string[]} args 参数
 * @param {number} timeoutMs 超时
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, timedOut: boolean }>} 结果
 */
function runNode(args, timeoutMs = 20000)
{
    return new Promise((resolve_) =>
    {
        const child = spawn(process.execPath, [SERVE, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() =>
        {
            timedOut = true;
            child.kill();
        }, timeoutMs);

        child.stdout.on('data', (chunk) => { stdout += chunk; });
        child.stderr.on('data', (chunk) => { stderr += chunk; });
        child.on('close', (code) =>
        {
            clearTimeout(timer);
            resolve_({ code, stdout, stderr, timedOut });
        });
    });
}

const versionRun = await runNode(['--version']);

check('进程级：--version 打印版本串并退出 0',
    versionRun.code === 0 && /feng3d-editor\/\d+\.\d+\.\d+/.test(versionRun.stdout),
    versionRun.stdout.trim().split('\n')[0]);

// 向后兼容：原有的 CLI 面（`--help`）不能因为接 cordis 而丢
const helpRun = await runNode(['--help']);

check('进程级：--help 仍然可用（原有 CLI 面不变）',
    helpRun.code === 0 && /--port/.test(helpRun.stdout) && /--open/.test(helpRun.stdout),
    `${helpRun.stdout.split('\n').length} 行帮助`);

// 真起一个进程（端口 0 → 由系统分配，避免与别的进程撞），能响应即算"能起"
const child = spawn(process.execPath, [SERVE, '--port', '0', '--root', resolve(ROOT, 'packages', 'editor')], {
    stdio: ['ignore', 'pipe', 'pipe'],
});
let childOut = '';

child.stdout.on('data', (chunk) => { childOut += chunk; });

const started = await new Promise((resolve_) =>
{
    const deadline = Date.now() + 20000;
    const tick = setInterval(() =>
    {
        const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(childOut);

        if (matched) { clearInterval(tick); resolve_(matched[1]); }
        else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
    }, 100);
});

check('进程级：宿主能起（报出可用地址）', started.length > 0, started || childOut.trim().split('\n').slice(-1)[0]);

if (started)
{
    try
    {
        const response = await fetch(new URL('index.html', started));

        check('进程级：起来的宿职能响应', response.ok, `GET index.html → ${response.status}`);
    }
    catch (error)
    {
        check('进程级：起来的宿职能响应', false, String(error?.message ?? error));
    }
}

// 终止：Windows 上 kill() 是强制终止（没有信号语义），所以这里只断言"进程确实退出了、端口释放"
const exited = await new Promise((resolve_) =>
{
    const timer = setTimeout(() => resolve_(false), 10000);

    child.on('close', () => { clearTimeout(timer); resolve_(true); });
    child.kill();
});

check('进程级：宿职能被终止', exited);

let processPortReleased = false;

if (started)
{
    try
    {
        await fetch(new URL('index.html', started));
    }
    catch
    {
        processPortReleased = true;
    }
}

check('进程级：终止后端口释放', processPortReleased, started);

// ---------- 汇总 ----------
console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 宿主门禁未通过——宿主是最上层，它的边界（依赖方向、能起能停）不该靠人来记。');
    process.exit(1);
}

console.log('✅ 宿主门禁通过：入口已登记、依赖方向正确、能起能停能报版本');
