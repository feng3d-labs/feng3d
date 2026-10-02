import { createReadStream, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { Service } from '@deepseek-ai/cordis';
import { createBridgeRelay } from '../../bridge/relay.mjs';
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

    /** 桥接中继（与 dev server 同一实现，见 `bridge/relay.mjs`） */
    relay;

    /** 入口图脚本提供者（没有插件时返回空串，见 `pluginPackages.mjs`） */
    bootScript;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ root: string, host: string, port: number, bootScript?: () => string }} config 监听配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'staticServer');

        this.root = config.root;
        this.host = config.host;
        this.port = config.port;
        this.relay = createBridgeRelay();
        this.bootScript = config.bootScript ?? (() => '');
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

            // 关掉 Nagle（Node 的 `server.noDelay` 缺省是 `false`）：小响应不该被攒着发。
            //
            // **别把它当成本机 14ms 的答案**：基线脚本（`scripts/editor-host-io-bench.mjs`）显示
            // 串行下单趟请求要 14ms，我为它加了这一行，**实测没有任何改善**——那 14ms 是别的原因。
            // 这一行按"本来就该这样"留着，不是"已验证的修复"。
            server.noDelay = true;

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

        // HTML 要**注入入口图**（#276 任务 4）：宿主在这里把"要装哪些插件包"交给页面，
        // 页面启动时读 `window.__EDITOR_BOOT__` 并装载（见 src/plugins/loader/boot.ts）。
        // 读进内存再发——HTML 本来就不大，而流式管道没法插入内容。
        if (contentType.startsWith('text/html'))
        {
            try
            {
                res.end(this.injectBoot(readFileSync(filePath, 'utf8')));
            }
            catch (error)
            {
                console.error(`[feng3d-editor] 注入入口图失败 ${filePath}：${error.message}`);
                res.end('');
            }

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
     * 把入口图脚本插进 HTML。
     *
     * 优先插在 `</head>` 之前（脚本要在应用脚本之前执行——`main.ts` 启动时就要读到）；
     * 没有 `</head>` 就退到 `<body` 之前；再没有就原样返回（**不为了注入而破坏文档**）。
     *
     * @param {string} html 原始 HTML
     * @returns {string} 注入后的 HTML（没有插件时原样返回）
     */
    injectBoot(html)
    {
        const script = this.bootScript();

        if (!script) return html;

        const head = /<\/head>/i.exec(html);

        if (head) return `${html.slice(0, head.index)}${script}${html.slice(head.index)}`;

        const body = /<body[^>]*>/i.exec(html);

        if (body) return `${html.slice(0, body.index)}${script}${html.slice(body.index)}`;

        return html;
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
        // **桥接中继优先**（#273 第一阶段）：dev server 与宿主共用同一命令层
        // （`bridge/relay.mjs`）→ 于是**生产产物也有通道**，而 15 个 `scripts/editor-*.mjs`
        // 建立在同一套协议上，零改动即可指向宿主端口。
        if (this.relay.handle(req, res)) return;

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
