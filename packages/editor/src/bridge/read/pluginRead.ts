import { getContributionTable, setPluginEnabled } from '../../plugins';

/**
 * 编辑器插件与贡献表（只读）。
 *
 * ## 为什么需要它
 *
 * 插件一旦多起来，「界面上这个东西是哪来的、这个编辑器上装了什么」必须能一条命令查清；
 * 否则插件化只是把不可控从代码挪到了配置里——出了问题只能去读 `MainLayout.vue` 或翻注册代码。
 * DSH 把「可检视」当作插件机制的一部分（`--dump-config` 不启动就能看合成后的配置树），
 * 这里对应的是 `editor.plugins`（issue #168）。
 *
 * ## 返回什么
 *
 * - `plugins`：**全部**已注册插件（含被禁用的——设置面板要靠它开回来），每个带
 *   `enabled` / `required` / `defaultEnabled` / `userSwitch` 与各类贡献数量
 * - `panels` / `sceneOverlays` / `logics` / `typeAttributeViews` / `bridgeMethods`：
 *   **启用插件**的贡献点，每个都带来源插件 id（`source`）
 * - `overridePolicy`：同名贡献点当前怎么处理——现在是 `reject`（直接拒绝注册），
 *   分层覆盖由 issue #171 引入。如实报告而不是回一个恒空的"覆盖列表"，
 *   调用方才知道"看到的顺序是不是覆盖后的结果"
 *
 * 输出做过分寸控制：不返回视图 loader、也不返回 Logic **类本身**——都是函数，
 * dump 出来是一串压缩源码；只报名字与来源（`test/pluginTable.spec.ts` 有守门用例）。
 */
export function editorPlugins(): unknown
{
    const table = getContributionTable();

    return {
        pluginCount: table.plugins.length,
        enabledPluginCount: table.plugins.filter((plugin) => plugin.enabled).length,
        panelCount: table.panels.length,
        sceneOverlayCount: table.sceneOverlays.length,
        logicCount: table.logics.length,
        typeAttributeViewCount: table.typeAttributeViews.length,
        bridgeMethodCount: table.bridgeMethods.length,
        overridePolicy: table.overridePolicy,
        plugins: table.plugins,
        // 面板给出落位与 i18n 键：排查"为什么某个面板不在界面上"时要看这两样
        panels: table.panels.map((panel) => ({
            id: panel.id,
            source: panel.source,
            placement: panel.placement,
            labelKey: panel.labelKey,
            ...(panel.order === undefined ? {} : { order: panel.order }),
        })),
        sceneOverlays: table.sceneOverlays.map((overlay) => ({
            id: overlay.id,
            source: overlay.source,
            ...(overlay.order === undefined ? {} : { order: overlay.order }),
        })),
        // Logic / 属性控件 / 桥接方法都是扁平表（无落位、无顺序语义），原样给出即可
        logics: table.logics,
        typeAttributeViews: table.typeAttributeViews,
        bridgeMethods: table.bridgeMethods,
        hint: '贡献点按落位与 order 排序；`source` 是贡献它的插件 id。'
            + '被禁用的插件也会出现在 plugins 里（enabled=false），但它的贡献点不在下面各表里；'
            + '开关用 `editor.setPlugin`。分层覆盖见 issue #171。',
    };
}

/**
 * 启用/禁用一个插件（issue #169）。
 *
 * 只改**编辑器状态**与引擎侧的贡献点注册，不碰场景数据，因此和 `selection.set` 一样
 * 走只读通道（不受「AI 写能力」开关约束）。
 *
 * @param params `{ id: string, enabled: boolean }`
 * @returns `{ id, enabled, required }`：实际生效的状态；插件不存在时抛出
 * @throws 插件不存在或参数不合法时抛出（错误信息里列出可用 id——否则调用方只能靠猜）
 */
export function editorSetPlugin(params: Record<string, unknown>): unknown
{
    const id = params.id;
    if (typeof id !== 'string' || id.length === 0) throw new Error('需要参数 id（插件 id，见 editor.plugins）');
    if (typeof params.enabled !== 'boolean') throw new Error('需要参数 enabled（true / false）');

    const after = setPluginEnabled(id, params.enabled);
    if (after === null)
    {
        const available = getContributionTable().plugins.map((plugin) => plugin.id);

        throw new Error(`没有这个插件：${id}；可用：${available.join(', ')}`);
    }

    return {
        id,
        enabled: after,
        // 必需插件拒绝关闭时如实说明，免得调用方以为自己的请求"静默失效"了
        required: after === true && params.enabled === false,
    };
}
