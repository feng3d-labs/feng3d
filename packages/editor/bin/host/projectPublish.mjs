import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Service } from '@deepseek-ai/cordis';

/**
 * **项目发布**（#277 的核心：按项目启用状态把插件 **runtime 端**打进产物）。
 *
 * ## 它守的是"编辑格式 = 运行格式"（D1）
 *
 * 插件引入的新 `__type__` 必须在**两端都有行为**：编辑器里有 Logic，游戏产物里也得有。
 * 第三端（游戏项目端）**不连 WebSocket、离线运行、只读产物**——所以它的装载方式只能是
 * **构建时打进产物**（已决策 A）。
 *
 * ## 两条硬要求（#277 的验收原话）
 *
 * 1. **按启用状态**：项目没启用的插件，**它的 runtime 端不许出现在产物里**。
 *    这里的做法很直接：**入口里根本不 import 它**——不是"打进去再 tree-shake 掉"，
 *    而是压根不给它进产物的机会；
 * 2. **产物能在无编辑器环境跑**：产物是自包含 ESM（`platform: 'browser'`），
 *    只带引擎依赖，**不含编辑器 API**（`check-runtime-half-deps.mjs` 在源码级守，
 *    这里在**产物级**再守一道）。
 *
 * ## 与"能不能 tree-shake"的关系
 *
 * 两道防线都要：**入口过滤**保证未启用的插件不进产物；**runtime 端零模块级副作用**
 * （R2）保证真进去了也能被消掉。少了任何一道，"未启用不进产物"都可能悄悄失效。
 */
export class ProjectPublish extends Service
{
    /** 发布输出目录（相对项目根） */
    outDir;

    /** 输出文件名 */
    outFile;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ workspace: object, entries?: () => Array<object>, outDir?: string, outFile?: string }} config 配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'projectPublish');

        this.workspace = config.workspace;
        this.entries = config.entries ?? (() => []);
        this.outDir = config.outDir ?? 'dist';
        this.outFile = config.outFile ?? 'runtime.js';
    }

    /**
     * 跑一次发布。
     *
     * @returns {Promise<{ ok: boolean, file: string, plugins: string[], skipped: string[], bytes: number }>} 结果
     */
    async run()
    {
        if (!this.workspace?.isOpen) throw new Error('项目未打开（用 --project <目录> 启动宿主）');

        // **只取启用的、且带 runtime 端的**——未启用的插件连入口都不给它进
        const enabled = [];
        const skipped = [];

        for (const entry of this.entries())
        {
            if (!Array.isArray(entry.halves) || !entry.halves.includes('runtime')) continue;

            if (entry.enabled === false) skipped.push(entry.id);
            else enabled.push(entry);
        }

        if (enabled.length === 0 && skipped.length === 0)
        {
            throw new Error('没有声明 runtime 端的插件（条目要写 halves: [..., "runtime"]）');
        }

        const root = this.workspace.root;
        // 入口**写在项目根里**：于是 esbuild 用项目内的**相对路径**解析插件。
        // （不能把入口放临时目录再用 `file://` URL 指过去——Windows 短路径 `ADMINI~1`
        //   会被 `pathToFileURL` 编码成 `%7E`，esbuild 直接解析不了。实测踩过。）
        const entryPath = join(root, `.feng3d-publish-entry-${process.pid}.ts`);

        try
        {
            // 入口：按启用状态显式 import（**未启用的不出现**，所以"不进产物"是结构保证的）
            writeFileSync(entryPath, this.buildEntry(enabled), 'utf8');

            const outPath = join(root, this.outDir, this.outFile);

            mkdirSync(dirname(outPath), { recursive: true });

            const esbuild = await import('esbuild');

            await esbuild.build({
                entryPoints: [entryPath],
                outfile: outPath,
                bundle: true,
                format: 'esm',
                platform: 'browser',
                target: 'es2022',
                logLevel: 'silent',
            });

            return {
                ok: true,
                file: `${this.outDir}/${this.outFile}`,
                plugins: enabled.map((entry) => entry.id),
                skipped,
                bytes: readFileSync(outPath, 'utf8').length,
            };
        }
        finally
        {
            rmSync(entryPath, { force: true });
        }
    }

    /**
     * 造产物入口：每个启用的插件 import 它的 runtime 端并调用它的 `install`。
     *
     * @param {Array<object>} enabled 启用的插件条目
     * @param {string} root 项目根（解析相对模块用）
     * @returns {string} 入口源码
     */
    buildEntry(enabled)
    {
        const lines = [
            '/** 由编辑器宿主生成（#277）：按项目启用状态把插件 runtime 端打进产物 */',
            '',
        ];

        enabled.forEach((entry, index) =>
        {
            // 相对**项目根**的路径（入口就写在项目根里，所以相对路径最稳、跨平台）
            const specifier = entry.runtimeModule
                ? `./${entry.runtimeModule.replace(/\\/g, '/')}`
                : entry.id;

            lines.push(`import { install as install${index} } from ${JSON.stringify(specifier)};`);
        });

        lines.push('');

        enabled.forEach((_, index) => lines.push(`install${index}();`));

        return `${lines.join('\n')}\n`;
    }
}
