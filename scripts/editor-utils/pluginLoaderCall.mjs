/* global window -- 只有 `page.evaluate` 的回调里会用到它（那段代码跑在**页面**里，不是 Node 里） */

/**
 * "在页面里装载/卸载插件包"的调用器（e2e 脚本共用）。
 *
 * ## 为什么要抽出来，又为什么要轮询（两件事一起解决）
 *
 * 原先两个脚本（`editor-plugin-load.mjs` / `editor-mcp-plugin-tools.mjs`）各自写了一份
 * `page.evaluate(async () => { await loader.loadPluginPackage(...) })`，同时踩了两个坑：
 *
 * 1. **长 pending 的 promise 会被 V8 GC**，Playwright 随即报
 *    `Resulting promise was garbage collected` —— CI **随机红**（issue #669：同一 commit
 *    两次 run 一次 fail 一次 pass、重跑又 pass）；
 * 2. **同一段逻辑有两份**，修一处另一处照旧 —— 本仓已经为"同一判据要在**所有执行者**上一致"
 *    付过多次学费（#603 / #604 / #652 都是这一类）。
 *
 * 所以这里既是**唯一实现**，也把等待方式换成了"页面侧启动 + Node 侧轮询"：
 * 每次 `page.evaluate` 都是**短** promise，GC 无从下手。
 */

/** 默认的页面侧结果槽位名 */
const DEFAULT_SLOT = '__feng3dPluginLoadResult';

/** 默认轮询间隔（毫秒） */
const DEFAULT_POLL_INTERVAL_MS = 100;

/** 默认轮询上限（毫秒）——装载本身是秒级，30s 足够宽裕 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * 造一个"在页面里装载/卸载插件包"的调用器。
 *
 * @param {object} options 选项
 * @param {import('playwright').Page} options.page 页面
 * @param {string} options.pluginId 插件包 id（装载时用它拼 `clientSpecifier`）
 * @param {string} [options.slot] 页面侧结果槽位名（多个调用器共用一个页面时要区分开）
 * @param {number} [options.timeoutMs] 轮询上限（毫秒）
 * @param {number} [options.pollIntervalMs] 轮询间隔（毫秒）
 * @returns {{ call: (action: 'loadPluginPackage' | 'unloadPluginPackage') => Promise<object>, pollRounds: () => number }}
 *   调用器；`pollRounds()` 是**方法自证**用的读数（轮询路径没被走到 = 这套修法在空转）
 */
export function createPluginLoaderCaller({
    page,
    pluginId,
    slot = DEFAULT_SLOT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
})
{
    /** 实际走过的轮询轮数（方法自证用） */
    let pollRounds = 0;

    /**
     * 装载或卸载插件包。
     *
     * @param {'loadPluginPackage' | 'unloadPluginPackage'} action 动作
     * @returns {Promise<object>} 结果（装载是 `{loaded, problems}`；卸载是 `{unloaded}`）
     */
    const call = async (action) =>
    {
        // ① **启动**：页面侧不 await 长任务，结果写进槽位；evaluate 立刻返回（短 promise）
        await page.evaluate(({ id, method, key }) =>
        {
            const finish = (ok, value, error) =>
            {
                window[key] = { pending: false, ok, value, error };
            };

            window[key] = { pending: true, ok: false, value: null, error: null };

            void (async () =>
            {
                try
                {
                    const loader = await import('/src/plugins/loader/index.ts');

                    if (method === 'loadPluginPackage')
                    {
                        const outcome = await loader.loadPluginPackage({
                            id,
                            halves: ['host', 'client', 'runtime'],
                            // **浏览器原生 ESM 不解析裸包名**：`import('@feng3d/…')` 在页面里会报
                            // "Failed to resolve module specifier"。所以入口图给出的说明符必须是
                            // **目标环境能解析的** —— dev 下是 vite 的 `/@id/<裸说明符>`
                            //（生产下是构建产物 URL）。这正是"模块表"那一层存在的理由，
                            // 见 packages/editor/src/plugins/loader/moduleTable.ts。
                            clientSpecifier: `/@id/${id}/client`,
                        });

                        finish(true, { loaded: outcome.loaded, problems: [...outcome.problems] }, null);
                    }
                    else
                    {
                        finish(true, { unloaded: loader.unloadPluginPackage(id) }, null);
                    }
                }
                catch (error)
                {
                    finish(false, null, { name: error?.name, message: error?.message, stack: error?.stack });
                }
            })();
        }, { id: pluginId, method: action, key: slot });

        // ② **轮询**取结果（每次 evaluate 都是短 promise）
        const deadline = Date.now() + timeoutMs;

        for (;;)
        {
            pollRounds += 1;

            const state = await page.evaluate((key) => window[key], slot);

            if (state && state.pending === false)
            {
                if (state.ok) return state.value;

                const error = new Error(state.error?.message ?? '页面里装载插件时抛错');

                error.name = state.error?.name ?? 'Error';
                error.stack = state.error?.stack;
                throw error;
            }

            if (Date.now() > deadline)
            {
                throw new Error(`装载超时（${timeoutMs}ms）：页面里的结果槽位 ${slot} 一直没有值`);
            }

            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
    };

    return { call, pollRounds: () => pollRounds };
}
