import { Service } from '@deepseek-ai/cordis';

/**
 * 宿主侧**插件树**（#272 P3）。
 *
 * ## 它做什么
 *
 * 把插件包（cordis 插件形状：函数 / 类 / `{ apply }` 对象）装进**宿主自己的 cordis 树**，
 * 并支持**卸载**。宿主对插件的意义在这里落地：插件在宿主里挂服务、听事件、起定时器，
 * 而"卸载"必须让这些**真的停下来**——这正是 #272 验收①的字面要求
 *（"装/卸纯服务插件：撤销后监听与定时器确实不再触发"）。
 *
 * ## 为什么"能卸载"要单独做一层
 *
 * cordis 本身已经保证 `fiber.dispose()` 会回收集合里的一切（`ctx.effect` / `ctx.on` /
 * 子 fiber）。但**谁记得住 fiber**？宿主需要一个地方按**插件 id** 记账——装了什么、怎么卸掉、
 * 现在装着哪些。少了这层，宿主就只会"装"不会"卸"（现状：`PluginPackages` 只读配置产出入口图，
 * 根本没有装载能力）。
 *
 * ## 与 Web 端装载器（`src/plugins/loader/`）的关系
 *
 * 两者解决的是**不同端**的同一件事：那一边把插件的**界面半**装进浏览器页面，这一边把
 * **宿主半**装进 Node 进程。它们不共用代码（浏览器端用不了 cordis 的 Node 侧 API），
 * 但共用同一份**契约**：`id` + `apiVersion` + `halves`（见 `src/host/index.ts`）。
 */
export class PluginTree extends Service
{
    /** 已装载：`id` → `{ fiber, plugin }` */
    loaded = new Map();

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     */
    constructor(ctx)
    {
        super(ctx, 'pluginTree');
    }

    /**
     * 装载一个插件。
     *
     * @param {string} id 插件 id（同一 id 不能重复装载——重复装会让"卸载"变成猜谜）
     * @param {object|Function} plugin cordis 插件（函数 / 类 / `{ apply }` 对象）
     * @param {object} [config] 插件配置
     * @returns {object} 插件自己的 fiber（卸载由 `unload(id)` 负责）
     */
    load(id, plugin, config)
    {
        if (this.loaded.has(id)) throw new Error(`插件已装载：${id}`);

        const fiber = this.ctx.plugin(plugin, config);

        this.loaded.set(id, { fiber, plugin });

        return fiber;
    }

    /**
     * 卸载一个插件（它挂的 effect / 监听 / 定时器随之停止）。
     *
     * @param {string} id 插件 id
     * @returns {boolean} 是否卸载了（不存在时 `false`，不抛——"已经卸了"不是错误）
     */
    unload(id)
    {
        const entry = this.loaded.get(id);

        if (!entry) return false;

        entry.fiber.dispose();
        this.loaded.delete(id);

        return true;
    }

    /**
     * 已装载的插件 id 列表。
     *
     * @returns {string[]} id 列表
     */
    get ids()
    {
        return [...this.loaded.keys()];
    }

    /**
     * 是否已装载某个插件。
     *
     * @param {string} id 插件 id
     * @returns {boolean} 是否已装载
     */
    has(id)
    {
        return this.loaded.has(id);
    }

    /**
     * 卸载全部（宿主停机时父 fiber 的 dispose 也会走到这里，但显式调用更清楚）。
     */
    unloadAll()
    {
        for (const id of this.ids) this.unload(id);
    }
}
