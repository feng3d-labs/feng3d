import { spawn } from 'node:child_process';
import { Service } from '@deepseek-ai/cordis';

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
    /** 正在跑的那一次（`null` 表示空闲）：`{ script, child }` */
    running = null;

    /** 输出订阅者 */
    listeners = new Set();

    /** 超时（毫秒）——构建卡死不该让宿主永远挂着 */
    timeoutMs;

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
        const child = spawn('npm', ['run', script], { cwd, shell: process.platform === 'win32' });
        const output = [];

        this.running = { script, child };

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

        this.running = null;

        return { script, code, output };
    }
}
