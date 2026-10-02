#!/usr/bin/env node
/**
 * **项目发布宿主方法**的验收（#277 核心：`host.publish.run`）。
 *
 * ## 它守的是 #277 的验收原话
 *
 * > 未启用插件的 runtime 端**不被打进产物**（tree-shake 断言）
 *
 * 做法是**入口过滤**：未启用的插件连 `import` 都不给它出现——不是"打进去再消掉"。
 * 判据因此必须**两向都验**：
 *
 * | 方向 | 判据 |
 * |---|---|
 * | 启用的**必须**在产物里 | 产物文本含它的标记，且产物**真的能跑**（`install()` 生效） |
 * | 未启用的**必须不在** | 产物文本**不含**它的标记 |
 *
 * 只验前者会漏掉"什么都打进去了"，只验后者会漏掉"其实什么都没打进去"——所以要**方法自证**：
 * 同一个插件在启用时标记必须出现（否则"不含"这条判据本身不可信）。
 *
 * 另有：产物**不含编辑器 API**（第三端只能依赖引擎）、路径边界（`runtimeModule` 不许爬出去）。
 *
 * 用法：
 *   node scripts/check-editor-project-publish.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SERVE = resolve(process.cwd(), 'packages', 'editor', 'bin', 'serve.mjs');

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

console.log('[项目发布] #277：按启用状态把插件 runtime 端打进产物');

// ---------- 造项目：两个 runtime 插件（一个启用、一个不启用） ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-publish-'));
const root = join(dir, 'static');
const project = join(dir, 'project');

mkdirSync(root, { recursive: true });
mkdirSync(join(project, 'plugins'), { recursive: true });
writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>', 'utf8');

// 两个"runtime 半"：装的时候往全局写一个独有标记（便于在产物里断言）
const runtimeHalf = (marker) => [
    `export function install()`,
    `{`,
    `    globalThis.${marker} = ${JSON.stringify(marker)};`,
    `}`,
].join('\n');

writeFileSync(join(project, 'plugins', 'enabled.mjs'), runtimeHalf('__ENABLED_MARKER__'), 'utf8');
writeFileSync(join(project, 'plugins', 'disabled.mjs'), runtimeHalf('__DISABLED_MARKER__'), 'utf8');

writeFileSync(join(root, 'editor.plugins.json'), JSON.stringify({
    plugins: [
        {
            id: 'plugin-enabled',
            clientUrl: '/plugins/enabled.js',
            halves: ['client', 'runtime'],
            runtimeModule: 'plugins/enabled.mjs',
            enabled: true,
        },
        {
            id: 'plugin-disabled',
            clientUrl: '/plugins/disabled.js',
            halves: ['client', 'runtime'],
            runtimeModule: 'plugins/disabled.mjs',
            enabled: false,
        },
    ],
}, null, 4), 'utf8');

const host = spawn(process.execPath, [SERVE, '--port', '0', '--root', root, '--project', project], {
    stdio: ['ignore', 'pipe', 'pipe'],
});
let hostLog = '';

host.stdout.on('data', (chunk) => { hostLog += chunk; });
host.stderr.on('data', (chunk) => { hostLog += chunk; });

const base = await new Promise((resolve_) =>
{
    const deadline = Date.now() + 25000;
    const tick = setInterval(() =>
    {
        const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(hostLog);

        if (matched) { clearInterval(tick); resolve_(matched[1].replace(/\/$/, '')); }
        else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
    }, 100);
});

if (!base)
{
    console.error(`宿主没起来：\n${hostLog}`);
    process.exit(1);
}

check('宿主注册了发布方法', /host\.publish\.run/.test(hostLog),
    hostLog.split('\n').find((line) => line.includes('宿主方法'))?.trim() ?? '');

/**
 * 调一个宿主方法（调用方的老办法）。
 *
 * @param {string} method 方法名
 * @param {object} [params] 参数
 * @returns {Promise<object>} 结果载荷
 */
async function call(method, params = {})
{
    const response = await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });
    const body = await response.json();

    if (!response.ok) return { ok: false, error: body.error };

    return await (await fetch(`${base}/__editor-bridge/result?id=${body.id}`)).json();
}

// ---------- 发布 ----------
const published = await call('host.publish.run');
const artifactPath = join(project, 'dist', 'runtime.js');
const artifact = published.ok === true ? readFileSync(artifactPath, 'utf8') : '';

check('发布成功并写出产物', published.ok === true && published.result?.ok === true,
    JSON.stringify(published.result ?? published.error));

check('只把**启用的**插件列进了产物清单',
    JSON.stringify(published.result?.plugins) === '["plugin-enabled"]'
    && JSON.stringify(published.result?.skipped) === '["plugin-disabled"]',
    `plugins=${JSON.stringify(published.result?.plugins)} skipped=${JSON.stringify(published.result?.skipped)}`);

// ---------- 启用的必须在，且产物真能跑 ----------
check('**启用的插件在产物里**', artifact.includes('__ENABLED_MARKER__'));

const ran = await import(`${new URL(`file:///${artifactPath.replace(/\\/g, '/')}`).href}?v=${Date.now()}`)
    .then(() => globalThis.__ENABLED_MARKER__)
    .catch((error) => `导入失败：${error.message}`);

check('**产物能在无编辑器环境跑**（`install()` 真的生效）', ran === '__ENABLED_MARKER__', String(ran));

// ---------- 未启用的必须不在 ----------
check('**未启用的插件不在产物里**（#277 验收原话）', !artifact.includes('__DISABLED_MARKER__'));
check('产物不含编辑器 API（第三端只能依赖引擎）',
    !/element-plus|MainLayout|createApp|EditorBridge/.test(artifact));

// ---------- 路径边界 ----------
writeFileSync(join(root, 'editor.plugins.json'), JSON.stringify({
    plugins: [{ id: 'escaping', clientUrl: '/plugins/x.js', halves: ['client', 'runtime'], runtimeModule: '../outside.mjs' }],
}, null, 4), 'utf8');

const restarted = spawn(process.execPath, [SERVE, '--port', '0', '--root', root, '--project', project], {
    stdio: ['ignore', 'pipe', 'pipe'],
});
let restartedLog = '';

restarted.stdout.on('data', (chunk) => { restartedLog += chunk; });
restarted.stderr.on('data', (chunk) => { restartedLog += chunk; });

await new Promise((resolve_) =>
{
    const deadline = Date.now() + 20000;
    const tick = setInterval(() =>
    {
        if (/生效 |已启动/.test(restartedLog) || Date.now() > deadline)
        {
            clearInterval(tick);
            resolve_();
        }
    }, 100);
});

check('runtimeModule 含 `..` 时该条被丢（不许爬出项目根）', /不能包含 \.\./.test(restartedLog),
    restartedLog.split('\n').find((line) => line.includes('runtimeModule'))?.trim() ?? '');

// ---------- 收尾 ----------
restarted.kill();
host.kill();
rmSync(dir, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 项目发布未通过——"未启用的不进产物"是 #277 的验收原话，不能只在文档里成立。');
    process.exit(1);
}

console.log('✅ 项目发布通过：启用的进产物且能跑、未启用的不进、路径边界守住');
