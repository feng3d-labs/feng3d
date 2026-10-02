/**
 * 宿主侧的静态资源工具（#272 P0）。
 *
 * 从原 `bin/serve.mjs` 原样搬出来的纯函数：它们与 cordis 无关，
 * 单独一处便于测试，也让服务类只写"服务该管的事"。
 */
import { existsSync, statSync } from 'node:fs';
import { normalize, resolve, sep } from 'node:path';

/** 扩展名 → Content-Type。缺省用 application/octet-stream 让浏览器下载。 */
export const MIME_TYPES = {
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
export function resolveSafePath(root, urlPath)
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
 * 判断路径是否是目录（路径不存在或 stat 失败都算否，不抛异常）。
 *
 * @param {string} target 绝对路径
 * @returns {boolean} 是否目录
 */
export function isDirectory(target)
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
export function isFile(target)
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

/**
 * 用系统默认程序打开 URL（失败只提示，不影响服务）。
 *
 * @param {string} url 要打开的地址
 */
export async function openBrowser(url)
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
