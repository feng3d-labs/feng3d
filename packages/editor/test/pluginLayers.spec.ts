import { beforeEach, describe, expect, it } from 'vitest';
import {
    EDITOR_PLUGIN_API_VERSION,
    getContributionTable,
    getOverrideReport,
    getPanelContributions,
    getPluginStatus,
    getSceneOverlays,
    registerPlugins,
    resetPlugins,
    resetUserPatch,
    setPluginOverride,
} from '../src/plugins';
import type { EditorPluginManifest, PluginLayer } from '../src/plugins';

/**
 * 层叠加（issue #171）：**内置 < 插件 < 用户**，上层赢且覆盖关系可查。
 *
 * 这是"用户覆盖层"的地基——patch 只是往最上层塞一份清单，语义本身在这里。
 */

/** 造一份贡献一个面板的清单 */
function panelManifest(id: string, panelId: string, labelKey: string, layerName: string): EditorPluginManifest
{
    return {
        id,
        name: layerName,
        apiVersion: EDITOR_PLUGIN_API_VERSION,
        contributes: {
            panels: [{ id: panelId, labelKey, view: () => Promise.resolve({}), placement: 'main' }],
        },
    };
}

beforeEach(() =>
{
    resetPlugins();
    resetUserPatch();
});

describe('层序：内置 < 插件 < 用户', () =>
{
    it('同一贡献点被三层覆盖时，最终生效的是最上层', () =>
    {
        registerPlugins([panelManifest('p-builtin', 'scene', 'k.builtin', '内置')], 'builtin');
        registerPlugins([panelManifest('p-plugin', 'scene', 'k.plugin', '插件')], 'plugin');
        registerPlugins([panelManifest('p-user', 'scene', 'k.user', '用户')], 'user');

        const panels = getPanelContributions();

        expect(panels.length).toBe(1);
        expect(panels[0].labelKey).toBe('k.user');
        expect(panels[0].source).toBe('p-user');
        expect(panels[0].layer).toBe('user');
        // "谁被它盖住了"要能查——否则"看到的是哪一层的值"又变成靠猜
        expect(panels[0].overriddenBy).toEqual(['p-plugin', 'p-builtin']);
    });

    it('少写上层时下层照常生效（层不要求每层都写）', () =>
    {
        registerPlugins([panelManifest('p-builtin', 'scene', 'k.builtin', '内置')], 'builtin');
        registerPlugins([panelManifest('p-plugin', 'other', 'k.plugin', '插件')], 'plugin');

        const panels = getPanelContributions();
        const scene = panels.find((panel) => panel.id === 'scene')!;

        expect(panels.length).toBe(2);
        expect(scene.labelKey).toBe('k.builtin');
        expect(scene.layer).toBe('builtin');
        expect(scene.overriddenBy).toEqual([]);
    });

    it('同一个贡献点不因多层而重复出现（赢家只有一条）', () =>
    {
        registerPlugins([panelManifest('p-builtin', 'scene', 'k.builtin', '内置')], 'builtin');
        registerPlugins([panelManifest('p-user', 'scene', 'k.user', '用户')], 'user');

        expect(getPanelContributions().filter((panel) => panel.id === 'scene').length).toBe(1);
    });

    it('浮层同样按层覆盖', () =>
    {
        const overlay = (id: string, order: number): EditorPluginManifest => ({
            id,
            name: id,
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: { sceneOverlays: [{ id: 'o1', view: () => Promise.resolve({}), order }] },
        });

        registerPlugins([overlay('p-builtin', 0)], 'builtin');
        registerPlugins([overlay('p-user', 5)], 'user');

        const overlays = getSceneOverlays();

        expect(overlays.length).toBe(1);
        expect(overlays[0].order).toBe(5);
        expect(overlays[0].source).toBe('p-user');
        expect(overlays[0].overriddenBy).toEqual(['p-builtin']);
    });

    it('层序与启用状态叠加：上层插件被关掉时下层重新生效', () =>
    {
        registerPlugins([panelManifest('p-builtin', 'scene', 'k.builtin', '内置')], 'builtin');
        const userLayer = panelManifest('p-user', 'scene', 'k.user', '用户');
        registerPlugins([userLayer], 'user');

        expect(getPanelContributions()[0].source).toBe('p-user');

        // 直接改覆盖状态（这里不引入设置面板那一层，只验"筛掉上层后下层回来"）
        setPluginOverride('p-user', { enabled: false });

        expect(getPanelContributions()[0].source).toBe('p-builtin');
        expect(getPanelContributions()[0].layer).toBe('builtin');
        expect(getPanelContributions()[0].overriddenBy).toEqual([]);
    });
});

describe('同层冲突仍然是错误', () =>
{
    it('同层两个插件抢同一个 id → 点名双方与层，并拒绝整批', () =>
    {
        registerPlugins([panelManifest('p1', 'scene', 'k1', 'p1')], 'plugin');

        expect(() => registerPlugins([panelManifest('p2', 'scene', 'k2', 'p2')], 'plugin'))
            .toThrow(/panel:scene（plugin 层的 p1 与 p2）/);
        // 事务性：失败不留痕
        expect(getContributionTable().plugins.map((plugin) => plugin.id)).toEqual(['p1']);
    });
});

describe('贡献表自描述当前语义', () =>
{
    it('overridePolicy 是 layered（不再是 reject）', () =>
    {
        expect(getContributionTable().overridePolicy).toBe('layered');
    });

    it('插件条目带所在层，覆盖报告能列出被覆盖的贡献点与插件', () =>
    {
        registerPlugins([panelManifest('p-builtin', 'scene', 'k.builtin', '内置')], 'builtin');
        registerPlugins([panelManifest('p-user', 'scene', 'k.user', '用户')], 'user');
        setPluginOverride('p-user', { name: '我的覆盖层' });

        const table = getContributionTable();
        expect(table.plugins.map((plugin) => plugin.layer)).toEqual(['builtin', 'user']);

        // 生效的名字与清单里的原名都报出来（否则"名字不对"时无从对照）
        const status = getPluginStatus('p-user')!;
        expect(status.name).toBe('我的覆盖层');
        expect(status.manifestName).toBe('用户');

        const report = getOverrideReport();
        expect(report.contributions).toEqual(['panel:scene']);
        expect(report.plugins).toEqual(['p-user']);
    });

    it('各层都登记过的插件数量与层对得上（一层一个）', () =>
    {
        const layers: readonly PluginLayer[] = ['builtin', 'plugin', 'user'];
        layers.forEach((layer, index) => registerPlugins([panelManifest(`p-${layer}`, `panel-${index}`, 'k', layer)], layer));

        expect(getContributionTable().plugins.map((plugin) => `${plugin.id}:${plugin.layer}`))
            .toEqual(['p-builtin:builtin', 'p-plugin:plugin', 'p-user:user']);
    });
});
