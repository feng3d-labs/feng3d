import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { Service } from '@deepseek-ai/cordis';
import { MIME_TYPES, isDirectory, isFile, resolveSafePath } from './httpFiles.mjs';

/**
 * 静态资源服务（#272 P0）：把编辑器构建产物（`public/`）跑起来。
 *
 * ## 它从哪来
 *
 * 原来这些代码全在 `bin/serve.mjs` 的模块顶层（`const server = createServer(...)` +
 * `server.listen(...)`）。现在它是宿主的一个 cordis `Service`：
 *
 * - **生命周期交给 context**：`start()` 里用 `this.ctx.effect(...)` 注册"关闭"清理，
 *   于是 `ctx.fiber.dispose()`（宿主停止）会**自动**关掉监听，不需要谁记得手动 close；
 * - **状态用普通字段**（不是 `#field`）：服务代理会让 `this` 变成 Proxy，
 *   JS 私有字段无法透过 Proxy 访问（#276 阶段 2 实测的同一约束）；
 * - 公开方法是**原型方法**（不是箭头属性）：代理在调用时绑定 `this`。
 *
 * ## 它刻意不是什么
 *
 * 不做插件装载、不做桥接 RPC、不做文件系统服务——那些是宿主后续分期的事
 * （见 [NODE_HOST.md](../../docs/NODE_HOST.md) §6 的 P1/P2/P3）。
 * P0 只要"宿主能起、能停、能报版本"。
 */
export class StaticServer extends Service
{
    /** 静态根目录（绝对路径） */
    root;

    /** 监听地址 */
    host;

    /** 期望端口（0 = 由系统分配） */
    port;

    /** 当前监听实例（未启动为 `null`） */
    server = null;

    /** 启动后的访问地址（未启动为 `null`） */
    url = null;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ root: string, host: string, port: number }} config 监听配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'staticServer');

        this.root = config.root;
        this.host = config.host;
        this.port = config.port;
    }

    /**
     * 启动监听（幂等：已启动时直接返回地址）。
     *
     * @returns {Promise<string>} 访问地址（端口为 0 时是系统实际分配的端口）
     * @throws 端口被占用等监听失败时抛出（由入口决定怎么报）
     */
    start()
    {
        if (this.url) return Promise.resolve(this.url);

        return new Promise((resolve, reject) =>
        {
            const server = createServer((req, res) => this.handleRequestSafely(req, res));

            server.once('error', reject);
            server.listen(this.port, this.host, () =>
            {
                server.removeListener('error', reject);

                this.server = server;

                const address = server.address();

                this.url = `http://${this.host}:${address.port}/`;

                // 服务器生命周期 = 一个 effect：context 卸载（宿主停止）即关闭监听。
                // 这是"cordis 接管宿主"最直接的体现——不需要谁记得手动 close。
                this.ctx.effect(() => () => this.close());

                resolve(this.url);
            });
        });
    }

    /**
     * 关闭监听（幂等：未启动或已关闭时是静默无操作）。
     *
     * @returns {Promise<void>} 关闭完成
     */
    close()
    {
        const server = this.server;

        this.server = null;
        this.url = null;

        if (!server) return Promise.resolve();

        return new Promise((resolve) => server.close(() => resolve()));
    }

    /**
     * 处理单个静态资源请求。
     *
     * @param {import('node:http').IncomingMessage} req 请求
     * @param {import('node:http').ServerResponse} res 响应
     */
    handleRequest(req, res)
    {
        if (req.method !== 'GET' && req.method !== 'HEAD')
        {
            res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('只支持 GET / HEAD');

            return;
        }

        let filePath = resolveSafePath(this.root, req.url || '/');

        if (!filePath)
        {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('禁止访问');

            return;
        }

        // 目录请求补 index.html；找不到的文件回落到 index.html（前端路由友好）
        if (isDirectory(filePath)) filePath = join(filePath, 'index.html');
        if (!isFile(filePath)) filePath = join(this.root, 'index.html');

        if (!isFile(filePath))
        {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 未找到');

            return;
        }

        const contentType = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });

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
     * 带兜底的处理入口：请求回调里抛出的异常会直接打挂服务进程
     * （一个请求就能让编辑器下线），所以任何意外都降级成 500。
     *
     * @param {import('node:http').IncomingMessage} req 请求
     * @param {import('node:http').ServerResponse} res 响应
     */
    handleRequestSafely(req, res)
    {
        try
        {
            this.handleRequest(req, res);
        }
        catch (error)
        {
            console.error(`[feng3d-editor] 处理请求失败 ${req.method} ${req.url}：${error.message}`);

            if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 服务器内部错误');
        }
    }
}
