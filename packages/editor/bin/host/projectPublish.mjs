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
        // 项目构建（`ProjectBuild`）：**publish = 项目构建 + 插件打包**（#277 的决策）——
        // 传进来就串（宿主进程里就是它），不传则只打插件端（门禁的合成项目会用到）
        this.build = config.build ?? null;
        this.outDir = config.outDir ?? 'dist';
        this.outFile = config.outFile ?? 'runtime.js';
    }

    /**
     * 跑一次发布。
     *
     * **默认先跑项目构建**（`config.build`）：决策是「publish = 项目构建 + 插件打包」——
     * 产物目录里既有项目自己的构建输出，又有插件 runtime 端。构建**失败即中止发布并如实报出**
     * （返回 `{ ok: false, stage: 'build', build: { code, output } }`），
     * 绝不"带着半个产物说成功"（#271「编译失败仍弹编译完成」的教训）。
     *
     * @param {{ skipBuild?: boolean, enabledPlugins?: readonly string[] }} [options]
     *   `skipBuild` 只打插件端（离线门禁的合成项目用）；`enabledPlugins` 是**调用方给的启用集**
     *   （#277「开关参与构建」：编辑器里的开关在浏览器 `localStorage`，与宿主读的
     *   `<静态根>/editor.plugins.json` 本是两套——传下来才谈得上"关掉它就不进产物"）
     * @returns {Promise<{ ok: boolean, stage?: string, file: string|null, plugins: string[], skipped: string[], bytes: number, build: object|null }>} 结果
     */
    async run({ skipBuild = false, enabledPlugins } = {})
    {
        if (!this.workspace?.isOpen) throw new Error('项目未打开（用 --project <目录> 启动宿主）');

        // ---- 第一步：项目构建（失败如实中止，不继续打包）----
        let build = null;

        if (!skipBuild && this.build)
        {
            const result = await this.build.run('build');

            build = { script: result.script, code: result.code, ok: result.code === 0, output: result.output };

            if (result.code !== 0)
            {
                return { ok: false, stage: 'build', file: null, plugins: [], skipped: [], bytes: 0, build };
            }
        }

        // **只取启用的、且带 runtime 端的**——未启用的插件连入口都不给它进
        //
        // 判"启用"优先看**调用方传下来的启用集**（#277）：那是编辑器界面里的真实开关；
        // 没传才退回静态配置的 `entry.enabled`。两者都缺就是启用（默认开启）。
        const override = Array.isArray(enabledPlugins) ? new Set(enabledPlugins) : null;
        const enabled = [];
        const skipped = [];

        for (const entry of this.entries())
        {
            if (!Array.isArray(entry.halves) || !entry.halves.includes('runtime')) continue;

            const isEnabled = override ? override.has(entry.id) : entry.enabled !== false;

            if (isEnabled) enabled.push(entry);
            else skipped.push(entry.id);
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
                build,
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
