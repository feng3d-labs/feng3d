import { getContributionTable } from '../../plugins';

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
 * - `plugins`：已注册插件（id / 名称 / 说明 / 声明的 API 版本 / 各类贡献数量）
 * - `panels` / `sceneOverlays`：每个贡献点**带来源插件 id**（`source`）
 * - `overridePolicy`：同名贡献点当前怎么处理——现在是 `reject`（直接拒绝注册），
 *   分层覆盖由 issue #171 引入。如实报告而不是回一个恒空的"覆盖列表"，
 *   调用方才知道"看到的顺序是不是覆盖后的结果"
 *
 * 输出做过分寸控制：不返回视图 loader（那是函数，dump 出来没意义），只报 id 与元数据。
 */
export function editorPlugins(): unknown
{
    const table = getContributionTable();

    return {
        pluginCount: table.plugins.length,
        panelCount: table.panels.length,
        sceneOverlayCount: table.sceneOverlays.length,
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
        hint: '贡献点按落位与 order 排序；`source` 是贡献它的插件 id。启用/禁用与分层覆盖见 issue #169 / #171。',
    };
}
