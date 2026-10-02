#!/usr/bin/env node
/**
 * feng3d-editor **宿主进程**（#272 P0：契约与骨架）。
 *
 * ## 它是什么
 *
 * 编辑器是 Web 应用而不是可 import 的库：`vite build` 的产物在 `public/`。
 * 从 npm 安装后没有 dev server 可用，所以这个进程把产物跑起来——
 * 而它同时是**宿主**：将来文件系统、项目工作区、插件装载、AI 桥接的服务端半都落在这里
 * （见 [NODE_HOST.md](../docs/NODE_HOST.md) §3 的 L0）。
 *
 * 现在的形态是 P0 要求的**骨架**：一个 cordis `Context` + 两个 `Service`
 * （{@link HostInfo} 报版本、{@link StaticServer} 提供静态资源），
 * 生命周期交给 context——`SIGINT`/`SIGTERM` → `ctx.fiber.dispose()` → 服务清理自动跑。
 *
 *   npx feng3d-editor                    # 默认 http://127.0.0.1:3000
 *   npx feng3d-editor --port 8080 --open
 *   npx feng3d-editor --version          # 报版本（宿主可自述）
 *
 * ## 为什么模块顶层就执行
 *
 * 本文件是**进程入口**——"import 时执行代码"正是它的职责，也是
 * `scripts/check-editor-host.mjs` 的入口白名单登记项（那条登记会被反向校验：
 * 文件不存在、或不再有启动调用，门禁就报过期）。
 * 宿主**内部**的模块（`bin/host/*.mjs`）不得有模块级启动：它们只导出 Service 与纯函数。
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { BridgeSocket } from './host/bridgeSocket.mjs';
import { HostInfo } from './host/hostInfo.mjs';
import { PluginPackages } from './host/pluginPackages.mjs';
import { StaticServer } from './host/staticServer.mjs';
import { openBrowser } from './host/httpFiles.mjs';

/** 静态资源根目录：本文件在 <包根>/bin/ 下，产物在 <包根>/public/ */
const PACKAGE_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_ROOT = resolve(PACKAGE_ROOT, 'public');

/**
 * 解析命令行参数。
 *
 * @returns {{ port: number, host: string, root: string, open: boolean, version: boolean, plugins: string | undefined }}
 */
function parseArgs()
{
    const argv = process.argv.slice(2);
    const options = {
        port: Number(process.env.PORT) || 3000,
        host: '127.0.0.1',
        root: DEFAULT_ROOT,
        open: false,
        version: false,
        plugins: undefined,
    };

    for (let i = 0; i < argv.length; i++)
    {
        const arg = argv[i];

        if (arg === '--port' || arg === '-p')
        {
            options.port = Number(argv[++i]);
        }
        else if (arg === '--host' || arg === '-h')
        {
            options.host = argv[++i];
        }
        else if (arg === '--root' || arg === '-r')
        {
            options.root = resolve(argv[++i]);
        }
        else if (arg === '--plugins')
        {
            options.plugins = resolve(argv[++i]);
        }
        else if (arg === '--open' || arg === '-o')
        {
            options.open = true;
        }
        else if (arg === '--version' || arg === '-v')
        {
            options.version = true;
        }
        else if (arg === '--help')
        {
            printHelp();
            process.exit(0);
        }
    }

    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535)
    {
        console.error(`[feng3d-editor] 端口非法：${options.port}`);
        process.exit(1);
    }

    return options;
}

/** 打印用法。 */
function printHelp()
{
    console.log(`feng3d-editor —— 启动 feng3d 编辑器（宿主进程）

用法：
  feng3d-editor [选项]

选项：
  -p, --port <端口>   监听端口，默认 3000（也可用环境变量 PORT）
  -h, --host <地址>   监听地址，默认 127.0.0.1
  -r, --root <目录>   静态资源根目录，默认包内 public/
      --plugins <文件> 插件包配置，默认 <root>/editor.plugins.json（不存在即不装插件包）
  -o, --open          启动后尝试用系统默认浏览器打开
  -v, --version       打印版本信息后退出
      --help          显示本帮助

插件包配置（本地、不入库）形如：
  { "plugins": [ { "id": "@feng3d/editor-plugin-rotate", "clientUrl": "/plugins/rotate.js" } ] }
宿主会把这份入口图注入页面（window.__EDITOR_BOOT__），页面启动时自行装载。
clientUrl 必须是浏览器能解析的地址（/xxx.js 或 http(s) URL）——裸包名在浏览器里解析不了。
`);
}

const options = parseArgs();

// 宿主 context：所有服务都挂在它下面；它的 fiber 就是宿主进程的生命周期
const ctx = new Context();
const hostInfo = new HostInfo(ctx);

// `--version` 只读宿主信息，不启动任何监听
if (options.version)
{
    console.log(hostInfo.describe());
    process.exit(0);
}

if (!existsSync(options.root))
{
    console.error(`[feng3d-editor] 找不到构建产物目录：${options.root}
请先在包目录执行 \`npm run build\`（产物输出到 public/）。`);
    process.exit(1);
}

// 插件包目录（#276 任务 4 的宿主半）：读配置产出**入口图**，由静态服务注入页面
const pluginPackages = new PluginPackages(ctx, {
    configPath: options.plugins ?? join(options.root, 'editor.plugins.json'),
    hostDescription: hostInfo.describe(),
});

const pluginSummary = pluginPackages.load();

if (pluginSummary.entries > 0)
{
    console.log(`[feng3d-editor] 插件包：${pluginSummary.entries} 个（配置 ${pluginPackages.configPath}）`);
}

for (const problem of pluginSummary.problems)
{
    console.warn(`[feng3d-editor] 插件配置有问题：${problem}`);
}

const staticServer = new StaticServer(ctx, {
    root: options.root,
    host: options.host,
    port: options.port,
    bootScript: () => pluginPackages.bootScript(),
});

let url;
/** WebSocket 通道（#273 第二阶段）：与 HTTP 同端口、共用命令层 */
let bridgeSocket;

try
{
    url = await staticServer.start();

    // 页面不必再每秒问"有没有活儿"，服务端也能主动推——后续的宿主服务
    //（文件变化 / 项目状态 / 长任务进度）都要靠这条
    bridgeSocket = new BridgeSocket(ctx, { relay: staticServer.relay });
    bridgeSocket.attach(staticServer.server);
}
catch (error)
{
    if (error?.code === 'EADDRINUSE')
    {
        console.error(`[feng3d-editor] 端口 ${options.port} 已被占用，换一个：--port <端口>`);
    }
    else
    {
        console.error(`[feng3d-editor] 启动失败：${error?.message ?? error}`);
    }
    process.exit(1);
}

console.log(`[feng3d-editor] 已启动：${url}（${hostInfo.describe()}）`);
console.log(`[feng3d-editor] 静态根目录：${options.root}`);
console.log('[feng3d-editor] 按 Ctrl+C 停止');

if (options.open) openBrowser(url);

/** 防止重复进入停止流程（连按 Ctrl+C 不该关两次） */
let stopping = false;

/**
 * 优雅停止：卸载 context → 服务的清理函数（关闭监听）自动跑。
 *
 * @param {string} signal 收到的信号名
 * @returns {Promise<void>} 停止完成
 */
async function shutdown(signal)
{
    if (stopping) return;
    stopping = true;

    console.log(`\n[feng3d-editor] 收到 ${signal}，正在停止…`);

    // 这一句就是"cordis 接管宿主"的落点：不需要谁记得手动 close 监听
    await ctx.fiber.dispose();

    console.log('[feng3d-editor] 已停止');

    process.exit(0);
}

for (const signal of ['SIGINT', 'SIGTERM'])
{
    process.on(signal, () => { void shutdown(signal); });
}
