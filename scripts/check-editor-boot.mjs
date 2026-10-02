#!/usr/bin/env node
/**
 * 入口图注入的验收（#276 任务 4 的宿主半）。
 *
 * 宿主读插件配置（`editor.plugins.json`）→ 产出**入口图** → 在响应 HTML 时注入
 * `window.__EDITOR_BOOT__`；页面启动时读它并装载（`src/plugins/loader/boot.ts`）。
 * 这个脚本守"宿主那半"的四件事：
 *
 * 1. **没有配置就不注入**（没装插件的编辑器与以前完全一样）；
 * 2. **有配置就注入**：入口图里有 id 与可解析的说明符；
 * 3. **裸包名被拒**：`clientUrl` 写 `@scope/pkg` 这种会被丢掉——浏览器原生 ESM 解析不了它
 *    （#276 阶段 4 实测），这条判据把踩过的坑钉死；
 * 4. **坏配置不拖垮宿主**：丢该条、其余照常、宿主照常起停。
 *
 * 用法：
 *   node scripts/check-editor-boot.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SERVE = resolve(ROOT, 'packages', 'editor', 'bin', 'serve.mjs');
const PROBE_DIR = resolve(ROOT, 'tmp', 'boot-probe');

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
 * 造一个探测用的静态根目录。
 *
 * @param {object | null} pluginConfig 插件配置（`null` 表示不写配置文件）
 * @returns {string} 目录路径
 */
function makeProbeRoot(pluginConfig, withPluginDir = false)
{
    rmSync(PROBE_DIR, { recursive: true, force: true });
    mkdirSync(PROBE_DIR, { recursive: true });
    writeFileSync(resolve(PROBE_DIR, 'index.html'),
        '<!doctype html>\n<html>\n<head>\n    <title>probe</title>\n</head>\n<body><div id="app"></div></body>\n</html>\n', 'utf8');

    if (pluginConfig !== null)
    {
        writeFileSync(resolve(PROBE_DIR, 'editor.plugins.json'), JSON.stringify(pluginConfig, null, 4), 'utf8');
    }

    // 一个**真的宿主半**（#272 P3）：`apply(ctx)` 里打个日志，这样"模块真被执行了"有据可查
    writeFileSync(resolve(PROBE_DIR, 'host-plugin.mjs'), [
        '/** 探针用的宿主半：被装载时会打一条日志 */',
        'export function apply(ctx)',
        '{',
        '    console.log("[probe-host-plugin] 宿主半已 apply");',
        '}',
    ].join('\n'), 'utf8');

    // 插件目录约定（#272 P3）：`plugins/<名字>/` 存在就等于"装了这个插件"，
    // 连 editor.plugins.json 都不用写
    if (withPluginDir)
    {
        const dir = resolve(PROBE_DIR, 'plugins', 'demo');

        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'host.mjs'), [
            'export function apply()',
            '{',
            '    console.log("[probe-plugin-dir] 目录插件已 apply");',
            '}',
        ].join('\n'), 'utf8');
    }

    return PROBE_DIR;
}
/**
 * 起一个宿主、取一次页面、再停掉它。
 *
 * @param {string} root 静态根目录
 * @returns {Promise<{ html: string, stdout: string }>} 页面内容与宿主日志
 */
async function probeHost(root)
{
    const child = spawn(process.execPath, [SERVE, '--port', '0', '--root', root], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stdout += chunk; });

    const base = await new Promise((resolve_) =>
    {
        const deadline = Date.now() + 20000;
        const tick = setInterval(() =>
        {
            const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(stdout);

            if (matched) { clearInterval(tick); resolve_(matched[1]); }
            else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
        }, 100);
    });

    if (!base)
    {
        child.kill();

        return { html: '', stdout };
    }

    const html = await (await fetch(new URL('index.html', base))).text();

    child.kill();

    return { html, stdout };
}

console.log('[入口图注入] #276 任务 4 的宿主半');

// ---------- 判据 1：没有配置就不注入 ----------
const noConfig = await probeHost(makeProbeRoot(null));

check('没有插件配置时不注入（编辑器与以前完全一样）',
    noConfig.html.includes('<div id="app"></div>') && !noConfig.html.includes('__EDITOR_BOOT__'));

// ---------- 判据 2：有配置就注入，且入口图内容正确 ----------
// 顺带带上宿主半（`hostModule`）：宿主应当把它 import 进 cordis 树（#272 P3）
const good = await probeHost(makeProbeRoot({
    plugins: [
        {
            id: '@feng3d/editor-plugin-rotate',
            clientUrl: '/plugins/rotate.js',
            apiVersion: '^1.0.0',
            halves: ['client', 'runtime'],
            hostModule: 'host-plugin.mjs',
        },
    ],
}));

check('有配置时注入了 window.__EDITOR_BOOT__', good.html.includes('__EDITOR_BOOT__'));
check('注入在 </head> 之前（应用脚本之前就能读到）',
    good.html.indexOf('__EDITOR_BOOT__') < good.html.indexOf('</head>'));
check('入口图里带上了插件 id 与可解析的说明符',
    good.html.includes('@feng3d/editor-plugin-rotate') && good.html.includes('/plugins/rotate.js'));
check('宿主日志报出"插件包：1 个"', /插件包：1 个/.test(good.stdout), good.stdout.split('\n').find((line) => line.includes('插件包'))?.trim() ?? '');

// 宿主半（#272 P3）：模块被 import 进 cordis 树，而且 `apply` 真的跑了
check('**宿主半被装载**（配置里的 hostModule 被装进 cordis 树）',
    /已装载宿主插件：@feng3d\/editor-plugin-rotate/.test(good.stdout)
    && /插件树：1 个宿主插件/.test(good.stdout)
    && /\[probe-host-plugin\] 宿主半已 apply/.test(good.stdout),
    good.stdout.split('\n').filter((line) => /宿主插件|插件树|probe-host-plugin/.test(line)).map((line) => line.trim()).join(' | '));

// ---------- 判据 3：裸包名被拒（浏览器原生 ESM 解析不了） ----------
const bare = await probeHost(makeProbeRoot({
    plugins: [{ id: '@feng3d/editor-plugin-rotate', clientUrl: '@feng3d/editor-plugin-rotate/client' }],
}));

check('clientUrl 写裸包名时该条被丢掉（不注入）', !bare.html.includes('__EDITOR_BOOT__'));
check('并且日志说清了原因',
    /不是能解析的地址/.test(bare.stdout),
    bare.stdout.split('\n').find((line) => line.includes('不是能解析的地址'))?.trim() ?? '');

// ---------- 判据 3b：hostModule 不许爬出静态根（宿主是 Node 进程，配置不能变成"任意文件加载"） ----------
const escape = await probeHost(makeProbeRoot({
    plugins: [{ id: 'escaping-plugin', clientUrl: '/plugins/x.js', hostModule: '../outside.mjs' }],
}));

check('hostModule 含 `..` 时该条被丢（不装载静态根外的模块）',
    !escape.html.includes('__EDITOR_BOOT__') && /不能包含 \.\./.test(escape.stdout),
    escape.stdout.split('\n').find((line) => line.includes('hostModule'))?.trim() ?? '');

const absolute = await probeHost(makeProbeRoot({
    plugins: [{ id: 'absolute-plugin', clientUrl: '/plugins/x.js', hostModule: 'C:\\Windows\\x.mjs' }],
}));

check('hostModule 是绝对路径时该条被丢',
    /相对静态根/.test(absolute.stdout),
    absolute.stdout.split('\n').find((line) => line.includes('hostModule'))?.trim() ?? '');

// ---------- 判据 3c：插件目录约定（"丢一个目录进去就装上"） ----------
// 连 editor.plugins.json 都不写，只放一个 plugins/demo/ 目录
const byDirectory = await probeHost(makeProbeRoot(null, true));

check('**插件目录约定**：`plugins/<名字>/` 存在就被装上（配置都不用写）',
    byDirectory.html.includes('__EDITOR_BOOT__')
    && byDirectory.html.includes('/plugins/demo/client.js')
    && /已装载宿主插件：@local\/demo/.test(byDirectory.stdout)
    && /\[probe-plugin-dir\] 目录插件已 apply/.test(byDirectory.stdout),
    byDirectory.stdout.split('\n').filter((line) => /demo|插件包|插件树|probe-plugin-dir/.test(line)).map((line) => line.trim()).join(' | '));

// ---------- 判据 4：坏配置不拖垮宿主（丢坏的、留好的） ----------
const mixed = await probeHost(makeProbeRoot({
    plugins: [
        { id: 'broken-without-url' },
        { id: '@feng3d/editor-plugin-rotate', clientUrl: '/plugins/rotate.js', halves: ['client'] },
    ],
}));

check('一条坏配置不影响其余（好的那条照常注入）',
    mixed.html.includes('__EDITOR_BOOT__') && mixed.html.includes('/plugins/rotate.js')
    && !mixed.html.includes('broken-without-url'));
check('日志列出被丢掉的那条', /缺少 clientUrl/.test(mixed.stdout));

// ---------- 判据 5：没有 client 端的声明也要被拒 ----------
const noClient = await probeHost(makeProbeRoot({
    plugins: [{ id: 'runtime-only', clientUrl: '/plugins/x.js', halves: ['runtime'] }],
}));

check('声明里没有 client 端的包不能按界面插件装', !noClient.html.includes('__EDITOR_BOOT__'));

rmSync(PROBE_DIR, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 入口图注入验收未通过——宿主与页面之间的这份契约不能靠人来记。');
    process.exit(1);
}

console.log('✅ 入口图注入验收通过：宿主产出入口图并注入页面（裸包名被拒）');
