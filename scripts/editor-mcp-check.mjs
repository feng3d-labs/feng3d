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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = resolve(here, 'editor-mcp-server.mjs');
const BRIDGE_DECL = resolve(here, '../packages/editor/src/bridge/EditorBridge.ts');
const BRIDGE_WRITE = resolve(here, '../packages/editor/src/bridge/EditorBridgeWrite.ts');
const HOST_SERVE = resolve(here, '../packages/editor/bin/serve.mjs');

let failed = 0;
let total = 0;
/** 跳过项单列：把 SKIP 算成"通过"会让离线跑也报 7/7，而实际只验了 6 项 */
let skipped = 0;

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
/**
 * 桥接方法表（从源码里读）。
 *
 * 两个来源：
 * 1. 核心方法：`EditorBridge.ts` / `EditorBridgeWrite.ts` 里的方法表字面量；
 * 2. **插件贡献的方法**（issue #169）：`src/plugins/*.ts` 清单里的 `bridgeMethods`。
 *    它们不在 EditorBridge.ts 里，只扫前者会让「插件加了方法、MCP 忘了暴露」这类漂移
 *    悄悄溜过去——而那正是本脚本存在的理由。
 *
 * @returns 方法名集合
 */
function readBridgeMethods()
{
    const read = readFileSync(BRIDGE_DECL, 'utf8');
    const write = readFileSync(BRIDGE_WRITE, 'utf8');
    const manifestRoot = resolve(here, '../packages/editor/src/plugins');

    // 清单里的写法是 `{ name: 'editor.setTool', handler: editorSetTool }`——
    // 用 `handler:` 紧跟其后做锚点，避免把清单里别的 `name:` 字段（贡献点名）也当成方法名
    const fromManifests = readdirSync(manifestRoot)
        .filter((name) => name.startsWith('builtin') && name.endsWith('.ts'))
        .flatMap((name) => matchAll(readFileSync(resolve(manifestRoot, name), 'utf8'), /name: '([a-zA-Z.]+)', handler:/g));

    return new Set([
        // 缩进**不写死**：方法表成员目前是 4 空格，但 `#278` 之后有两条是"注入"的，
        // 写在嵌套对象里、缩进更深。它们同样是桥接方法，漏掉就会误报"方法名写错"。
        ...matchAll(read, /^\s+'([a-zA-Z.]+)':\s*\(/gm),
        ...matchAll(write, /^\s+'([a-zA-Z.]+)':\s*\(/gm),
        ...fromManifests,
        ...readPluginPackageMethods(),
    ]);
}

/**
 * **仓库内的插件包**贡献的桥接方法（#281）。
 *
 * 插件包的 client 半可以贡献 `bridgeMethods`，而它们不在 `src/plugins/` 里——
 * 不扫的话，"插件贡献的方法"从来没被一致性检查覆盖过（实测：样板插件的 `rotate.info`
 * 就是靠这条才被看见的）。
 *
 * 单独抽成函数还有一个用处：**运行时对照**要把它们排除——那些方法是**运行时装载**的
 * 插件带来的，页面里默认没有（装了才有），不排除就会出现"页面里没有：rotate.info"这种**假失败**。
 *
 * @returns 方法名集合
 */
function readPluginPackageMethods()
{
    return new Set(readdirSync(resolve(here, '../packages'))
        .filter((name) => name.startsWith('editor-plugin-'))
        .map((name) => resolve(here, '../packages', name, 'src', 'client.ts'))
        .filter((file) => existsSync(file))
        .flatMap((file) =>
        {
            const block = readFileSync(file, 'utf8').match(/bridgeMethods:\s*\[([\s\S]*?)\n\s{8}\]/);

            return block ? matchAll(block[1], /name:\s*'([^']+)'/g) : [];
        }));
}

/**
 * **宿主方法表**（`bin/serve.mjs` 里的 `hostMethods.register('host.xxx', …)`）。
 *
 * 为什么要单独读它：`host.*` 方法**不经页面**——relay 按 `host.` 前缀分流，直接投给宿主
 * （`check-editor-host-methods.mjs` 的判据就落在"脚本根本不打开页面"这一点上）。
 * 所以它们不在 `EditorBridge.ts` 的方法表里；不分开读的话，"MCP 映射到 `host.*`"
 * 会被上一条「方法名必须存在于桥接源码」误判成写错名字。
 *
 * @returns 方法名集合
 */
function readHostMethods()
{
    return new Set(matchAll(readFileSync(HOST_SERVE, 'utf8'), /hostMethods\.register\('([^']+)'/g));
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
const hostMethods = readHostMethods();

check('工具定义与接线表一一对应', () =>
{
    const onlyDefined = definedTools.filter((name) => !mappedTools.includes(name));
    const onlyMapped = mappedTools.filter((name) => !definedTools.includes(name));
    if (onlyDefined.length) throw new Error(`定义了 schema 却没接线：${onlyDefined.join(', ')}`);
    if (onlyMapped.length) throw new Error(`接了线却没定义 schema：${onlyMapped.join(', ')}`);

    return `${definedTools.length} 个工具`;
});

check('接线表里的方法名都存在于桥接源码或宿主方法表', () =>
{
    const unknown = mapEntries.filter((entry) => !bridgeMethods.has(entry.method) && !hostMethods.has(entry.method));
    if (unknown.length) throw new Error(`桥接与宿主方法表里都没有：${unknown.map((e) => `${e.tool}→${e.method}`).join(', ')}`);

    const hostMapped = mapEntries.filter((entry) => entry.method.startsWith('host.')).length;

    return `${mapEntries.length} 个映射全部命中（其中 ${hostMapped} 个直接投给宿主）`;
});

// ---- 宿主能力（#281 的"搭场景 → 构建 → 运行"那一段）----
// 宿主方法表有十几个（工作区读写 / 二进制 / 建删目录 / 构建 / 发布），
// **不需要**全暴露给 AI：`host.workspace.writeBinary` 这类是给页面当 FS 用的。
// 但"构建 / 发布"是 AI 工作流的一环——少了它，DSH 只能让人手动去 CLI 敲
// `host.build.run`，验收①「走 MCP 完成 搭场景 → 构建 → 运行」就不成立。
const REQUIRED_HOST_TOOLS = ['host.build.run', 'host.build.status', 'host.publish.run'];

check('关键宿主能力已暴露给 AI（构建 / 发布）', () =>
{
    const exposed = new Set(mapEntries.map((entry) => entry.method));
    const missing = REQUIRED_HOST_TOOLS.filter((method) => !exposed.has(method));
    if (missing.length) throw new Error(`MCP 没有暴露：${missing.join(', ')}——AI 就完不成「搭场景 → 构建 → 发布」`);

    return `${REQUIRED_HOST_TOOLS.length} 个都在（${REQUIRED_HOST_TOOLS.join(', ')}）`;
});

check('暴露的宿主方法都在宿主方法表里（名字写错会被抓住）', () =>
{
    // 方法自证：宿主方法表扫到 0 个时，上面那条会"永远绿"——先钉住扫描器本身
    if (hostMethods.size === 0) throw new Error('从 bin/serve.mjs 一个宿主方法都没扫到——扫描器坏了');

    const exposedHost = mapEntries.filter((entry) => entry.method.startsWith('host.'));
    const unknown = exposedHost.filter((entry) => !hostMethods.has(entry.method));
    if (unknown.length)
    {
        throw new Error(`宿主没有注册：${unknown.map((e) => e.method).join(', ')}（宿主现有：${[...hostMethods].join(', ')}）`);
    }

    return `${exposedHost.length} 个已暴露，宿主共注册 ${hostMethods.size} 个`;
});

check('桥接方法都已被 MCP 暴露（不漏工具）', () =>
{
    const exposed = new Set(mapEntries.map((entry) => entry.method));
    // **插件贡献的工具**（`contributes.aiTools`）也算"已暴露"——它们不在静态 map 里，
    // 而是由 `tools/list` 现算合并出来的（#281 路径 A）
    const { list: aiTools } = readDeclaredAiTools();
    const exposedByAiTools = new Set(aiTools.map((tool) => tool.method));
    const missing = [...bridgeMethods].filter((method) => !exposed.has(method) && !exposedByAiTools.has(method));
    if (missing.length) throw new Error(`桥接有、MCP 没有：${missing.join(', ')}`);

    const viaAiTools = [...bridgeMethods].filter((method) => exposedByAiTools.has(method)).length;

    return `${bridgeMethods.size} 个桥接方法都有对应工具（其中 ${viaAiTools} 个经插件 aiTools 暴露）`;
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

check('文档方法表列出了所有桥接方法与已暴露的宿主方法', () =>
{
    // 与"工具表 ↔ 方法表"同一个道理：加了方法却没写进文档，读文档的人就以为它不存在。
    // 方法名可能两段或三段（`scene.setMany` / `host.build.run`），所以正则要吃到全部段
    // （旧写法只吃两段，`host.build.run` 会被截成 `host.build`，于是永远"文档里没列"）。
    const doc = readFileSync(resolve(here, '../docs/EDITOR_AI_BRIDGE.md'), 'utf8');
    const documented = new Set(
        [...doc.matchAll(/^\|.*$/gm)]
            .flatMap((row) => [...row[0].matchAll(/`([a-z][a-zA-Z]*(?:\.[a-zA-Z]+)+)`/g)].map((matched) => matched[1])),
    );
    const exposedHost = mapEntries.filter((entry) => entry.method.startsWith('host.')).map((entry) => entry.method);
    // 插件经 aiTools 暴露的方法同样要在文档里（否则"这个方法存在"只有源码知道）
    const { list: aiTools } = readDeclaredAiTools();
    const required = [...bridgeMethods, ...exposedHost, ...aiTools.map((tool) => tool.method)];
    const missing = required.filter((method) => !documented.has(method));
    if (missing.length) throw new Error(`文档里没列：${missing.join(', ')}`);

    return `${bridgeMethods.size} 个桥接方法 + ${exposedHost.length} 个宿主方法 + ${aiTools.length} 个插件方法都在文档方法表里`;
});

// ---------- 插件贡献的 AI 工具（#281 路径 A）----------
// 契约在编辑器侧（`contributes.aiTools`），消费在 MCP 侧（`tools/list` 现算合并）。
// 这里离线验**声明**的一致性；"声明了却没人消费"由**接线自证**拦。
//
// 写成**函数**（而不是顶层 const）：上面"桥接方法是否已暴露"也要用它，
// 而函数声明会提升——省得把这一块整体搬到前面去。
function readDeclaredAiTools()
{
    const sources = [
        ...readdirSync(resolve(here, '../packages/editor/src/plugins'))
            .filter((name) => name.startsWith('builtin') && name.endsWith('.ts'))
            .map((name) => resolve(here, '../packages/editor/src/plugins', name)),
        ...readdirSync(resolve(here, '../packages'))
            .filter((name) => name.startsWith('editor-plugin-'))
            .map((name) => resolve(here, '../packages', name, 'src', 'client.ts'))
            .filter((file) => existsSync(file)),
    ];
    const list = sources.flatMap((file) =>
    {
        const block = readFileSync(file, 'utf8').match(/aiTools:\s*\[([\s\S]*?)\n\s{8}\]/);
        if (!block) return [];

        return [...block[1].matchAll(/\{([\s\S]*?)\}/g)].map((matched) => ({
            file,
            name: /name:\s*'([^']+)'/.exec(matched[1])?.[1],
            method: /method:\s*'([^']+)'/.exec(matched[1])?.[1],
            description: /description:\s*'([^']*)'/.exec(matched[1])?.[1],
            hasSchema: /inputSchema:\s*\{/.test(matched[1]),
        }));
    });

    return { sources, list };
}

check('仓库内至少有一处 aiTools 声明（否则这一组检查是空转）', () =>
{
    const { sources, list } = readDeclaredAiTools();
    if (list.length === 0) throw new Error('一个 aiTools 声明都没扫到——契约刚立，样板插件应当至少有一处');

    return `扫到 ${list.length} 条（${sources.length} 个来源文件）`;
});

check('aiTool.method 都存在于桥接方法表**或**宿主方法表', () =>
{
    const { list } = readDeclaredAiTools();
    const unknown = list.filter((tool) => !bridgeMethods.has(tool.method) && !hostMethods.has(tool.method));
    if (unknown.length) throw new Error(unknown.map((tool) => `${tool.name}→${tool.method}`).join(', '));

    return `${list.length} 条全部命中`;
});

check('aiTool.name 是 snake_case，且**不与核心工具重名**（同名会被核心优先忽略）', () =>
{
    const { list } = readDeclaredAiTools();
    const bad = list.filter((tool) => !/^[a-z][a-z0-9_]*$/.test(tool.name ?? ''));
    if (bad.length) throw new Error(`不是 snake_case：${bad.map((tool) => tool.name).join(', ')}`);

    const coreNames = new Set(definedTools);
    const clash = list.filter((tool) => coreNames.has(tool.name));
    if (clash.length) throw new Error(`与核心工具同名（MCP 侧会忽略它）：${clash.map((tool) => tool.name).join(', ')}`);

    return `${list.length} 条命名合规`;
});

check('aiTool 有足够长的描述与 object schema（否则 AI 用不起来）', () =>
{
    const { list } = readDeclaredAiTools();
    const bad = list.filter((tool) => (tool.description ?? '').length < 10 || !tool.hasSchema);
    if (bad.length) throw new Error(`描述过短或缺 schema：${bad.map((tool) => tool.name).join(', ')}`);

    return '描述与 schema 均已就位';
});

check('★ MCP 侧真的会合并插件工具（接线自证：`tools/list` 现算 + `handleTool` 查动态表）', () =>
{
    const wired = /tools:\s*await listTools\(\)/.test(serverSource) && /pluginMethods\.get\(name\)/.test(serverSource);
    if (!wired) throw new Error('MCP server 没接上动态工具——"声明了却没人消费"正是这条要拦的');

    return '两项接线都在（现算 + 动态查表）';
});

const runtimeMethods = await readRuntimeMethods();
if (runtimeMethods)
{
    check('源码解析的方法表与页面运行时一致', () =>
    {
        // 仓库内**插件包**贡献的方法要排除：它们是**运行时装载**的插件带来的，
        // 页面里默认没有（装了才有）——不排除就会出现"页面里没有：rotate.info"这种假失败
        const fromPluginPackages = readPluginPackageMethods();
        const parsed = [...bridgeMethods].filter((method) => !fromPluginPackages.has(method));
        const missing = parsed.filter((method) => !runtimeMethods.includes(method));
        const extra = runtimeMethods.filter((method) => !parsed.includes(method) && !fromPluginPackages.has(method));
        if (missing.length) throw new Error(`页面里没有：${missing.join(', ')}`);
        if (extra.length) throw new Error(`源码解析漏了：${extra.join(', ')}`);

        return `${runtimeMethods.length} 个方法（已排除 ${fromPluginPackages.size} 个插件包贡献的方法）`;
    });
}
else
{
    skipped++;
    console.log('  SKIP  页面运行时对照（编辑器页面不可达，不影响以上结论）');
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}${skipped > 0 ? `，跳过 ${skipped}` : ''}`);
process.exit(failed > 0 ? 1 : 0);
