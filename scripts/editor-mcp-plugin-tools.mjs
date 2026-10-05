#!/usr/bin/env node
/**
 * **插件自带 AI 工具的端到端自检**（#281 路径 A 的最后一截）。
 *
 * ## 它补的是"只有文本级证据"这个缺口
 *
 * `editor-mcp-check.mjs` 只能离线验**声明**与**接线**（源码里有没有 `tools/list` → `listTools()`），
 * 那是**文本级**证据。而"装一个插件，AI 就多一个工具"这句话真正的判据只有一条：
 * **起真页面 → 真装载插件 → 经真 MCP server 取 `tools/list`**，看工具表里有没有多出那一个，
 * 并且**真的调得通**（动态工具不在静态 `map` 里，`handleTool` 靠 `pluginMethods` 兜底查表）。
 *
 * ## 判据（四段，缺一段都有漏洞）
 *
 * | 段 | 判据 | 少了它会漏掉什么 |
 * |---|---|---|
 * | 静态基线 | 核心工具照常在（合并不会挤掉它们） | 插件工具挤掉核心工具也算"通过" |
 * | 启动后 | **多出** `rotate_info`，描述/schema 来自插件清单 | 混进静态表也算"有" |
 * | 调用 | `tools/call rotate_info` **真的返回**插件声明的值 | "AI 看得见、一调就报未知 tool" |
 * | **禁用后** | 立刻**消失** | 缓存住的话，"跟着启用状态走"就是空话 |
 *
 * ## 形态（2026-10-05，决策 ①）
 *
 * 本脚本**自带宿主**：它 esbuild 打插件包的 client 半、写产物里的 `editor.plugins.json`、
 * 起宿主（`bin/serve.mjs --new <唯一临时目录>`），再打开宿主给的页面。
 *
 * **为什么不再"手动装卸"**：那要 `page.evaluate` + `import('/src/plugins/loader/index.ts')`，
 * 只有 vite dev server 能提供 `.ts` 源模块；而决策 ① 之后页面必须有宿主（初值 `HostFS`），
 * dev 形态整体不成立。所以装载改走**真实路径**（宿主注入入口图 → 页面启动时装），
 * "卸载"改走**桥接**（`editor.setPlugin`）—— 后者正是用户真实切开关的动作。
 *
 * 「装载前没有」因此换成「**禁用后没有**」：同样证明"不是硬编码"。
 *
 * 用法：
 *   node scripts/editor-mcp-plugin-tools.mjs                 # 自带宿主（CI 用这个）
 *   node scripts/editor-mcp-plugin-tools.mjs --url http://localhost:3000   # 对着已有宿主
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import * as esbuild from 'esbuild';
import { openBridgePage } from './editor-bridge-page.mjs';

const here = import.meta.dirname;
const ROOT = process.cwd();
const MCP_SERVER = resolve(here, 'editor-mcp-server.mjs');
const PLUGIN_ID = '@feng3d/editor-plugin-rotate';
const PUBLIC_DIR = resolve(ROOT, 'packages', 'editor', 'public');
const SERVE = resolve(ROOT, 'packages', 'editor', 'bin', 'serve.mjs');
const PLUGIN_CLIENT = resolve(ROOT, 'packages', 'editor-plugin-rotate', 'src', 'client.ts');
const BUNDLED_PLUGIN = resolve(PUBLIC_DIR, 'plugins', 'rotate.js');
const PLUGIN_CONFIG = resolve(PUBLIC_DIR, 'editor.plugins.json');

/**
 * 宿主这次打开的项目目录（**每次唯一**的空目录）。
 *
 * 决策 ① 之后宿主必须有个项目：编辑器不再有"页面内副本"可退，文件系统初值是 `HostFS`
 * —— 宿主不给项目时页面会自己报「项目未打开」。
 * `--new` 只写进**空目录**（那是有意的），所以用 `mkdtempSync` 而不是固定路径。
 */
const PROJECT_DIR = mkdtempSync(join(tmpdir(), 'feng3d-mcp-plugin-tools-'));

/**
 * 读 `--xxx value` 形式的参数。
 *
 * @param {string} name 参数名
 * @param {string} [fallback] 缺省值
 * @returns {string} 值
 */
function readOption(name, fallback = '')
{
    const index = process.argv.indexOf(name);

    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

// 给了 `--url` / `EDITOR_BRIDGE_URL` 就对着它跑（便于本地对着已起的宿主调）；
// 否则**本脚本自带宿主**（CI 走这条路）—— 决策 ① 之后页面必须有宿主才有项目。
const externalBase = (readOption('--url') || process.env.EDITOR_BRIDGE_URL || '').replace(/\/$/, '');
let base = externalBase;

/** 自带的宿主进程（对着外部宿主跑时为 `null`） */
let host = null;

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} [detail] 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 起一个 MCP server 会话（stdio JSON-RPC）。
 *
 * `EDITOR_BRIDGE_URL` **必须**与页面所在的 dev server 一致——否则 server 连的是别的端口，
 * 工具表里永远不会有插件工具，而这种失败看起来会像"功能没做"。
 *
 * @returns {{ send: (method: string, params?: object) => Promise<object>, close: () => void }} 会话
 */
function startMcp()
{
    const child = spawn(process.execPath, [MCP_SERVER], {
        stdio: ['pipe', 'pipe', 'inherit'],
        env: { ...process.env, EDITOR_BRIDGE_URL: base },
    });
    const pending = new Map();
    let buffer = '';
    let nextId = 1;

    child.stdout.on('data', (chunk) =>
    {
        buffer += chunk;
        const lines = buffer.split('\n');

        buffer = lines.pop() ?? '';
        for (const line of lines)
        {
            if (!line.trim()) continue;

            let message;

            try { message = JSON.parse(line); }
            catch { continue; }     // 非 JSON 行（日志串入 stdout）忽略

            const slot = pending.get(message.id);

            if (slot) { pending.delete(message.id); slot(message); }
        }
    });

    return {
        send(method, params = {})
        {
            return new Promise((resolve_, reject_) =>
            {
                const id = nextId++;
                const timer = setTimeout(() => { pending.delete(id); reject_(new Error(`${method} 超时`)); }, 60000);

                pending.set(id, (message) => { clearTimeout(timer); resolve_(message); });
                child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
            });
        },
        close: () => child.kill(),
    };
}

console.log('[插件 AI 工具端到端] #281：装一个插件，AI 的工具表里真的多一个');

if (!base)
{
    // ---------- 自带宿主 ----------
    // ① 打插件包的 client 半。这一步代表"插件包由第三方构建好"：
    //    产物是一个普通 ESM 文件，宿主只负责分发它。
    await esbuild.build({
        entryPoints: [PLUGIN_CLIENT],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        outfile: BUNDLED_PLUGIN,
        logLevel: 'warning',
    });

    if (!existsSync(BUNDLED_PLUGIN))
    {
        console.error(`插件包没打出来：${BUNDLED_PLUGIN}`);
        process.exit(2);
    }

    // ② 写产物里的插件配置（本地文件，`public/` 是构建产物、不入库）。
    //    宿主读它产出**入口图**注入页面，页面启动时自己装 —— 这就是"真实装载路径"。
    writeFileSync(PLUGIN_CONFIG, JSON.stringify({
        plugins: [{ id: PLUGIN_ID, clientUrl: '/plugins/rotate.js', apiVersion: '^1.0.0', halves: ['client', 'runtime'] }],
    }, null, 4), 'utf8');

    // ③ 起宿主，从它的启动日志里取地址（`--port 0` 让系统分配，避免与别的服务撞）
    host = spawn(process.execPath, [SERVE, '--port', '0', '--root', PUBLIC_DIR, '--new', PROJECT_DIR], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';

    host.stdout.on('data', (chunk) => { stdout += chunk; });
    host.stderr.on('data', (chunk) => { stdout += chunk; });

    base = await new Promise((resolve_) =>
    {
        const deadline = Date.now() + 30000;
        const tick = setInterval(() =>
        {
            const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(stdout);

            if (matched)
            {
                // 宿主日志里的地址**带尾部斜杠**（`已启动：http://127.0.0.1:PORT/`），
                // 而 `openBridgePage` 会在 base 后自己拼 `/?bridgeClient=…` —— 留着会拼出 `//`。
                const raw = matched[1];

                clearInterval(tick);
                resolve_(raw.endsWith('/') ? raw.slice(0, -1) : raw);
            }
            else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
        }, 100);
    });

    if (!base)
    {
        console.error(`宿主没起来：\n${stdout}`);
        process.exit(1);
    }

    console.log(`[插件 AI 工具端到端] 自带宿主 ${base}`);
}

const opened = await openBridgePage(base, 'mcp-plugin-tools', { locale: 'zh-CN' });

const mcp = startMcp();

try
{
    await mcp.send('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcp-plugin-tools', version: '0' },
    });

    /** 取工具名列表 */
    const namesOf = (message) => (message.result?.tools ?? []).map((tool) => tool.name);

    const before = namesOf(await mcp.send('tools/list'));

    check('静态基线照常在（合并不会挤掉核心工具）',
        before.length >= 43 && before.includes('scene_add'), `核心工具 ${before.length} 个`);

    // `tools/list` 是**现算**的，但装载后编辑器的贡献表要重投一轮，所以给它几次重试
    let dynamic = null;

    for (let i = 0; i < 20 && !dynamic; i++)
    {
        const tools = (await mcp.send('tools/list')).result?.tools ?? [];

        dynamic = tools.find((tool) => tool.name === 'rotate_info') ?? null;
        if (!dynamic) await new Promise((resolve_) => setTimeout(resolve_, 500));
    }

    check('★ 宿主装载的插件让 AI 的工具表里**多出** `rotate_info`（端到端）', !!dynamic,
        dynamic ? dynamic.description.slice(0, 42) : '20 次重试后仍未出现');
    check('它的描述与 schema 来自**插件清单**（不是 MCP 里硬编码的）',
        (dynamic?.description ?? '').includes('样板') && dynamic?.inputSchema?.type === 'object');

    const called = await mcp.send('tools/call', { name: 'rotate_info', arguments: {} });

    let payload = null;

    try { payload = JSON.parse(called.result?.content?.[0]?.text ?? 'null'); }
    catch { payload = null; }

    check('★ 这个**动态**工具真的能调用（走 `pluginMethods` 兜底，不是静态 map）',
        payload?.type === 'Rotate' && typeof payload?.apiVersion === 'string',
        JSON.stringify(payload ?? called));

    // 用**桥接**把插件禁掉 —— 这正是用户切开关时走的同一条路，
    // 而且不必依赖"页面侧有装卸函数"（页面只暴露了数据 `window.__EDITOR_BOOT__`）。
    await mcp.send('tools/call', { name: 'editor_set_plugin', arguments: { id: PLUGIN_ID, enabled: false } });

    let after = namesOf(await mcp.send('tools/list'));

    for (let i = 0; i < 20 && after.includes('rotate_info'); i++)
    {
        await new Promise((resolve_) => setTimeout(resolve_, 500));
        after = namesOf(await mcp.send('tools/list'));
    }

    check('★ **禁用后立刻消失**（每次现算、不缓存）——它跟着启用状态走，也证明它不是硬编码',
        !after.includes('rotate_info'), `工具 ${after.length} 个`);
}
finally
{
    mcp.close();
    await opened.close();
    host?.kill();
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 插件 AI 工具端到端未通过——"装一个插件，AI 就多一个工具"必须能被真跑一遍。');
    process.exit(1);
}

console.log('✅ 插件 AI 工具端到端通过：装上就多、调得通、禁用就消失');
