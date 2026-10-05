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
 * @param {boolean} [withPluginDir] 是否再造一个 `plugins/demo/` 目录（验目录约定）
 * @param {object | null} [builtinConfig] **内置层**配置（`--builtin-plugins` 用；`null` 表示不写）
 * @param {object | null} [userConfig] **用户层**配置（`--plugins` 用；`null` 表示不写）
 * @returns {string} 目录路径
 */
function makeProbeRoot(pluginConfig, withPluginDir = false, builtinConfig = null, userConfig = null)
{
    rmSync(PROBE_DIR, { recursive: true, force: true });
    mkdirSync(PROBE_DIR, { recursive: true });
    writeFileSync(resolve(PROBE_DIR, 'index.html'),
        '<!doctype html>\n<html>\n<head>\n    <title>probe</title>\n</head>\n<body><div id="app"></div></body>\n</html>\n', 'utf8');

    if (pluginConfig !== null)
    {
        writeFileSync(resolve(PROBE_DIR, 'editor.plugins.json'), JSON.stringify(pluginConfig, null, 4), 'utf8');
    }

    // 三层叠加的两份外部来源（#272 P3）：宿主用 `--builtin-plugins` / `--plugins` 指过来
    if (builtinConfig !== null)
    {
        writeFileSync(resolve(PROBE_DIR, 'builtin.plugins.json'), JSON.stringify(builtinConfig, null, 4), 'utf8');
    }

    if (userConfig !== null)
    {
        writeFileSync(resolve(PROBE_DIR, 'user.plugins.json'), JSON.stringify(userConfig, null, 4), 'utf8');
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
 * @param {string[]} [extraArgs] 额外的宿主参数（如 `--plugins <文件>`）
 * @returns {Promise<{ html: string, stdout: string }>} 页面内容与宿主日志
 */
async function probeHost(root, extraArgs = [])
{
    const child = spawn(process.execPath, [SERVE, '--port', '0', '--root', root, ...extraArgs], { stdio: ['ignore', 'pipe', 'pipe'] });
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

/**
 * 从页面 HTML 里取出注入的入口图。
 *
 * JSON 里的 `<` 被转义成 `\u003c`（防 `</script>` 提前收尾），`JSON.parse` 能直接吃。
 *
 * @param {string} html 页面内容
 * @returns {object | null} 入口图；没注入时 `null`
 */
function readGraph(html)
{
    const matched = /window\.__EDITOR_BOOT__\s*=\s*(\{[\s\S]*?\});<\/script>/.exec(html);

    return matched ? JSON.parse(matched[1]) : null;
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

// ---------- 判据 6：三层叠加（#272 P3：内置 < 插件 < 用户） ----------
// 同一个 id（`shared-plugin`）在**三层**各声明一次：只有最上层那条该活下来，且要能查到谁被盖住了。
// 另外每层各放一个**独有**的 id —— 只验覆盖会漏掉"某层根本没读"（那正是"三层叠加"最容易假绿的地方）。
const LAYERED_ID = 'shared-plugin';
const layered = await probeHost(makeProbeRoot(
    { plugins: [
        { id: LAYERED_ID, clientUrl: '/plugins/shared-project.js' },
        { id: 'only-project', clientUrl: '/plugins/only-project.js' },
    ] },
    false,
    { plugins: [
        { id: LAYERED_ID, clientUrl: '/plugins/shared-builtin.js' },
        { id: 'only-builtin', clientUrl: '/plugins/only-builtin.js' },
    ] },
    { plugins: [
        { id: LAYERED_ID, clientUrl: '/plugins/shared-user.js' },
        { id: 'only-user', clientUrl: '/plugins/only-user.js' },
    ] },
), [
    '--builtin-plugins', resolve(PROBE_DIR, 'builtin.plugins.json'),
    '--plugins', resolve(PROBE_DIR, 'user.plugins.json'),
]);

const graph = readGraph(layered.html);
const entriesOf = (id) => (graph?.entries ?? []).filter((entry) => entry.id === id);
const shared = entriesOf(LAYERED_ID)[0];
const listing = (graph?.entries ?? []).map((entry) => `${entry.id}(${entry.layer})`).join(' / ');

check('★ 三层都在读（内置 / 插件 / 用户各有一个独有 id 进了入口图）',
    ['only-builtin', 'only-project', 'only-user'].every((id) => entriesOf(id).length === 1),
    `入口图 ${graph?.entries?.length ?? 0} 条：${listing}`);

check('★ 同一个 id 只留一条，且**用户层赢**',
    entriesOf(LAYERED_ID).length === 1
    && shared?.clientSpecifier === '/plugins/shared-user.js'
    && shared?.layer === 'user',
    `赢家=${shared?.clientSpecifier}（层 ${shared?.layer}）`);

check('★ 覆盖**留痕**：被盖住的内置层与插件层都查得到',
    Array.isArray(shared?.shadowed) && shared.shadowed.length === 2
    && shared.shadowed.some((one) => one.startsWith('builtin:'))
    && shared.shadowed.some((one) => one.startsWith('plugin:')),
    JSON.stringify(shared?.shadowed));

check('各条带的层正确（内置层的条目不会被当成插件层）',
    entriesOf('only-builtin')[0]?.layer === 'builtin'
    && entriesOf('only-project')[0]?.layer === 'plugin'
    && entriesOf('only-user')[0]?.layer === 'user',
    ['only-builtin', 'only-project', 'only-user'].map((id) => `${id}=${entriesOf(id)[0]?.layer}`).join(' '));

// 默认形态（不叠用户层、不写内置层）时，条目层一律 `plugin`——既有行为不变
check('没叠用户层/内置层时，条目层是 `plugin`（既有行为不变）',
    readGraph(good.html)?.entries?.[0]?.layer === 'plugin',
    `good 那条的 layer=${JSON.stringify(readGraph(good.html)?.entries?.[0]?.layer)}`);

// ---------- 项目级启用集（#274 / §5.2） ----------
//
// `feng3d.project.json` 的 `plugins` 是**字符串数组**（只有 id）—— 它回答"**这个项目要用哪些**"，
// 而不是"插件从哪来"（那由产物配置回答，它带 `clientUrl`）。所以它表达成 `enabled: false`
// 而**不是把条目从图里删掉**：页面仍看得到"有这么个插件、但项目没启用"，用户也能临时打开。
const PROJECT_LAYER = [
    { id: 'keep-me', clientUrl: '/plugins/keep.js', apiVersion: '^1.0.0' },
    { id: 'drop-me', clientUrl: '/plugins/drop.js', apiVersion: '^1.0.0' },
];

/**
 * 写一份项目元数据（`feng3d.project.json`）并返回它所在目录。
 *
 * `plugins` 传 `undefined` 时 JSON 里**不含该键** —— 那正是"项目没声明"，与"声明了空数组"不同。
 *
 * @param {readonly string[] | undefined} plugins 启用集
 * @returns {string} 目录
 */
function makeProjectMeta(plugins)
{
    const dir = resolve(PROBE_DIR, 'project');

    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'feng3d.project.json'), JSON.stringify({
        name: '探针项目',
        entryScene: 'scenes/default.scene.json',
        plugins,
    }, null, 4), 'utf8');

    return dir;
}

/**
 * 取某个条目在入口图里的 `enabled`。
 *
 * @param {string} html 页面 HTML
 * @param {string} id 插件 id
 * @returns {boolean | undefined} 启用状态
 */
function enabledOf(html, id)
{
    return (readGraph(html)?.entries ?? []).find((entry) => entry.id === id)?.enabled;
}

const onlyKeep = await probeHost(makeProbeRoot({ plugins: PROJECT_LAYER }), ['--project', makeProjectMeta(['keep-me'])]);

check('★ **项目级启用集**：列的启用、没列的 `enabled: false`',
    enabledOf(onlyKeep.html, 'keep-me') === true && enabledOf(onlyKeep.html, 'drop-me') === false,
    `keep-me=${enabledOf(onlyKeep.html, 'keep-me')} drop-me=${enabledOf(onlyKeep.html, 'drop-me')}`);
check('没被项目启用的那条**仍在入口图里**（页面看得到它，用户能临时打开）',
    (readGraph(onlyKeep.html)?.entries ?? []).some((entry) => entry.id === 'drop-me'));

const emptyList = await probeHost(makeProbeRoot({ plugins: PROJECT_LAYER }), ['--project', makeProjectMeta([])]);

check('★ 项目声明**空数组** = 一个都不要（与「没声明」是两回事）',
    enabledOf(emptyList.html, 'keep-me') === false && enabledOf(emptyList.html, 'drop-me') === false);

const noDeclare = await probeHost(makeProbeRoot({ plugins: PROJECT_LAYER }), ['--project', makeProjectMeta(undefined)]);

check('★ 项目**没声明** `plugins` 时不约束（老项目照常全启用）',
    enabledOf(noDeclare.html, 'keep-me') === true && enabledOf(noDeclare.html, 'drop-me') === true);
rmSync(PROBE_DIR, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 入口图注入验收未通过——宿主与页面之间的这份契约不能靠人来记。');
    process.exit(1);
}

console.log('✅ 入口图注入验收通过：宿主产出入口图并注入页面（裸包名被拒）');
