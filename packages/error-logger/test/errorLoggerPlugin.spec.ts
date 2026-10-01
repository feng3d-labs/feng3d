import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { errorLoggerPlugin } from '../src/index';

/**
 * `@feng3d/error-logger`（`packages/error-logger/src/index.ts`，190 行，此前**行覆盖率 0%**、且**没有 test 目录**）。
 *
 * 它是一个 **Vite 插件工厂**：
 *
 * ```ts
 * errorLoggerPlugin(options?) → {
 *     name: 'error-logger',
 *     configureServer(server) {
 *         server.middlewares.use(endpoint, handler)   // endpoint 默认 '/api/log'
 *     },
 * }
 * ```
 *
 * 中间件的行为：
 * - **非 POST → `statusCode = 405` + `end('Method Not Allowed')`**（不写文件）；
 * - POST → 累积 body、解析 JSON、在 `logDir`（默认 `<vite root>/logs`）下按 `clientId` 写
 *   `frontend_<时间戳>.log`。
 *
 * 本文件用**假 server + 假 req/res** 驱动它：这些断言都不需要真的起 Vite。
 * 写文件的部分用**临时目录**，用完即删。
 */

interface UsedMiddleware { path: string; handler: (req: unknown, res: unknown) => void }

/** 造一个只满足插件需要的假 Vite server */
function makeServer(root: string)
{
    const used: UsedMiddleware[] = [];

    return {
        used,
        server: {
            config: { root },
            middlewares: {
                use(path: string, handler: (req: unknown, res: unknown) => void)
                {
                    used.push({ path, handler });
                },
            },
        },
    };
}

/** 造一对假 req / res，可手动触发 'data' / 'end' */
function makeReqRes(method: string, body?: unknown)
{
    const listeners: Record<string, ((arg?: unknown) => void)[]> = {};

    const req = {
        method,
        on(event: string, cb: (arg?: unknown) => void)
        {
            (listeners[event] ??= []).push(cb);
        },
        emit(event: string, arg?: unknown)
        {
            for (const cb of listeners[event] ?? []) cb(arg);
        },
    };

    const res = {
        statusCode: 200,
        endedWith: undefined as string | undefined,
        end(s?: string) { res.endedWith = s; },
    };

    // 便捷：一次性把 body 送进去
    const send = () =>
    {
        if (body !== undefined) req.emit('data', Buffer.from(JSON.stringify(body)));
        req.emit('end');
    };

    return { req, res, send };
}

let root: string;

beforeEach(() =>
{
    root = mkdtempSync(join(tmpdir(), 'errlog-'));
});

afterEach(() =>
{
    rmSync(root, { recursive: true, force: true });
});

describe('errorLoggerPlugin（@feng3d/error-logger）', () =>
{
    it('★ 返回的插件有 name = "error-logger" 与 configureServer', () =>
    {
        const plugin = errorLoggerPlugin();

        expect(plugin.name).toBe('error-logger');
        expect(typeof plugin.configureServer).toBe('function');
    });

    it('★ configureServer 会用默认 endpoint "/api/log" 注册中间件', () =>
    {
        const { used, server } = makeServer(root);

        errorLoggerPlugin().configureServer!(server as never);

        expect(used.length).toBe(1);
        expect(used[0].path).toBe('/api/log');
        expect(typeof used[0].handler).toBe('function');
    });

    it('★ endpoint 选项会换掉注册路径', () =>
    {
        const { used, server } = makeServer(root);

        errorLoggerPlugin({ endpoint: '/custom/log' }).configureServer!(server as never);

        expect(used[0].path).toBe('/custom/log');
    });

    it('★★ 非 POST 请求 → 405 + "Method Not Allowed"，且不写文件', () =>
    {
        const { used, server } = makeServer(root);
        errorLoggerPlugin().configureServer!(server as never);

        const { req, res } = makeReqRes('GET');
        used[0].handler(req, res);

        expect(res.statusCode).toBe(405);
        expect(res.endedWith).toBe('Method Not Allowed');
        expect(existsSync(join(root, 'logs'))).toBe(false);
    });

    it('★ POST 合法 JSON → 在默认 logs 目录下写出 frontend_*.log', () =>
    {
        const { used, server } = makeServer(root);
        errorLoggerPlugin().configureServer!(server as never);

        const { req, res, send } = makeReqRes('POST', {
            clientId: 'client_1700000000000',
            level: 'error',
            message: 'something failed',
            timestamp: 1700000000000,
        });

        used[0].handler(req, res);
        send();

        const logDir = join(root, 'logs');

        expect(existsSync(logDir)).toBe(true);
        const files = readdirSync(logDir).filter((f) => f.startsWith('frontend_') && f.endsWith('.log'));

        expect(files.length).toBeGreaterThan(0);
    });

    it('★ logDir 选项为相对路径时，相对于 vite root 解析', () =>
    {
        const { used, server } = makeServer(root);
        errorLoggerPlugin({ logDir: 'my-logs' }).configureServer!(server as never);

        const { req, res, send } = makeReqRes('POST', { clientId: 'client_1700000000000', message: 'x', timestamp: 1 });
        used[0].handler(req, res);
        send();

        expect(existsSync(join(root, 'my-logs'))).toBe(true);
    });

    it('★ logDir 选项为绝对路径时原样使用', () =>
    {
        const absDir = join(root, 'abs-logs');
        const { used, server } = makeServer(join(root, 'this-is-ignored'));
        errorLoggerPlugin({ logDir: absDir }).configureServer!(server as never);

        const { req, res, send } = makeReqRes('POST', { clientId: 'client_1700000000000', message: 'x', timestamp: 1 });
        used[0].handler(req, res);
        send();

        expect(existsSync(absDir)).toBe(true);
    });

    it('非法 JSON 的 POST 不会让中间件抛异常', () =>
    {
        const { used, server } = makeServer(root);
        errorLoggerPlugin().configureServer!(server as never);

        const listeners: Record<string, ((arg?: unknown) => void)[]> = {};
        const req = {
            method: 'POST',
            on(event: string, cb: (arg?: unknown) => void) { (listeners[event] ??= []).push(cb); },
        };
        const res = { statusCode: 200, end() { /* noop */ } };

        used[0].handler(req, res);
        for (const cb of listeners.data ?? []) cb(Buffer.from('这不是 JSON'));
        expect(() => { for (const cb of listeners.end ?? []) cb(); }).not.toThrow();
    });

    it('多次调用 errorLoggerPlugin 互不影响（每次返回独立插件）', () =>
    {
        const a = errorLoggerPlugin();
        const b = errorLoggerPlugin({ endpoint: '/b' });

        expect(a).not.toBe(b);
        expect(a.name).toBe('error-logger');
        expect(b.name).toBe('error-logger');
    });
});
