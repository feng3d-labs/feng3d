import { existsSync, readFileSync } from 'node:fs';
import { Service } from '@deepseek-ai/cordis';

/**
 * 插件包目录（#276 任务 4 的**宿主半**）：产出"要装哪些插件包"的**入口图**。
 *
 * ## 它读什么
 *
 * 默认读静态根目录下的 `editor.plugins.json`（**本地、不入库**，与 `editor.patch.json` 同一惯例）：
 *
 * ```jsonc
 * {
 *     "plugins": [
 *         { "id": "@feng3d/editor-plugin-rotate", "clientUrl": "/plugins/rotate.js",
 *           "apiVersion": "^1.0.0", "halves": ["client"] }
 *     ]
 * }
 * ```
 *
 * 没有这个文件是**正常状态**（没装任何插件的编辑器与以前完全一样）。
 *
 * ## 一条硬判据：`clientUrl` 必须是**能解析的说明符**
 *
 * 浏览器原生 ESM **不解析裸包名**（#276 阶段 4 实测 `Failed to resolve module specifier`）：
 * 构建期能解析、运行期不能。所以这里**拒绝裸包名**——要求 `/xxx.js`、`./xxx.js` 或 `http(s)://...`。
 * 把踩过的坑写成机器判据，比写在文档里等下次再踩一遍强。
 *
 * ## 它不吃配置里的坏东西
 *
 * 一条条目坏掉只丢那一条（并记进 `problems`），其余照常装——与"坏 patch 不拖垮编辑器"同一纪律。
 */
export class PluginPackages extends Service
{
    /** 插件配置文件的绝对路径（不存在即"没有插件"） */
    configPath;

    /** 已解析的条目（喂给 Web 端装载器的入口图） */
    entries = [];

    /** 被丢掉的条目与原因（诊断） */
    problems = [];

    /** 是否已经读过配置（幂等） */
    loaded = false;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ configPath: string, hostDescription?: string }} config 配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'pluginPackages');

        this.configPath = config.configPath;
        this.hostDescription = config.hostDescription ?? 'feng3d-editor host';
    }

    /** 宿主自述（写进入口图，便于在页面上看出"是谁装的插件"） */
    hostDescription;

    /**
     * 读配置（幂等：读过就不再读）。
     *
     * @returns {{ entries: number, problems: readonly string[] }} 结果计数与问题
     */
    load()
    {
        if (this.loaded) return { entries: this.entries.length, problems: this.problems };

        this.loaded = true;

        if (!existsSync(this.configPath)) return { entries: 0, problems: [] };

        let parsed;

        try
        {
            parsed = JSON.parse(readFileSync(this.configPath, 'utf8'));
        }
        catch (error)
        {
            this.problems.push(`插件配置不是合法 JSON（${this.configPath}）：${error.message}`);

            return { entries: 0, problems: this.problems };
        }

        const list = Array.isArray(parsed?.plugins) ? parsed.plugins : [];

        for (const item of list)
        {
            const problem = this.checkEntry(item);

            if (problem)
            {
                this.problems.push(problem);

                continue;
            }

            this.entries.push({
                id: item.id,
                clientSpecifier: item.clientUrl,
                apiVersion: item.apiVersion,
                halves: item.halves,
            });
        }

        return { entries: this.entries.length, problems: this.problems };
    }

    /**
     * 校验一条插件配置。
     *
     * @param {object} item 配置项
     * @returns {string | null} 问题说明；合法时为 `null`
     */
    checkEntry(item)
    {
        if (typeof item?.id !== 'string' || item.id.length === 0) return '有一条插件配置缺少 id';

        if (typeof item.clientUrl !== 'string' || item.clientUrl.length === 0)
        {
            return `${item.id} 缺少 clientUrl（界面半的模块地址）`;
        }

        const url = item.clientUrl;

        // 裸包名在浏览器里解析不了：构建期能解析、运行期不能（#276 阶段 4 实测）
        if (!url.startsWith('/') && !url.startsWith('./') && !url.startsWith('../') && !/^https?:\/\//.test(url))
        {
            return `${item.id} 的 clientUrl（${url}）不是能解析的地址：`
                + '浏览器原生 ESM 不解析裸包名，请给 `/plugins/xxx.js` 这样的产物地址或 http(s) URL';
        }

        if (item.halves !== undefined && (!Array.isArray(item.halves) || !item.halves.includes('client')))
        {
            return `${item.id} 声明里没有 client 端——它不贡献界面，不能按界面插件装载`;
        }

        return null;
    }

    /**
     * 入口图（注入给 Web 端的就是它）。
     *
     * @returns {{ entries: readonly object[], appliedBy: string }} 入口图
     */
    get graph()
    {
        return { entries: this.entries, appliedBy: `${this.hostDescription} / ${this.configPath}` };
    }

    /**
     * 注入用的 `<script>` 片段（没有插件时是空串——**不注入空脚本**）。
     *
     * JSON 里的 `<` 要转义成 `\u003c`，否则内容里的 `</script>` 会提前结束脚本块。
     *
     * @returns {string} 待插进 `<head>` 的脚本片段
     */
    bootScript()
    {
        if (this.entries.length === 0) return '';

        const json = JSON.stringify(this.graph).replace(/</g, '\\u003c');

        return `    <script>window.__EDITOR_BOOT__ = ${json};</script>\n`;
    }
}
