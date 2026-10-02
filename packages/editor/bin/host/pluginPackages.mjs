import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Service } from '@deepseek-ai/cordis';

/**
 * 插件包目录（#276 任务 4 的**宿主半**）：产出"要装哪些插件包"的**入口图**。
 *
 * ## 三层来源（#272 P3 的"完整三层叠加"）
 *
 * 层序 **内置 < 插件 < 用户**，与编辑器插件清单（`src/plugins/layers.ts` 的 `PluginLayer`）
 * 和宿主配置（`hostConfig.mjs` 的"内置 → 项目 → 用户"）是**同一套**。
 *
 * 一条要害：**层由来源方（宿主）判定，并随入口图下发给页面**。页面没有资格猜
 * ——#272 P3 之前它把宿主给的一切硬编码成 `plugin` 层，于是宿主侧的多来源优先级到了页面就消失：
 * 两个来源给出的插件若贡献同一个 id，本该是"上层赢 + 留痕"，实际却变成**同层冲突**。
 *
 * | 层 | 宿主侧来源 | 它回答什么问题 |
 * |---|---|---|
 * | `builtin` | `--builtin-plugins <文件>`（缺省无） | "**随编辑器发布**的插件"——用户项目改不动它。页面侧对应的是 `src/plugins/builtin.ts` 那份界面插件清单；宿主侧目前没有内置插件（宿主自带的能力是**服务**，不是插件），所以这层缺省为空，但**位置与层序都已就位**（判据用 `--builtin-plugins` 注入来验，见 `scripts/check-editor-boot.mjs`） |
 * | `plugin` | ① `<静态根>/plugins/<名字>/` **目录约定**<br>② `<静态根>/editor.plugins.json`（**显式**） | "**这个产物/项目**装了哪些插件"。同一个 id 两边都声明时**显式赢**（既有的"约定 < 显式"） |
 * | `user` | `--plugins <文件>` | "**这台机器的这个用户**要覆盖什么"。最上层：同一个 id 它赢，并**留痕**（`shadowed` 里能查到被它盖住的下层来源） |
 *
 * > ⚠️ **一处行为变更**（#272 P3）：`--plugins` 过去是"**替换**配置路径"，现在是"**叠加**用户层"。
 * > 于是"用 `--plugins` 指定一份配置"不再能屏蔽产物里那份；要屏蔽就把它写成同 id 的上层声明。
 * > 这正是三层叠加的语义（层是叠加，不是二选一），且既有用法（只写自己那份）照常生效。
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
    /** 插件配置文件的绝对路径（`plugin` 层的显式那份；不存在即"只有目录约定"） */
    configPath;

    /** 目录约定的基准目录（`plugin` 层的第一份来源） */
    pluginsDir;

    /** 内置层的配置文件路径（缺省 `undefined` ＝ 这一层为空） */
    builtinPath;

    /** 用户层的配置文件路径（`--plugins`；缺省 `undefined` ＝ 没叠用户层） */
    userConfigPath;

    /** 已解析的条目（喂给 Web 端装载器的入口图） */
    entries = [];

    /** 被丢掉的条目与原因（诊断） */
    problems = [];

    /** 是否已经读过配置（幂等） */
    loaded = false;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ configPath: string, pluginsDir?: string, builtinPath?: string, userConfigPath?: string, hostDescription?: string }} config 配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'pluginPackages');

        this.configPath = config.configPath;
        this.pluginsDir = config.pluginsDir ?? join(dirname(config.configPath), 'plugins');
        this.builtinPath = config.builtinPath;
        this.userConfigPath = config.userConfigPath;
        this.hostDescription = config.hostDescription ?? 'feng3d-editor host';
    }

    /** 宿主自述（写进入口图，便于在页面上看出"是谁装的插件"） */
    hostDescription;

    /**
     * 读三层配置（幂等：读过就不再读）。
     *
     * @returns {{ entries: number, problems: readonly string[] }} 结果计数与问题
     */
    load()
    {
        if (this.loaded) return { entries: this.entries.length, problems: this.problems };

        this.loaded = true;

        // **低层在前**：同一个 id 出现多次时，后面的（更上层的）赢
        const sources = [
            { layer: 'builtin', origin: this.builtinPath, items: readEntries(this.builtinPath, this.problems) },
            { layer: 'plugin', origin: `目录约定 ${this.pluginsDir}`, items: this.scanDirectory() },
            { layer: 'plugin', origin: this.configPath, items: readEntries(this.configPath, this.problems) },
            { layer: 'user', origin: this.userConfigPath, items: readEntries(this.userConfigPath, this.problems) },
        ];

        /** id → 赢家（`shadowed` 里记着被它盖住的下层来源） */
        const winners = new Map();

        for (const source of sources)
        {
            for (const item of source.items)
            {
                if (typeof item?.id !== 'string' || item.id.length === 0)
                {
                    this.problems.push(`有一条插件配置缺少 id（来自 ${source.origin ?? '未提供的内置层'}）`);

                    continue;
                }

                const previous = winners.get(item.id);

                if (!previous)
                {
                    winners.set(item.id, { item, layer: source.layer, origin: source.origin, shadowed: [] });

                    continue;
                }

                // **上层赢**；同层内也是后者赢 —— 目录约定排在显式文件之前，
                // 所以"同 id 时显式赢"这条既有行为自然成立，不必单独写一条规则
                if (LAYER_ORDER[source.layer] >= LAYER_ORDER[previous.layer])
                {
                    winners.set(item.id, {
                        item,
                        layer: source.layer,
                        origin: source.origin,
                        shadowed: [...previous.shadowed, `${previous.layer}:${previous.origin}`],
                    });
                }
                else
                {
                    previous.shadowed.push(`${source.layer}:${source.origin}`);
                }
            }
        }

        for (const [id, winner] of winners)
        {
            const problem = this.checkEntry(winner.item);

            if (problem)
            {
                this.problems.push(problem);

                continue;
            }

            this.entries.push({
                id,
                clientSpecifier: winner.item.clientUrl,
                apiVersion: winner.item.apiVersion,
                halves: winner.item.halves,
                // 宿主半（#272 P3）：**相对静态根**的一个 ESM 模块文件。宿主启动时会 import 它
                // 并装进 cordis 树；没有它就只有界面半（页面插件）
                hostModule: winner.item.hostModule,
                // runtime 端（#277）：**相对项目根**的模块文件；发布时按启用状态打进产物。
                // 没给就按包名解析（`import '<id>'`，需要它真的是个能解析的包）
                runtimeModule: winner.item.runtimeModule,
                // 启用状态（#277）：显式 `false` 才是不启用——缺省视为启用
                enabled: winner.item.enabled !== false,
                // **层身份**：页面按它登记清单，于是跨层同名贡献点是"上层赢 + 留痕"
                // 而不是同层冲突。它由来源方判定，页面只消费
                layer: winner.layer,
                // 被这个条目盖住的下层声明（"看不到它，但查得到"——与页面的 `overriddenBy` 同理）
                shadowed: winner.shadowed,
            });
        }

        return { entries: this.entries.length, problems: this.problems };
    }

    /**
     * 扫描**插件目录约定**（#272 P3）：`<静态根>/plugins/<名字>/` 就是一个插件。
     *
     * 目录里可以放一个 `feng3d-plugin.json` 覆盖缺省值；**什么都不放也能装**（全是缺省）：
     *
     * | 字段 | 缺省 |
     * |---|---|
     * | `id` | `@local/<目录名>` |
     * | `clientUrl` | `/plugins/<目录名>/client.js`（界面半） |
     * | `apiVersion` | `*` |
     * | `halves` | `['client']` |
     * | `hostModule` | `plugins/<目录名>/host.mjs`——**文件真的存在时**才给：没写宿主半的目录就是纯界面插件 |
     *
     * @returns {Array<object>} 目录里发现的插件条目
     */
    scanDirectory()
    {
        const dir = this.pluginsDir;

        if (!existsSync(dir)) return [];

        const found = [];

        for (const entry of readdirSync(dir, { withFileTypes: true }))
        {
            if (!entry.isDirectory()) continue;

            const name = entry.name;
            const manifestPath = join(dir, name, 'feng3d-plugin.json');
            let manifest = {};

            if (existsSync(manifestPath))
            {
                try
                {
                    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
                }
                catch (error)
                {
                    this.problems.push(`插件目录清单不是合法 JSON（${manifestPath}）：${error.message}`);

                    continue;
                }
            }

            const defaultHost = join(dir, name, 'host.mjs');

            found.push({
                id: manifest.id ?? `@local/${name}`,
                clientUrl: manifest.clientUrl ?? `/plugins/${name}/client.js`,
                apiVersion: manifest.apiVersion ?? '*',
                halves: manifest.halves ?? ['client'],
                hostModule: manifest.hostModule
                    ?? (existsSync(defaultHost) ? `plugins/${name}/host.mjs` : undefined),
            });
        }

        return found;
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

        // 宿主半的路径要守住边界（#272 P3）：宿主是 Node 进程，"插件配置"不能变成
        // "任意文件加载"——所以只接受**相对**路径，且不许用 `..` 爬出去。
        // （它的基准是静态根，见 serve.mjs 里的 resolve(options.root, …)）
        if (item.hostModule !== undefined)
        {
            if (typeof item.hostModule !== 'string' || item.hostModule.length === 0)
            {
                return `${item.id} 的 hostModule 必须是非空字符串`;
            }

            if (/^[a-zA-Z]:[\\/]/.test(item.hostModule) || item.hostModule.startsWith('/') || item.hostModule.startsWith('\\'))
            {
                return `${item.id} 的 hostModule 必须是**相对静态根**的路径：${item.hostModule}`;
            }

            if (item.hostModule.split(/[\\/]/).includes('..'))
            {
                return `${item.id} 的 hostModule 不能包含 ..（宿主只装静态根内的模块）：${item.hostModule}`;
            }
        }

        // runtime 端（#277）同理：发布时会被打进**游戏产物**，路径同样不许爬出去
        if (item.runtimeModule !== undefined)
        {
            if (typeof item.runtimeModule !== 'string' || item.runtimeModule.length === 0)
            {
                return `${item.id} 的 runtimeModule 必须是非空字符串`;
            }

            if (/^[a-zA-Z]:[\\/]/.test(item.runtimeModule) || item.runtimeModule.startsWith('/') || item.runtimeModule.startsWith('\\'))
            {
                return `${item.id} 的 runtimeModule 必须是**相对项目根**的路径：${item.runtimeModule}`;
            }

            if (item.runtimeModule.split(/[\\/]/).includes('..'))
            {
                return `${item.id} 的 runtimeModule 不能包含 ..：${item.runtimeModule}`;
            }
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

/**
 * 层序（数字越大越上层）。
 *
 * 与页面侧 `src/plugins/types.ts` 的 `PLUGIN_LAYER_ORDER` 必须一致——
 * 两边不一致的话，"宿主说该赢的那个"到页面会被另一层盖掉，而且**不报错**。
 * 判据见 `scripts/check-editor-boot.mjs`（三层各一条，验入口图里的层与留痕）。
 */
const LAYER_ORDER = { builtin: 0, plugin: 1, user: 2 };

/**
 * 读一份插件配置文件里的条目。
 *
 * 文件不存在（或没给路径）是**正常状态**，返回空数组；解析失败只丢这一层并记进 `problems`。
 *
 * @param {string | undefined} path 配置文件路径
 * @param {string[]} problems 问题收集器
 * @returns {Array<object>} 条目
 */
function readEntries(path, problems)
{
    if (typeof path !== 'string' || path.length === 0) return [];
    if (!existsSync(path)) return [];

    let parsed;

    try
    {
        parsed = JSON.parse(readFileSync(path, 'utf8'));
    }
    catch (error)
    {
        problems.push(`插件配置不是合法 JSON（${path}）：${error.message}`);

        return [];
    }

    return Array.isArray(parsed?.plugins) ? parsed.plugins : [];
}
