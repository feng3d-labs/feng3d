#!/usr/bin/env node
/**
 * **端到端**：宿主把插件包装进编辑器页面（#276 任务 4 的完整链路）。
 *
 * 前面两个脚本分别守在两端：
 * - `check-editor-boot.mjs`：宿主**产出的入口图对不对**（协议级）；
 * - `packages/editor/test/pluginBoot.spec.ts`：页面**读入口图的逻辑对不对**（单元）。
 *
 * 这个脚本把它们连起来，用**真产物 + 真插件包**走一遍：
 *
 * ```
 * ① 构建产物 packages/editor/public/（需要先 npm run build）
 * ② esbuild 把样板包 client 半打成 public/plugins/rotate.js（模拟"插件包已由第三方构建好"）
 * ③ 写 public/editor.plugins.json（本地、不入库）
 * ④ 起宿主 → 打开它的页面 → 界面里应当**多出**样板包贡献的那个面板
 * ```
 *
 * 这就是"**不重新构建编辑器就装一个插件**"（#276 验收②）由**宿主**驱动的形态——
 * 与阶段 4 那条（测试脚本直接调装载器）相比，这条走的是真实路径。
 *
 * 用法：
 *   node scripts/editor-plugin-host-load.mjs          # 需要已构建产物
 *   node scripts/editor-plugin-host-load.mjs --build  # 先构建再跑（慢）
 *
 * 退出码：0 通过；1 失败；2 缺少前置（未构建产物）。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import * as esbuild from 'esbuild';

const ROOT = process.cwd();
const PUBLIC_DIR = resolve(ROOT, 'packages', 'editor', 'public');
const SERVE = resolve(ROOT, 'packages', 'editor', 'bin', 'serve.mjs');
const PLUGIN_CLIENT = resolve(ROOT, 'packages', 'editor-plugin-rotate', 'src', 'client.ts');
const BUNDLED_PLUGIN = resolve(PUBLIC_DIR, 'plugins', 'rotate.js');
const PLUGIN_CONFIG = resolve(PUBLIC_DIR, 'editor.plugins.json');
const PLUGIN_ID = '@feng3d/editor-plugin-rotate';

/**
 * 宿主这次要打开的项目目录（**每次唯一**的空目录）。
 *
 * 决策 ① 之后**宿主必须有个项目**：编辑器不再有"页面内副本"可退，文件系统初值是 `HostFS`
 * —— 宿主不给项目时页面会自己报「项目未打开」（本脚本上一次跑就是 5/6，唯一失败的那条）。
 *
 * 用 `mkdtempSync` 而不是固定路径：`--new` 只写进**空目录**（那是有意的，
 * 见 `bin/host/projectNew.mjs`），固定路径第二次跑就会因"目录非空"而失败。
 */
const PROJECT_DIR = mkdtempSync(join(tmpdir(), 'feng3d-host-load-'));

const doBuild = process.argv.includes('--build');

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
 * 跑一条命令并等它结束（用于可选的构建）。
 *
 * @param {string} command 命令
 * @param {string[]} args 参数
 * @returns {Promise<number>} 退出码
 */
function run(command, args)
{
    return new Promise((resolve_) =>
    {
        const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });

        child.on('close', (code) => resolve_(code ?? 1));
    });
}

// ---------- 前置：构建产物 ----------
if (!existsSync(resolve(PUBLIC_DIR, 'index.html')))
{
    if (!doBuild)
    {
        console.error('缺少构建产物：packages/editor/public/index.html\n'
            + '请先 `npm run build --workspace feng3d-editor`，或加 `--build` 让本脚本先构建。');
        process.exit(2);
    }

    console.log('[宿主装载] 先构建编辑器产物…');
    const code = await run('npm', ['run', 'build', '--workspace', 'feng3d-editor']);

    if (code !== 0)
    {
        console.error('构建失败');
        process.exit(2);
    }
}

console.log('[宿主装载] #276 任务 4：宿主产出入口图 → 页面自行装载');

// ---------- ② 打包插件包的 client 半 ----------
// 这一步代表"插件包由第三方构建好"：产物是一个普通 ESM 文件，宿主只负责分发它。
await esbuild.build({
    entryPoints: [PLUGIN_CLIENT],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    outfile: BUNDLED_PLUGIN,
    logLevel: 'warning',
    // Vue 由插件自己带着（共享依赖要等基座表 / importmap，见 #276 决策稿 §3.5 的 M1/M2）
    // 编辑器包**不该**出现在这里：样板包的 client 半只 `import type` 它（打包时被擦除）
});

check('插件包 client 半被打成可加载的 ESM', existsSync(BUNDLED_PLUGIN));

// ---------- ③ 写插件配置（本地、不入库） ----------
writeFileSync(PLUGIN_CONFIG, JSON.stringify({
    plugins: [{ id: PLUGIN_ID, clientUrl: '/plugins/rotate.js', apiVersion: '^1.0.0', halves: ['client', 'runtime'] }],
}, null, 4), 'utf8');

// ---------- ④ 起宿主并打开它的页面 ----------
const child = spawn(process.execPath, [SERVE, '--port', '0', '--root', PUBLIC_DIR, '--new', PROJECT_DIR], { stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '';

child.stdout.on('data', (chunk) => { stdout += chunk; });
child.stderr.on('data', (chunk) => { stdout += chunk; });

const base = await new Promise((resolve_) =>
{
    const deadline = Date.now() + 30000;
    const tick = setInterval(() =>
    {
        const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(stdout);

        if (matched) { clearInterval(tick); resolve_(matched[1]); }
        else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
    }, 100);
});

if (!base)
{
    console.error(`宿主没起来：\n${stdout}`);
    process.exit(1);
}

console.log(`[宿主装载] 宿主 ${base}`);

// 入口图确实注入了页面（HTTP 层能看到）
const html = await (await fetch(base)).text();

check('宿主把入口图注入了页面', html.includes('__EDITOR_BOOT__') && html.includes('/plugins/rotate.js'));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const pageErrors = [];

page.on('pageerror', (error) => pageErrors.push(error.message.split('\n')[0]));

await page.goto(base, { waitUntil: 'load' });

/**
 * 界面上的标签文字。
 *
 * @returns {Promise<string[]>} 标签列表
 */
async function tabLabels()
{
    return page.$$eval('.el-tabs__item', (nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
}

/**
 * 等条件成立。
 *
 * @param {() => Promise<boolean>} condition 条件
 * @param {number} timeoutMs 超时
 * @returns {Promise<boolean>} 是否成立
 */
async function waitFor(condition, timeoutMs = 30000)
{
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline)
    {
        if (await condition()) return true;
        await new Promise((resolve_) => setTimeout(resolve_, 250));
    }

    return false;
}

const ready = await waitFor(async () => (await tabLabels()).length > 0);

check('编辑器界面起来了', ready, `标签：${(await tabLabels()).join(' / ') || '（还没有）'}`);

// 宿主在响应 HTML 时就注入了入口图，页面启动即装载 —— 所以**观测不到"装载前"的窗口**，
// 判据直接看"插件独有的那个面板在不在"（`panels.rotate` 是样板包的 labelKey，内置清单里没有）。
await waitFor(async () => (await tabLabels()).some((label) => label.includes('rotate')));

const labels = await tabLabels();

check('**宿主装载的插件贡献的面板出现在界面上**（无需重新构建编辑器）',
    labels.some((label) => label.includes('rotate')),
    `${labels.length} 个标签：${labels.join(' / ')}`);

check('内置面板一个不少（插件是加上去的，不是替换）', labels.length >= 6, `${labels.length} 个标签`);

check('零 pageerror', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

await page.screenshot({ path: resolve(ROOT, 'packages', 'editor', '.temp', 'host-plugin-load.png') }).catch(() => { /* 截图失败不影响判据 */ });

await browser.close();
child.kill();

// ---------- 清理（配置与产物都不入库） ----------
rmSync(PLUGIN_CONFIG, { force: true });
rmSync(resolve(PUBLIC_DIR, 'plugins'), { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 宿主装载未通过——"不重新构建就装插件"这条链路是 #276 验收②的正面证据。');
    process.exit(1);
}

console.log('✅ 宿主装载通过：宿主产出入口图 → 页面自行装载 → 界面出现插件包的面板');
