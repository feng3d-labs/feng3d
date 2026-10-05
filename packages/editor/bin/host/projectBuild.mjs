import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Service } from '@deepseek-ai/cordis';

/**
 * 终止子进程**及其子进程树**。
 *
 * 为什么要"树"：`spawn` 用了 `shell: true`（Windows 上为了能找到 `npm.cmd`），
 * 于是真正跑构建的是 shell 的**子进程**——只 `child.kill()` 会留下它继续写 `dist/`，
 * 而"取消了却还在跑"是最难查的一类问题。
 *
 * @param {import('node:child_process').ChildProcess} child 子进程
 */
function killTree(child)
{
    if (child.pid === undefined) return;

    if (process.platform === 'win32')
    {
        // `taskkill /T` 杀整棵树、`/F` 强制——Windows 上没有更简单可靠的办法。
        //
        // **不要 `stdio: 'ignore'`**：它失败时是**静默**的——实测踩过：`cancel()` 报"取消成功"、
        // 而构建照旧在跑，5 秒后 `run()` 的 Promise 还没 settle。把输出收下来，失败就报出去。
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: ['ignore', 'pipe', 'pipe'] });
        let said = '';

        killer.stdout?.on('data', (chunk) => { said += chunk; });
        killer.stderr?.on('data', (chunk) => { said += chunk; });
        killer.on('close', (code) =>
        {
            if (code !== 0) console.error(`[build] taskkill 退出码 ${code}：${said.trim()}`);
        });
        killer.on('error', (error) => console.error(`[build] taskkill 起不来：${error.message}`));

        // 兜底：也给 shell 自己发一次（taskkill 失败时至少能停掉它）
        try
        {
            child.kill();
        }
        catch
        {
            // 已经没了
        }

        return;
    }

    // POSIX：`detached` 让子进程成为**进程组首领**，于是 `-pid` 能把整组一起杀掉
    try
    {
        process.kill(-child.pid, 'SIGTERM');
    }
    catch
    {
        // 组不存在（子进程已退出 / 没建成组）时退回单进程 kill
        try
        {
            child.kill('SIGTERM');
        }
        catch
        {
            // 已经没了
        }
    }
}

/**
 * **项目构建服务**（#277 的宿主半：`host.build.*`）。
 *
 * ## 它解决什么
 *
 * D12 的形态是"**游戏项目 = 标准 npm 工程，构建在编辑器中执行**"，而且项目要能
 * **脱离编辑器独立构建**。于是"编辑器**关着**也能构建"不是锦上添花，是这条决策的地基——
 * 而这件事页面做不到（浏览器里没有 npm、没有子进程），只有宿主能做。
 *
 * ## 三条纪律
 *
 * 1. **只跑项目自己的脚本**：约定调 `npm run <script>`（缺省 `build`），**不硬编码构建工具**
 *    ——项目用自己的 vite / rollup / 什么都行（D5：编辑器不替项目决定怎么构建）；
 * 2. **失败如实**：返回 `code`（非 0 就是失败）与输出尾巴，**绝不**"跑挂了还说成功"
 *    （这正是 #271 那三条断链路里"假成功编译"的教训）；
 * 3. **同一项目同时只跑一个**：两个 `npm run build` 一起写同一个 `dist/`，产出是没法解释的
 *    混合体——宁可直接拒绝，并说清"已经有一个在跑"。
 *
 * ## 长任务进度
 *
 * `onOutput(listener)` 逐行上报，宿主把它接成 `{type:'event'}` 推给页面
 * （见 `serve.mjs`）——这就是 `NODE_HOST.md` §6.7「长任务协议」的最小形态：
 * **过程可见**，而不是"点了构建，界面上什么也没有，两分钟后突然成功或失败"。
 */
export class ProjectBuild extends Service
{
    /**
     * 正在跑的那一次（`null` 表示空闲）：`{ taskId, script, child, startedAt, lines }`。
     *
     * `taskId` / `startedAt` / `lines` 是 #273 长任务那一截：
     * 在此之前"在不在跑"只能答是 / 否，现在能答"**哪一次、跑了多久、吐了多少行**"。
     */
    running = null;

    /** 输出订阅者 */
    listeners = new Set();

    /** 超时（毫秒）——构建卡死不该让宿主永远挂着 */
    timeoutMs;

    /**
     * 本次构建是否**被调用方取消**（#273 长任务）。
     *
     * 它只影响"退出码怎么解释"：被取消不是"构建失败"，但也不该报成功——
     * `run()` 会把 `code` 记成 `-2` 并在结果里带 `cancelled: true`，调用方据此区分
     * "项目自己报错"与"我叫停的"。
     */
    cancelling = false;

    /** 输出最多保留多少行（回传给调用方的尾巴） */
    maxOutputLines;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ workspace: object, timeoutMs?: number, maxOutputLines?: number }} config 配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'projectBuild');

        this.workspace = config.workspace;
        this.timeoutMs = config.timeoutMs ?? 300000;
        this.maxOutputLines = config.maxOutputLines ?? 200;
    }

    /** 是否有构建在跑 */
    get isRunning()
    {
        return this.running !== null;
    }

    /**
     * **这次任务长什么样**（#273 长任务：从"在不在跑"扩展成"哪一次、多久、多少行"）。
     *
     * 刻意**不改 `call` 的语义**：仍是"调一次、等结果"，只是查询变丰富了——
     * 于是现有调用方（CLI / MCP / 那 15 个 e2e 脚本）**零改动**。
     *
     * `lines` 是**已收到的总行数**（不是保留的尾巴长度）：构建输出是流式的，
     * 它天然就是"进度"这一维，不必另造百分比。
     *
     * @returns {{ running: boolean, taskId: string|null, script: string|null, startedAt: number|null, elapsedMs: number|null, lines: number }} 状态
     */
    status()
    {
        if (!this.running)
        {
            return { running: false, taskId: null, script: null, startedAt: null, elapsedMs: null, lines: 0 };
        }

        return {
            running: true,
            taskId: this.running.taskId,
            script: this.running.script,
            startedAt: this.running.startedAt,
            elapsedMs: Date.now() - this.running.startedAt,
            lines: this.running.lines,
        };
    }

    /**
     * 订阅构建输出（逐行）。
     *
     * @param {(line: { script: string, line: string }) => void} listener 订阅者
     * @returns {() => void} 退订
     */
    onOutput(listener)
    {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    /**
     * **取消正在跑的构建**（#273 长任务：调用方发起取消）。
     *
     * `run()` 原来只有**超时**能终止子进程——调用方（页面 / CLI / MCP）没有任何办法叫停，
     * 只能等它跑完或等满 5 分钟。长任务协议要的"可取消"就是这条。
     *
     * 注意它是**同步返回**的：`child.kill()` 只是发信号，进程真正结束由 `run()` 的
     * `close` 事件确认——所以调用方要判"真的停了"，应当看 `run()` 的 Promise 何时 settle
     * （门禁就是这么判的）。
     *
     * @returns {{ cancelled: boolean, script?: string }} 有没有真的取消到
     */
    cancel()
    {
        const child = this.running?.child;

        if (!child) return { cancelled: false };

        const script = this.running.script;

        this.cancelling = true;
        killTree(child);

        return { cancelled: true, script };
    }

    /**
     * 跑一次项目脚本。
     *
     * @param {string} [script] 脚本名（缺省 `build`）
     * @returns {Promise<{ script: string, code: number, output: string[] }>} 退出码与输出尾巴
     */
    async run(script = 'build')
    {
        if (!this.workspace?.isOpen) throw new Error('项目未打开（用 --project <目录> 启动宿主）');

        if (this.running) throw new Error(`已有构建在跑（${this.running.script}）：同一项目同时只跑一个`);

        if (typeof script !== 'string' || script.length === 0) throw new Error('脚本名不能为空');

        const cwd = this.workspace.root;
        const child = spawn('npm', ['run', script], {
            cwd,
            shell: process.platform === 'win32',
            // POSIX 下让子进程当**进程组首领**，`cancel()` 才能一次杀掉整棵树
            detached: process.platform !== 'win32',
        });
        const output = [];

        this.cancelling = false;
        // 每次 run 一个新 id：调用方据此判断"我上次问的还是不是这一次"
        // （同一个 id 说明还在跑，换了 id 说明已经翻篇了）。
        this.running = { taskId: randomUUID(), script, child, startedAt: Date.now(), lines: 0 };

        /**
         * 收一行输出：留进尾巴、并报给订阅者（页面靠它看到进度）。
         *
         * @param {Buffer|string} chunk 数据块
         */
        const record = (chunk) =>
        {
            for (const line of String(chunk).split(/\r?\n/))
            {
                if (!line.trim()) continue;

                output.push(line);
                if (output.length > this.maxOutputLines) output.shift();
                // `lines` 是**已收到的总行数**（不是保留的尾巴长度）——它就是"进度"这一维，
                // 而且不用另造一个百分比：构建输出本来就是流式的。
                if (this.running) this.running.lines += 1;

                for (const listener of this.listeners)
                {
                    try
                    {
                        listener({ script, line });
                    }
                    catch (error)
                    {
                        console.error(`[build] 输出订阅者抛错（已忽略）：${error.message}`);
                    }
                }
            }
        };

        child.stdout?.on('data', record);
        child.stderr?.on('data', record);

        const code = await new Promise((resolve) =>
        {
            const timer = setTimeout(() =>
            {
                record(`[build] 超时（${this.timeoutMs}ms），已终止`);

                child.kill();

                resolve(-1);
            }, this.timeoutMs);

            child.on('close', (exitCode) =>
            {
                clearTimeout(timer);
                resolve(exitCode ?? -1);
            });

            child.on('error', (error) =>
            {
                clearTimeout(timer);
                record(`[build] 起不来：${error.message}`);

                resolve(-1);
            });
        });

        const cancelled = this.cancelling;

        this.running = null;
        this.cancelling = false;

        return { script, code: cancelled ? -2 : code, output, cancelled };
    }
}
