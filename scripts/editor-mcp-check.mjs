// MCP 桥接一致性自检：MCP 工具表 ↔ 桥接方法表。
//
// 加桥接方法却忘了加 MCP 工具（或反过来、方法名写错、schema 写坏）时，只有真去调用才会暴露；
// 这里把三方对齐检查，**离线即可运行**（不需要编辑器页面）：
//
//   1. TOOLS 定义 ↔ handleTool 的 map：定义了 schema 却没接线 / 接了线却没定义 schema
//   2. map 的桥接方法名 ↔ 桥接源码 HANDLERS 表：方法名写错（运行时才炸）
//   3. 桥接 HANDLERS ↔ map：桥接新增了方法但 MCP 忘了暴露（工具表悄悄落后）
//   4. 文档方法表 ↔ 桥接 HANDLERS：加了方法却没写进文档（读文档的人以为它不存在）
//   5. 实际启动 server 取 tools/list：schema 写坏导致 server 启动失败也会在这里暴露
//
// 用法：node scripts/editor-mcp-check.mjs
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = resolve(here, 'editor-mcp-server.mjs');
const BRIDGE_DECL = resolve(here, '../packages/editor/src/bridge/EditorBridge.ts');
const BRIDGE_WRITE = resolve(here, '../packages/editor/src/bridge/EditorBridgeWrite.ts');

let failed = 0;
let total = 0;

/** 按规则取第一个捕获组 */
function matchAll(text, pattern)
{
    return [...text.matchAll(pattern)].map((matched) => matched[1]);
}

function check(title, verify)
{
    total++;
    try
    {
        const detail = verify();
        console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    }
    catch (error)
    {
        failed++;
        console.log(`  FAIL  ${title} — ${error.message}`);
    }
}

/** 启动 MCP server（stdio），取 tools/list 的真实返回 */
function queryTools()
{
    return new Promise((resolvePromise, rejectPromise) =>
    {
        const child = spawn(process.execPath, [MCP_SERVER], { stdio: ['pipe', 'pipe', 'inherit'] });
        const timer = setTimeout(() =>
        {
            child.kill();
            rejectPromise(new Error('MCP server 10s 内没有返回 tools/list'));
        }, 10000);

        let buffer = '';
        child.stdout.on('data', (chunk) =>
        {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines)
            {
                if (!line.trim()) continue;
                let message;
                try
                {
                    message = JSON.parse(line);
                }
                catch
                {
                    continue;
                }
                if (message.id !== 2) continue;
                clearTimeout(timer);
                child.kill();
                resolvePromise(message.result?.tools ?? []);
            }
        });
        child.on('error', (error) => { clearTimeout(timer); rejectPromise(error); });

        const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
        send({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'mcp-check', version: '1' } },
        });
        send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    });
}

/** 桥接源码里的方法名（只读表 + 写表） */
function readBridgeMethods()
{
    const read = readFileSync(BRIDGE_DECL, 'utf8');
    const write = readFileSync(BRIDGE_WRITE, 'utf8');

    return new Set([
        ...matchAll(read, /^\s{4}'([a-zA-Z.]+)':\s*\(/gm),
        ...matchAll(write, /^\s{4}'([a-zA-Z.]+)':\s*\(/gm),
    ]);
}

/** 页面在线时取运行时方法表；不在线返回 null（不因此判失败） */
async function readRuntimeMethods()
{
    try
    {
        const base = await resolveBridgeBase();
        const call = await fetch(`${base}/__editor-bridge/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'editor.info', params: {} }),
        });
        if (!call.ok) return null;
        const { id } = await call.json();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        try
        {
            const result = await fetch(`${base}/__editor-bridge/result?id=${encodeURIComponent(id)}`, { signal: controller.signal });
            const payload = await result.json();

            return payload.ok === false ? null : (payload.result?.methods ?? null);
        }
        finally
        {
            clearTimeout(timer);
        }
    }
    catch
    {
        return null;
    }
}

console.log('[MCP 桥接一致性]');

const serverSource = readFileSync(MCP_SERVER, 'utf8');
// TOOLS 里的工具定义（缩进 8 空格，且是 `name:` 键，与 map 的条目不会混淆）
const definedTools = matchAll(serverSource, /^\s{8}name: '([a-z][a-z0-9_]*)',$/gm);
// handleTool 的 map：工具名 → 桥接方法名。只取 map 块本身——整份源码里
// `        method: 'POST',` 这类 8 空格缩进的键值也会被通用正则误收
const mapBlock = serverSource.match(/const map = \{([\s\S]*?)\n {4}\};/);
if (!mapBlock) throw new Error('在 editor-mcp-server.mjs 里找不到 handleTool 的 map 块');
const mapEntries = [...mapBlock[1].matchAll(/^\s{8}([a-z][a-z0-9_]*): '([a-zA-Z.]+)',$/gm)]
    .map((matched) => ({ tool: matched[1], method: matched[2] }));
const mappedTools = mapEntries.map((entry) => entry.tool);
const bridgeMethods = readBridgeMethods();

check('工具定义与接线表一一对应', () =>
{
    const onlyDefined = definedTools.filter((name) => !mappedTools.includes(name));
    const onlyMapped = mappedTools.filter((name) => !definedTools.includes(name));
    if (onlyDefined.length) throw new Error(`定义了 schema 却没接线：${onlyDefined.join(', ')}`);
    if (onlyMapped.length) throw new Error(`接了线却没定义 schema：${onlyMapped.join(', ')}`);

    return `${definedTools.length} 个工具`;
});

check('接线表里的方法名都存在于桥接源码', () =>
{
    const unknown = mapEntries.filter((entry) => !bridgeMethods.has(entry.method));
    if (unknown.length) throw new Error(`桥接里没有这些方法：${unknown.map((e) => `${e.tool}→${e.method}`).join(', ')}`);

    return `${mapEntries.length} 个映射全部命中`;
});

check('桥接方法都已被 MCP 暴露（不漏工具）', () =>
{
    const exposed = new Set(mapEntries.map((entry) => entry.method));
    const missing = [...bridgeMethods].filter((method) => !exposed.has(method));
    if (missing.length) throw new Error(`桥接有、MCP 没有：${missing.join(', ')}`);

    return `${bridgeMethods.size} 个桥接方法都有对应工具`;
});

check('每个工具都有非空描述与 object schema', () =>
{
    const blocks = serverSource.split(/^\s{4}\{$/m).slice(1);
    const bad = [];
    for (const name of definedTools)
    {
        const block = blocks.find((text) => text.includes(`name: '${name}',`));
        if (!block)
        {
            bad.push(`${name}(找不到定义块)`);
            continue;
        }
        if (!/description: '[^']{10,}'/.test(block)) bad.push(`${name}(描述过短)`);
        if (!block.includes("type: 'object'")) bad.push(`${name}(schema 不是 object)`);
        if (!block.includes('additionalProperties: false')) bad.push(`${name}(没关掉额外字段)`);
    }
    if (bad.length) throw new Error(bad.join(', '));

    return '描述、object schema、additionalProperties 均已就位';
});

const realTools = await queryTools();
check('server 实际返回的 tools/list 与定义一致', () =>
{
    const realNames = realTools.map((tool) => tool.name);
    const missing = definedTools.filter((name) => !realNames.includes(name));
    const extra = realNames.filter((name) => !definedTools.includes(name));
    if (missing.length) throw new Error(`tools/list 少了：${missing.join(', ')}`);
    if (extra.length) throw new Error(`tools/list 多了：${extra.join(', ')}`);

    return `${realNames.length} 个工具`;
});

check('文档方法表列出了所有桥接方法', () =>
{
    // 与"工具表 ↔ 方法表"同一个道理：加了方法却没写进文档，读文档的人就以为它不存在
    const doc = readFileSync(resolve(here, '../docs/EDITOR_AI_BRIDGE.md'), 'utf8');
    const documented = new Set(
        [...doc.matchAll(/^\|.*$/gm)]
            .flatMap((row) => [...row[0].matchAll(/`([a-z][a-zA-Z]*\.[a-zA-Z]+)`/g)].map((matched) => matched[1])),
    );
    const missing = [...bridgeMethods].filter((method) => !documented.has(method));
    if (missing.length) throw new Error(`文档里没列：${missing.join(', ')}`);

    return `${bridgeMethods.size} 个方法都在文档方法表里`;
});

const runtimeMethods = await readRuntimeMethods();
if (runtimeMethods)
{
    check('源码解析的方法表与页面运行时一致', () =>
    {
        const parsed = [...bridgeMethods];
        const missing = parsed.filter((method) => !runtimeMethods.includes(method));
        const extra = runtimeMethods.filter((method) => !parsed.includes(method));
        if (missing.length) throw new Error(`页面里没有：${missing.join(', ')}`);
        if (extra.length) throw new Error(`源码解析漏了：${extra.join(', ')}`);

        return `${runtimeMethods.length} 个方法`;
    });
}
else
{
    total++;
    console.log('  SKIP  页面运行时对照（编辑器页面不可达，不影响以上结论）');
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
