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
 * | 装载前 | **没有** `rotate_info` | "装上之后有"这条判据本身不可信（可能只是硬编码） |
 * | 装载后 | **多出** `rotate_info`，描述/schema 来自插件清单 | 混进静态表也算"有" |
 * | 调用 | `tools/call rotate_info` **真的返回**插件声明的值 | "AI 看得见、一调就报未知 tool" |
 * | 卸载后 | 立刻**消失** | 缓存住的话，"跟着启用状态走"就是空话 |
 *
 * 用法：
 *   node scripts/editor-mcp-plugin-tools.mjs --url http://localhost:3000
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { openBridgePage } from './editor-bridge-page.mjs';

const here = import.meta.dirname;
const MCP_SERVER = resolve(here, 'editor-mcp-server.mjs');
const PLUGIN_ID = '@feng3d/editor-plugin-rotate';

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

const base = (readOption('--url') || process.env.EDITOR_BRIDGE_URL || 'http://localhost:3000').replace(/\/$/, '');

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

const opened = await openBridgePage(base, 'mcp-plugin-tools', { locale: 'zh-CN' });
const { page } = opened;

import { createPluginLoaderCaller } from './editor-utils/pluginLoaderCall.mjs';

/**
 * 在页面里装载/卸载样板插件（与 `editor-plugin-load.mjs` 走**同一份**实现）。
 *
 * 原先这里自己写了一份 `page.evaluate(async () => { await loader.loadPluginPackage(...) })`——
 * 那既复制了逻辑（#669 里两处一起踩坑的根源），又把长 pending 的 promise 交给了 evaluate
 * （会被 V8 GC，Playwright 报 `Resulting promise was garbage collected`）。共用实现里已经
 * 换成"页面侧启动 + Node 侧轮询"，这里只管用。
 */
const { call: callLoader } = createPluginLoaderCaller({ page, pluginId: PLUGIN_ID });

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

    check('装载前**没有** rotate_info（否则"装上之后有"这条判据不可信）', !before.includes('rotate_info'),
        `工具 ${before.length} 个`);
    check('静态基线照常在（合并不会挤掉核心工具）',
        before.length >= 43 && before.includes('scene_add'), `核心工具 ${before.length} 个`);

    const loaded = await callLoader('loadPluginPackage');

    check('装载样板插件成功', loaded.loaded === true && loaded.problems.length === 0, JSON.stringify(loaded));

    // `tools/list` 是**现算**的，但装载后编辑器的贡献表要重投一轮，所以给它几次重试
    let dynamic = null;

    for (let i = 0; i < 20 && !dynamic; i++)
    {
        const tools = (await mcp.send('tools/list')).result?.tools ?? [];

        dynamic = tools.find((tool) => tool.name === 'rotate_info') ?? null;
        if (!dynamic) await new Promise((resolve_) => setTimeout(resolve_, 500));
    }

    check('★ 装上插件后 AI 的工具表里**多出** `rotate_info`（端到端）', !!dynamic,
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

    await callLoader('unloadPluginPackage');

    let after = namesOf(await mcp.send('tools/list'));

    for (let i = 0; i < 20 && after.includes('rotate_info'); i++)
    {
        await new Promise((resolve_) => setTimeout(resolve_, 500));
        after = namesOf(await mcp.send('tools/list'));
    }

    check('卸载后**立刻**消失（每次现算、不缓存）', !after.includes('rotate_info'), `工具 ${after.length} 个`);
}
finally
{
    mcp.close();
    await opened.close();
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 插件 AI 工具端到端未通过——"装一个插件，AI 就多一个工具"必须能被真跑一遍。');
    process.exit(1);
}

console.log('✅ 插件 AI 工具端到端通过：装上就多、调得通、卸掉就消失');
