// ============================================================
// @feng3d/error-logger vite 插件
//
// 一个插件同时完成两件事：
// 1. 服务端：注册中间件接收前端上报的日志，写入本地文件
// 2. 前端：向所有 HTML 自动注入日志拦截脚本（console + 全局错误）
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
     * 日志的输出目录（绝对路径或相对于项目根）。默认 `<项目根>/logs`。
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
 * 前端日志拦截脚本（作为虚拟模块内容返回给浏览器）。
 *
 * - 拦截 console.log/warn/error/info 与全局 error/unhandledrejection，上报到 endpoint
 */
function clientInitScript(endpoint: string): string
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

// 全局错误上报（仅日志，不截图）
window.addEventListener('error', e => {
    console.error('[全局错误] ' + e.message + ' at ' + e.filename + ':' + e.lineno + ':' + e.colno, e.error);
});
window.addEventListener('unhandledrejection', e => {
    console.error('[未捕获Promise] ' + (e.reason instanceof Error ? e.reason.message : String(e.reason)), e.reason);
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
 * 前端日志收集 vite 插件。
 *
 * 注册后自动完成「服务端接收日志」与「前端自动拦截上报」，无需任何额外代码。
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
            if (id === VIRTUAL_RESOLVED_ID) return clientInitScript(endpoint);
        }
    };
}
