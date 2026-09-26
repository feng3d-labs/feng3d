#!/usr/bin/env node
/**
 * feng3d-editor 静态服务器。
 *
 * 编辑器是 Web 应用而不是可 import 的库：`vite build` 的产物在 `public/`
 * （多页面入口 index.html / run.html）。从 npm 安装后没有 dev server 可用，
 * 因此提供一个零依赖的静态服务器把构建产物跑起来：
 *
 *   npx feng3d-editor            # 默认 http://127.0.0.1:3000
 *   npx feng3d-editor --port 8080 --open
 *
 * 只依赖 Node 内置模块，不引入 express 之类的运行时依赖。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 静态资源根目录：本文件在 <包根>/bin/ 下，产物在 <包根>/public/ */
const PACKAGE_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_ROOT = join(PACKAGE_ROOT, 'public');

/** 扩展名 → Content-Type。缺省用 application/octet-stream 让浏览器下载。 */
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.wasm': 'application/wasm',
    '.bin': 'application/octet-stream',
    '.txt': 'text/plain; charset=utf-8',
};

/**
 * 解析命令行参数。
 *
 * @returns {{ port: number, host: string, root: string, open: boolean }}
 */
function parseArgs()
{
    const argv = process.argv.slice(2);
    const options = {
        port: Number(process.env.PORT) || 3000,
        host: '127.0.0.1',
        root: DEFAULT_ROOT,
        open: false,
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
        else if (arg === '--open' || arg === '-o')
        {
            options.open = true;
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
    console.log(`feng3d-editor —— 启动 feng3d 编辑器

用法：
  feng3d-editor [选项]

选项：
  -p, --port <端口>   监听端口，默认 3000（也可用环境变量 PORT）
  -h, --host <地址>   监听地址，默认 127.0.0.1
  -r, --root <目录>   静态资源根目录，默认包内 public/
  -o, --open          启动后尝试用系统默认浏览器打开
      --help          显示本帮助
`);
}

/**
 * 把 URL 路径解析成磁盘上的安全路径（拒绝越出根目录）。
 *
 * 注意 `decodeURIComponent` 对畸形百分号转义（如 `/%`、`/%zz`）会抛 URIError。
 * 这个函数运行在请求回调里，异常逃出去会直接打挂整个服务进程——
 * 任何人访问一次 `GET /%` 就能让编辑器服务下线，所以这里把解码失败
 * 归入「非法路径」处理，而不是让它冒泡。
 *
 * @param {string} root 静态根目录（绝对路径）
 * @param {string} urlPath 请求的 URL 路径
 * @returns {string | null} 合法则返回绝对路径；越界或解码失败返回 null
 */
function resolveSafePath(root, urlPath)
{
    let decoded;

    try
    {
        decoded = decodeURIComponent(urlPath.split('?')[0]);
    }
    catch
    {
        return null;
    }

    const relative = normalize(decoded).replace(/^([/\\])+/, '');
    const full = resolve(root, relative);

    // 必须仍在根目录内：允许 full === root，或 full 以 root + 分隔符开头
    if (full !== root && !full.startsWith(root + sep)) return null;

    return full;
}

/**
 * 用系统默认程序打开 URL（失败只提示，不影响服务）。
 *
 * @param {string} url 要打开的地址
 */
async function openBrowser(url)
{
    const { spawn } = await import('node:child_process');
    const command = process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin'
            ? ['open', [url]]
            : ['xdg-open', [url]];

    try
    {
        spawn(command[0], command[1], { stdio: 'ignore', detached: true }).unref();
    }
    catch (error)
    {
        console.warn(`[feng3d-editor] 自动打开浏览器失败：${error.message}`);
    }
}

const options = parseArgs();

if (!existsSync(options.root))
{
    console.error(`[feng3d-editor] 找不到构建产物目录：${options.root}
请先在包目录执行 \`npm run build\`（产物输出到 public/）。`);
    process.exit(1);
}

const server = createServer((req, res) =>
{
    // 兜底：请求回调里抛出的异常会直接打挂服务进程（一个请求就能让编辑器下线）。
    // 已单独处理解码失败与读取错误，这里再保一层，任何意外都降级成 500。
    try
    {
        handleRequest(req, res);
    }
    catch (error)
    {
        console.error(`[feng3d-editor] 处理请求失败 ${req.method} ${req.url}：${error.message}`);
        if (!res.headersSent)
        {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('500 服务器内部错误');
    }
});

/**
 * 处理单个静态资源请求。
 *
 * @param {import('node:http').IncomingMessage} req 请求
 * @param {import('node:http').ServerResponse} res 响应
 */
function handleRequest(req, res)
{
    if (req.method !== 'GET' && req.method !== 'HEAD')
    {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('只支持 GET / HEAD');
        return;
    }

    let filePath = resolveSafePath(options.root, req.url || '/');
    if (!filePath)
    {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('禁止访问');
        return;
    }

    // 目录请求补 index.html；找不到的文件回落到 index.html（前端路由友好）
    if (isDirectory(filePath))
    {
        filePath = join(filePath, 'index.html');
    }
    if (!isFile(filePath))
    {
        filePath = join(options.root, 'index.html');
    }
    if (!isFile(filePath))
    {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 未找到');
        return;
    }

    const contentType = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
    });

    if (req.method === 'HEAD')
    {
        res.end();
        return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', (error) =>
    {
        console.error(`[feng3d-editor] 读取失败 ${filePath}：${error.message}`);
        res.destroy();
    });
    stream.pipe(res);
}

/**
 * 判断路径是否是目录（路径不存在或 stat 失败都算否，不抛异常）。
 *
 * @param {string} target 绝对路径
 * @returns {boolean} 是否目录
 */
function isDirectory(target)
{
    try
    {
        return existsSync(target) && statSync(target).isDirectory();
    }
    catch
    {
        return false;
    }
}

/**
 * 判断路径是否是普通文件（路径不存在或 stat 失败都算否，不抛异常）。
 *
 * @param {string} target 绝对路径
 * @returns {boolean} 是否普通文件
 */
function isFile(target)
{
    try
    {
        return existsSync(target) && statSync(target).isFile();
    }
    catch
    {
        return false;
    }
}

server.listen(options.port, options.host, () =>
{
    const { port } = server.address();
    const url = `http://${options.host}:${port}/`;
    console.log(`[feng3d-editor] 已启动：${url}`);
    console.log(`[feng3d-editor] 静态根目录：${options.root}`);
    console.log('[feng3d-editor] 按 Ctrl+C 停止');
    if (options.open) openBrowser(url);
});

server.on('error', (error) =>
{
    if (error.code === 'EADDRINUSE')
    {
        console.error(`[feng3d-editor] 端口 ${options.port} 已被占用，换一个：--port <端口>`);
    }
    else
    {
        console.error(`[feng3d-editor] 启动失败：${error.message}`);
    }
    process.exit(1);
});
