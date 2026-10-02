import { Service } from '@deepseek-ai/cordis';

/**
 * 宿主**方法表**（#272 P2/P3 之间的那一块地基）。
 *
 * ## 它解决什么
 *
 * 桥接方法表（`src/bridge/`）跑在**页面里**：调用方投递 → 页面执行 → 回传结果。
 * 但有一类事**页面做不了、也不该做**：
 *
 * - 读写项目目录（宿主才碰得到磁盘）；
 * - 构建 / 发布（要跑 npm）；
 * - 打开 / 关闭项目（宿主的生命周期）。
 *
 * 这些是**宿主方法**。它们必须能"调用方直接调、不经页面"——否则"编辑器关着也能构建项目"
 * 这类需求永远做不到（而这正是 D12 的形态）。
 *
 * ## 命名约定：`host.` 前缀
 *
 * 路由靠前缀自动分流（见 `bridge/relay.mjs`）：`method` 以 `host.` 开头就**宿主直接执行**，
 * 否则照旧投给页面。于是：
 *
 * - 调用方（CLI / MCP / 15 个 `editor-*.mjs`）**零改动**——还是同一个 `POST /call` + `GET /result`；
 * - 不会与页面方法重名（页面方法没有 `host.` 前缀）。
 *
 * ## 纪律
 *
 * - **重名即报错**（不是覆盖）：两个来源抢同一个方法名，静默覆盖会让"谁在响应"变成谜；
 * - **未知方法**的报错里带上可用方法列表——调用方是 AI，它需要能自己纠正。
 */
export class HostMethods extends Service
{
    /** 已注册：`name` → `handler` */
    handlers = new Map();

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     */
    constructor(ctx)
    {
        super(ctx, 'hostMethods');
    }

    /**
     * 注册一个宿主方法。
     *
     * @param {string} name 方法名（约定用 `host.` 前缀）
     * @param {(params: object) => unknown | Promise<unknown>} handler 处理函数
     * @returns {() => void} 退订（注销）
     */
    register(name, handler)
    {
        if (typeof name !== 'string' || name.length === 0) throw new Error('宿主方法名不能为空');

        if (typeof handler !== 'function') throw new Error(`宿主方法 ${name} 的处理函数不是函数`);

        if (this.handlers.has(name)) throw new Error(`宿主方法已注册：${name}`);

        this.handlers.set(name, handler);

        return () => this.handlers.delete(name);
    }

    /**
     * 已注册的方法名（排序，便于报错与诊断时读）。
     *
     * @returns {string[]} 方法名
     */
    get names()
    {
        return [...this.handlers.keys()].sort();
    }

    /**
     * 是否注册了某个方法。
     *
     * @param {string} name 方法名
     * @returns {boolean} 是否可用
     */
    has(name)
    {
        return this.handlers.has(name);
    }

    /**
     * 调一个宿主方法。
     *
     * @param {string} name 方法名
     * @param {object} [params] 参数
     * @returns {Promise<unknown>} 结果
     */
    async invoke(name, params)
    {
        const handler = this.handlers.get(name);

        if (!handler) throw new Error(`未知宿主方法 ${name}；当前可用：${this.names.join(', ') || '（无）'}`);

        return await handler(params ?? {});
    }
}
