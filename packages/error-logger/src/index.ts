// ============================================================
// @feng3d/error-logger vite 插件
//
// 一个插件同时完成两件事：
// 1. 服务端：注册中间件接收前端上报的日志与截图，写入本地文件
// 2. 前端：向所有 HTML 自动注入日志拦截 + 截图脚本（console + 全局错误 + 截图）
//
// 本文件为唯一源，由 tsc 编译生成 lib/index.mjs（运行时）与 lib/index.d.ts（类型）。
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * vite 插件配置。
 */
export interface ErrorLoggerPluginOptions
{
    /**
     * 日志接收端点路径。默认 `/api/log`。
     */
    endpoint?: string;

    /**
     * 截图接收端点路径。默认 `/api/screenshot`。
     */
    screenshotEndpoint?: string;

    /**
     * 日志与截图的输出目录（绝对路径或相对于项目根）。默认 `<项目根>/logs`。
     */
    logDir?: string;
}

// 日志级别图标（模拟 Chrome 控制台）
const levelIcons: Record<string, string> = {
    log: '',
    info: 'ℹ️ ',
    warn: '⚠️ ',
    error: '❌ '
};

// 虚拟模块 ID：transformIndexHtml 注入的 script src 指向它，由 resolveId/load 提供。
const VIRTUAL_INIT_ID = '/@error-logger-init';
const VIRTUAL_RESOLVED_ID = '\0error-logger-init';

/**
 * 前端日志拦截 + 截图脚本（作为虚拟模块内容返回给浏览器）。
 *
 * - 拦截 console.log/warn/error/info 与全局 error/unhandledrejection，上报到 endpoint
 * - 出错时自动截图；同时暴露 window.__captureScreen(reason) 供手动截图
 * - 截图通过 canvas.toDataURL 转为 base64，POST 到 screenshotEndpoint 存为 PNG
 */
function clientInitScript(endpoint: string, screenshotEndpoint: string): string
{
    return `
const clientId = 'client_' + Date.now();
const original = { log: console.log, warn: console.warn, error: console.error, info: console.info };

function fmt(args) {
    return args.map(a => {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'string') return a;
        if (typeof a === 'number' || typeof a === 'boolean') return String(a);
        if (a instanceof Error) return a.name + ': ' + a.message + (a.stack ? '\\n' + a.stack : '');
        try { return JSON.stringify(a, null, 2); } catch (e) { return '[无法序列化]'; }
    }).join(' ');
}

function send(level, message) {
    const data = JSON.stringify({ clientId, level, message, timestamp: Date.now() });
    if (navigator.sendBeacon) navigator.sendBeacon(${JSON.stringify(endpoint)}, data);
    else fetch(${JSON.stringify(endpoint)}, { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
}

['log', 'warn', 'error', 'info'].forEach(level => {
    console[level] = function (...args) {
        original[level].apply(console, args);
        send(level, fmt(args));
    };
});

// ---- 截图功能 ----
// 查找渲染 canvas：优先 id=glcanvas（feng3d 默认），否则取页面上最后一个 canvas。
function findCanvas() {
    return document.getElementById('glcanvas')
        || Array.from(document.querySelectorAll('canvas')).pop()
        || null;
}

// 把 dataUrl（PNG）上报到后端保存。captureScreen 与 __testImage 共用此上报逻辑。
function sendScreenshot(dataUrl, reason, width, height) {
    const base64 = dataUrl.split(',')[1];
    const payload = JSON.stringify({
        clientId, base64,
        reason: reason || 'manual', width, height,
        timestamp: Date.now()
    });
    // 截图数据较大，用 fetch。注意：不可用 keepalive（Chrome 限制 keepalive 请求体 ≤64KB，
    // 截图 base64 常超此限制，会导致 Failed to fetch）。
    fetch(${JSON.stringify(screenshotEndpoint)}, {
        method: 'POST', body: payload,
        headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json()).then(res => {
        console.log('[截图] 已保存 ' + (res.filename || '') + ' (' + (reason || 'manual') + ')');
    }).catch(e => console.warn('[截图] 上报失败', e.message));
}

// 截图并上报。reason 标记触发原因（手动/出错），写入日志便于关联。
function captureScreen(reason) {
    try {
        const canvas = findCanvas();
        if (!canvas) { console.warn('[截图] 未找到 canvas，跳过'); return; }
        // toDataURL 读取 canvas 当前呈现内容（WebGPU canvas present 后可读）
        sendScreenshot(canvas.toDataURL('image/png'), reason, canvas.width, canvas.height);
    } catch (e) {
        console.warn('[截图] 异常', e.message);
    }
}

// 生成指定尺寸的随机彩色图片并上报，用于测试截图链路（不依赖真实 canvas 渲染）。
// 控制台执行：__testImage(800, 600)
function testImage(width, height) {
    width = width || 200; height = height || 200;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    // 随机彩色像素填充
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillStyle = 'rgb(' + (Math.random()*255|0) + ',' + (Math.random()*255|0) + ',' + (Math.random()*255|0) + ')';
            ctx.fillRect(x, y, 1, 1);
        }
    }
    sendScreenshot(canvas.toDataURL('image/png'), 'test-image', width, height);
}

// 暴露 API
window.__captureScreen = captureScreen;
window.__testImage = testImage;

// 全局错误：自动截图后上报
window.addEventListener('error', e => {
    console.error('[全局错误] ' + e.message + ' at ' + e.filename + ':' + e.lineno + ':' + e.colno, e.error);
    captureScreen('error');
});
window.addEventListener('unhandledrejection', e => {
    console.error('[未捕获Promise] ' + (e.reason instanceof Error ? e.reason.message : String(e.reason)), e.reason);
    captureScreen('promise-rejection');
});

console.log('=== 浏览器环境信息 ===', {
    userAgent: navigator.userAgent, language: navigator.language, platform: navigator.platform,
    screen: window.screen.width + 'x' + window.screen.height, viewport: window.innerWidth + 'x' + window.innerHeight,
    devicePixelRatio: window.devicePixelRatio, url: window.location.href,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
});
`;
}

// 记录已写入头部的日志文件，避免环境信息重复写
const writtenHeaders = new Set<string>();

/**
 * 把 base64 字符串解码为二进制 Buffer 并写入 PNG 文件。
 * @returns 写入的文件名
 */
function saveScreenshot(logDir: string, base64: string, timestamp: number): string
{
    const pad = (n: number, l = 2) => String(n).padStart(l, '0');
    const date = new Date(timestamp ?? Date.now());
    const fname = `screenshot_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
        + `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}${pad(date.getMilliseconds(), 3)}.png`;
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, fname), Buffer.from(base64, 'base64'));
    return fname;
}

/**
 * 前端日志收集 + 截图 vite 插件。
 *
 * 注册后自动完成「服务端接收日志/截图」与「前端自动拦截上报 + 截图」，无需任何额外代码。
 *
 * - 手动截图：浏览器控制台执行 `window.__captureScreen('调试某帧')`
 * - 测试截图：浏览器控制台执行 `window.__testImage(800, 600)`
 * - 自动截图：捕获到全局 error / unhandledrejection 时自动截图
 *
 * @param options 可选配置
 *
 * @example
 * ```ts
 * import { errorLoggerPlugin } from '@feng3d/error-logger/vite';
 * export default defineConfig({ plugins: [errorLoggerPlugin()] });
 * ```
 */
export function errorLoggerPlugin(options?: ErrorLoggerPluginOptions): Plugin
{
    const opts = options || {};
    const endpoint = opts.endpoint ?? '/api/log';
    const screenshotEndpoint = opts.screenshotEndpoint ?? '/api/screenshot';
    const rawLogDir = opts.logDir;

    const resolveLogDir = (viteRoot: string): string =>
    {
        if (!rawLogDir) return path.resolve(viteRoot, 'logs');
        return path.isAbsolute(rawLogDir) ? rawLogDir : path.resolve(viteRoot, rawLogDir);
    };

    return {
        name: 'error-logger',
        configureServer(server)
        {
            const logDir = resolveLogDir(server.config.root);

            // ---- 日志接收中间件 ----
            server.middlewares.use(endpoint, (req, res) =>
            {
                if (req.method !== 'POST')
                {
                    res.statusCode = 405;
                    res.end('Method Not Allowed');
                    return;
                }

                let body = '';
                req.on('data', (chunk) => { body += chunk.toString(); });
                req.on('end', () =>
                {
                    try
                    {
                        const { clientId, level, message, timestamp } = JSON.parse(body);
                        const date = new Date(timestamp ?? Date.now());

                        // 文件名基于 clientId（会话级固定，一个会话一个文件）。
                        const pad = (n: number, l = 2) => String(n).padStart(l, '0');
                        let sessionMs = Date.now();
                        if (typeof clientId === 'string' && clientId.startsWith('client_'))
                        {
                            const parsed = parseInt(clientId.slice('client_'.length));
                            if (!isNaN(parsed)) sessionMs = parsed;
                        }
                        const sd = new Date(sessionMs);
                        const fname = `${sd.getFullYear()}${pad(sd.getMonth() + 1)}${pad(sd.getDate())}`
                            + `_${pad(sd.getHours())}${pad(sd.getMinutes())}${pad(sd.getSeconds())}${pad(sd.getMilliseconds(), 3)}.log`;
                        const logFile = path.join(logDir, `frontend_${fname}`);

                        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

                        const isEnvHeader = typeof message === 'string' && message.includes('浏览器环境信息');
                        const lines: string[] = [];

                        if (isEnvHeader && !writtenHeaders.has(logFile))
                        {
                            writtenHeaders.add(logFile);
                            lines.push(
                                '===================================================================',
                                `客户端 ID: ${clientId || 'unknown'}`,
                                `会话开始: ${sd.toISOString()}`,
                                '-------------------------------------------------------------------',
                                ...message.split('\n'),
                                '===================================================================',
                                ''
                            );
                        } else if (!isEnvHeader)
                        {
                            const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
                            lines.push(`[${time}] ${levelIcons[level] || ''}${message}`);
                        }

                        if (lines.length > 0) fs.appendFileSync(logFile, lines.join('\n') + '\n', 'utf-8');

                        res.statusCode = 200;
                        res.end(JSON.stringify({ success: true }));
                    } catch (err)
                    {
                        console.error('保存日志失败:', err);
                        res.statusCode = 400;
                        res.end('Bad Request');
                    }
                });
            });

            // ---- 截图接收中间件 ----
            server.middlewares.use(screenshotEndpoint, (req, res) =>
            {
                if (req.method !== 'POST')
                {
                    res.statusCode = 405;
                    res.end('Method Not Allowed');
                    return;
                }

                let body = '';
                req.on('data', (chunk) => { body += chunk.toString(); });
                req.on('end', () =>
                {
                    try
                    {
                        const parsed = JSON.parse(body);
                        const { base64, timestamp, reason, width, height, clientId } = parsed;
                        if (!base64)
                        {
                            res.statusCode = 400;
                            res.end('Bad Request: missing base64');
                            return;
                        }
                        const filename = saveScreenshot(logDir, base64, timestamp);

                        // 在对应会话日志里追加一条截图引用，便于关联文本与图像
                        if (clientId)
                        {
                            const pad = (n: number, l = 2) => String(n).padStart(l, '0');
                            let sessionMs = timestamp ?? Date.now();
                            if (typeof clientId === 'string' && clientId.startsWith('client_'))
                            {
                                const p = parseInt(clientId.slice('client_'.length));
                                if (!isNaN(p)) sessionMs = p;
                            }
                            const sd = new Date(sessionMs);
                            const logName = `frontend_${sd.getFullYear()}${pad(sd.getMonth() + 1)}${pad(sd.getDate())}`
                                + `_${pad(sd.getHours())}${pad(sd.getMinutes())}${pad(sd.getSeconds())}${pad(sd.getMilliseconds(), 3)}.log`;
                            const date = new Date(timestamp ?? Date.now());
                            const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
                            const ref = `[${time}] 📷 [截图] ${filename} (${reason || 'manual'}, ${width || '?'}x${height || '?'})`;
                            fs.appendFileSync(path.join(logDir, logName), ref + '\n', 'utf-8');
                        }

                        res.statusCode = 200;
                        res.end(JSON.stringify({ success: true, filename }));
                    } catch (err)
                    {
                        console.error('保存截图失败:', err);
                        res.statusCode = 400;
                        res.end('Bad Request');
                    }
                });
            });
        },
        transformIndexHtml()
        {
            // 注入外部 module script，src 指向虚拟模块（由下方 resolveId/load 提供）。
            return [{
                tag: 'script',
                attrs: { type: 'module', src: VIRTUAL_INIT_ID },
                injectTo: 'head',
            }];
        },
        resolveId(id)
        {
            if (id === VIRTUAL_INIT_ID) return VIRTUAL_RESOLVED_ID;
        },
        load(id)
        {
            if (id === VIRTUAL_RESOLVED_ID) return clientInitScript(endpoint, screenshotEndpoint);
        }
    };
}
