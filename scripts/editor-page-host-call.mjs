#!/usr/bin/env node
/**
 * **页面直接调宿主方法**的验收（#272 的"宿主面板"地基）。
 *
 * ## 为什么这件事值得单独验
 *
 * `host.` 方法本来是给**调用方**（CLI / MCP / e2e）用的；而**页面**要用宿主能力（列出项目文件、
 * 触发构建）时，它既不能自己碰磁盘，也不该让调用方替它转一手。页面与宿主**同源**——
 * 所以它可以**直接** `fetch('/__editor-bridge/call', …)`。
 *
 * 这条能力此前从未验过，而它是"宿主面板"（项目文件树 / 构建按钮 / 构建输出）的前提：
 * 面板里每一个动作都建立在"页面能调 `host.*`"之上。所以**先把它验掉**，再谈面板。
 *
 * ## 判据
 *
 * 1. 页面里能调到 `host.workspace.info`（拿到项目根与是否打开）；
 * 2. 页面里能调到 `host.workspace.list`（拿到**项目内相对路径**的列表，不是宿主绝对路径）；
 * 3. 宿主方法**抛的错**在页面里也如实（越界路径 → 拿到原因，而不是静默成功）；
 * 4. 页面零 pageerror。
 *
 * 用法：
 *   node scripts/editor-page-host-call.mjs          # 需要已构建产物
 *   node scripts/editor-page-host-call.mjs --build  # 先构建再跑
 *
 * 退出码：0 通过；1 失败；2 缺少前置。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PUBLIC_DIR = resolve(ROOT, 'packages', 'editor', 'public');
const SERVE = resolve(ROOT, 'packages', 'editor', 'bin', 'serve.mjs');
const PROJECT_DIR = resolve(ROOT, 'tmp', 'page-host-call-project');

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
 * 跑一条命令并等它结束。
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
if (doBuild)
{
    // `--build` 是**强制**重建：产物已存在时也要重来一遍——否则改了源码、看到的还是旧产物
    // （这个脚本第一版就踩了：加了面板却断言不到，因为页面是旧的）
    if (await run('npm', ['run', 'build', '--workspace', 'feng3d-editor']) !== 0) process.exit(2);
}
else if (!existsSync(join(PUBLIC_DIR, 'index.html')))
{
    console.error('缺少构建产物：packages/editor/public/index.html\n'
        + '请先 `npm run build --workspace feng3d-editor`，或加 `--build`。');
    process.exit(2);
}

// ---------- 造一个有内容的项目 ----------
rmSync(PROJECT_DIR, { recursive: true, force: true });
mkdirSync(join(PROJECT_DIR, 'scenes'), { recursive: true });
writeFileSync(join(PROJECT_DIR, 'scenes', 'default.scene.json'), '{"a":1}', 'utf8');

// 面板上的"构建"按钮要有东西可跑：给它一个真脚本
writeFileSync(join(PROJECT_DIR, 'build.js'), 'console.log("panel-built-ok");\n', 'utf8');
writeFileSync(join(PROJECT_DIR, 'package.json'), JSON.stringify({
    name: 'page-host-call-demo',
    version: '1.0.0',
    scripts: { build: 'node build.js' },
}, null, 4), 'utf8');

console.log('[页面调宿主] #272：页面**直接**调宿主方法（宿主面板的地基）');

// ---------- 起宿主 ----------
const host = spawn(process.execPath, [
    SERVE, '--port', '0', '--root', PUBLIC_DIR, '--project', PROJECT_DIR,
], { stdio: ['ignore', 'pipe', 'pipe'] });
let hostLog = '';

host.stdout.on('data', (chunk) => { hostLog += chunk; });
host.stderr.on('data', (chunk) => { hostLog += chunk; });

const base = await new Promise((resolve_) =>
{
    const deadline = Date.now() + 30000;
    const tick = setInterval(() =>
    {
        const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(hostLog);

        if (matched) { clearInterval(tick); resolve_(matched[1]); }
        else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
    }, 100);
});

if (!base)
{
    console.error(`宿主没起来：\n${hostLog}`);
    process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const pageErrors = [];

page.on('pageerror', (error) => pageErrors.push(error.message.split('\n')[0]));

await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(3000);

/**
 * 在**页面里**调一个宿主方法（用调用方那套协议，同源 fetch）。
 *
 * @param {string} method 方法名
 * @param {object} [params] 参数
 * @returns {Promise<object>} 结果载荷
 */
async function callFromPage(method, params = {})
{
    return await page.evaluate(async ({ method: name, params: args }) =>
    {
        const response = await fetch('/__editor-bridge/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: name, params: args }),
        });
        const body = await response.json();

        if (!response.ok) return { ok: false, error: body.error, httpStatus: response.status };

        return await (await fetch(`/__editor-bridge/result?id=${body.id}`)).json();
    }, { method, params });
}

// ---------- 判据 ----------
const info = await callFromPage('host.workspace.info');

check('**页面里能调到宿主方法**（宿主面板的地基）', info.ok === true && info.result?.open === true,
    JSON.stringify(info.result ?? info.error));

const list = await callFromPage('host.workspace.list', { dir: 'scenes' });

check('页面拿到了项目文件列表（**项目内相对路径**，不是宿主绝对路径）',
    list.ok === true && list.result?.[0]?.path === 'scenes/default.scene.json',
    JSON.stringify(list.result));

const escape = await callFromPage('host.workspace.readText', { path: '../outside.txt' });

check('宿主方法抛的错在页面里也**如实**（越界路径 → 拿到原因，不是静默成功）',
    escape.ok === false && /越出项目目录/.test(escape.error ?? ''), escape.error ?? '');

// ---------- 判据：宿主面板真的在界面上，而且读的是宿主的项目 ----------
const labels = await page.$$eval('.el-tabs__item', (nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));

check('**界面上多了「宿主」面板**（这一轮做的东西真的到了用户面前）',
    labels.some((label) => label.includes('host')), labels.join(' / '));

await page.click('.el-tabs__item:has-text("host")').catch(() => { /* 没找到就走下面的判据 */ });
await page.waitForTimeout(1500);

const panelText = await page.$eval('.host-view', (node) => node.textContent ?? '').catch(() => '');

check('面板显示的是**宿主打开的那个项目**（界面真的读到了宿主，不是自说自话）',
    /page-host-call-project/.test(panelText), panelText.replace(/\s+/g, ' ').slice(0, 140));

// ---------- 判据：目录能下钻，面包屑能走回来 ----------
// 文件列表要真能用，就得能进目录；而"能进去"必须配一条"能回来"的路
await page.click('.host-file-dir:has-text("scenes")').catch(() => { /* 没找到走下面的判据 */ });
await page.waitForTimeout(1500);

const insideText = await page.$eval('.host-files', (node) => node.textContent ?? '').catch(() => '');

check('**点目录能进去**（下钻到 scenes 后看到的是它里面的文件）',
    /📄 default\.scene\.json/.test(insideText),
    insideText.replace(/\s+/g, ' ').slice(0, 140));

// ---------- 判据：项目文件变化时面板**自动**刷新 ----------
// 这是"事件通道的真实消费方"（#272 欠账里的"页面侧真实消费方"最小一条）：
// 变化由宿主 `fs.watch` 发现 → `{type:'event', name:'workspace/changed'}` 推来 → 面板重读列表。
// **不是**面板在轮询（面板里没有定时器）。
writeFileSync(join(PROJECT_DIR, 'scenes', 'added.json'), '{"c":3}', 'utf8');
await page.waitForTimeout(2500);

const afterAdd = await page.$eval('.host-files', (node) => node.textContent ?? '').catch(() => '');

check('**项目文件变化时面板自动刷新**（页面侧真实消费方）',
    /added\.json/.test(afterAdd), afterAdd.replace(/\s+/g, ' ').slice(0, 140));

await page.click('.host-crumb:has-text("项目根")').catch(() => { /* 没找到走下面的判据 */ });
await page.waitForTimeout(1500);

const backText = await page.$eval('.host-files', (node) => node.textContent ?? '').catch(() => '');

check('**面包屑能走回项目根**（有进有出）', /📁 scenes/.test(backText),
    backText.replace(/\s+/g, ' ').slice(0, 140));

// ---------- 判据：面板上的构建按钮真的能驱动宿主，输出**实时**出现 ----------
// 这条守的是"长任务推送 → 界面"整条链的**界面侧**：宿主把构建输出的每一行
// `broadcastEvent('build/output', …)` 推来，面板订阅后逐行显示
await page.click('.host-toolbar .el-button:has-text("构建")').catch(() => { /* 没找到走下面的判据 */ });
await page.waitForTimeout(8000);

const outputText = await page.$eval('.host-output', (node) => node.textContent ?? '').catch(() => '');

check('**点面板上的构建按钮，宿主真的跑了项目构建**（输出里有项目自己的日志）',
    /panel-built-ok/.test(outputText), outputText.replace(/\s+/g, ' ').slice(0, 160));

const noteText = await page.$eval('.host-note', (node) => node.textContent ?? '').catch(() => '');

check('构建结果**如实**体现在面板上（成功就说成功，不吞不夸）', /构建成功/.test(noteText), noteText);

// ---------- 判据：界面能往项目里**写** ----------
// 这是界面**第一次改动磁盘**（此前面板只读）。两向都要看：列表里有了它，**磁盘上也得真有**。
await page.fill('.host-new input', 'panel-created.txt').catch(() => { /* 没找到走下面的判据 */ });
await page.click('.host-new .el-button:has-text("新建")').catch(() => { /* 同上 */ });
await page.waitForTimeout(2500);

const afterCreate = await page.$eval('.host-files', (node) => node.textContent ?? '').catch(() => '');

check('**界面能往项目里写文件**（新建后列表里有了它）',
    /panel-created\.txt/.test(afterCreate), afterCreate.replace(/\s+/g, ' ').slice(0, 160));

check('文件**真的落到磁盘上**了（不是只在界面上假装）',
    existsSync(join(PROJECT_DIR, 'panel-created.txt')), join(PROJECT_DIR, 'panel-created.txt'));

check('页面零 pageerror', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));

// ---------- 收尾 ----------
await page.screenshot({ path: resolve(ROOT, 'packages', 'editor', '.temp', 'page-host-call.png') })
    .catch(() => { /* 截图失败不影响判据 */ });

await browser.close();
host.kill();
rmSync(PROJECT_DIR, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 页面调宿主未通过——"宿主面板"的每个动作都建立在它之上，不能靠假设。');
    process.exit(1);
}

console.log('✅ 页面调宿主通过：页面能直接调宿主方法，结果与错误都如实');
