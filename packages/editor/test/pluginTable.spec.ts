import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { defineComponent } from 'vue';
import { getContributionTable, getPanelContributions, getPlugins, registerPlugins, resetPlugins } from '../src/plugins/registry';
import { BUILTIN_PLUGINS, installBuiltinPlugins } from '../src/plugins';
import type { EditorPluginManifest, PanelViewLoader } from '../src/plugins';

/**
 * 贡献表（issue #168）。
 *
 * 被测的是「可检视」这件事：装了哪些插件、每个贡献点来自哪个插件，都必须能一条命令查到——
 * 插件一多，"界面上这个东西是哪来的"如果查不到，插件化只是把不可控从代码挪到了配置里。
 */

/** 造一个最小的视图 loader */
function loader(name: string): PanelViewLoader
{
    return () => Promise.resolve({ default: defineComponent({ name }) });
}

/** 造一份最小清单 */
function manifest(id: string, contributes: EditorPluginManifest['contributes']): EditorPluginManifest
{
    return { id, name: `插件 ${id}`, description: `${id} 的说明`, contributes };
}

beforeEach(() =>
{
    resetPlugins();
});

describe('插件贡献表', () =>
{
    it('空注册表也能安全 dump', () =>
    {
        const table = getContributionTable();

        expect(table.plugins).toEqual([]);
        expect(table.panels).toEqual([]);
        expect(table.sceneOverlays).toEqual([]);
        expect(table.overridePolicy).toBe('reject');
    });

    it('每个贡献点都带来源插件（"是哪来的"要能查）', () =>
    {
        registerPlugins([
            manifest('p1', { panels: [{ id: 'a', labelKey: 'k.a', view: loader('A'), placement: 'main' }] }),
            manifest('p2', {
                panels: [{ id: 'b', labelKey: 'k.b', view: loader('B'), placement: 'bottom' }],
                sceneOverlays: [{ id: 'o1', view: loader('O') }],
            }),
        ]);

        const table = getContributionTable();

        expect(table.panels.map((panel) => [panel.id, panel.source])).toEqual([['a', 'p1'], ['b', 'p2']]);
        expect(table.sceneOverlays.map((overlay) => [overlay.id, overlay.source])).toEqual([['o1', 'p2']]);
    });

    it('插件条目带说明与各类贡献的数量', () =>
    {
        registerPlugins([
            manifest('p1', {
                panels: [
                    { id: 'a', labelKey: 'k', view: loader('A'), placement: 'main' },
                    { id: 'b', labelKey: 'k', view: loader('B'), placement: 'bottom' },
                ],
                sceneOverlays: [{ id: 'o1', view: loader('O') }],
            }),
        ]);

        const entry = getContributionTable().plugins[0];

        expect(entry).toMatchObject({ id: 'p1', name: '插件 p1', description: 'p1 的说明', panels: 2, sceneOverlays: 1 });
        // 没声明 apiVersion 就不该凭空造一个字段出来
        expect('apiVersion' in entry).toBe(false);
    });

    it('声明了 apiVersion 的插件如实带出来', () =>
    {
        registerPlugins([{
            id: 'p1',
            name: 'p1',
            apiVersion: '1.2.0',
            contributes: { panels: [{ id: 'a', labelKey: 'k', view: loader('A'), placement: 'main' }] },
        }]);

        expect(getContributionTable().plugins[0].apiVersion).toBe('1.2.0');
    });

    it('贡献表里的 panels 顺序与 getPanelContributions 一致（同一套排序）', () =>
    {
        registerPlugins([
            manifest('p1', {
                panels: [
                    { id: 'bottom-panel', labelKey: 'k', view: loader('X'), placement: 'bottom' },
                    { id: 'hierarchy-panel', labelKey: 'k', view: loader('Y'), placement: 'hierarchy' },
                ],
            }),
        ]);

        expect(getContributionTable().panels.map((panel) => panel.id))
            .toEqual(getPanelContributions().map((panel) => panel.id));
    });

    it('视图 loader 不进贡献表（dump 出来是函数，没有意义）', () =>
    {
        registerPlugins([manifest('p1', { panels: [{ id: 'a', labelKey: 'k', view: loader('A'), placement: 'main' }] })]);

        // 贡献表是给"看"的：只该有 id / 落位 / 标签键 / 来源这类元数据
        expect(JSON.stringify(getContributionTable())).not.toContain('function');
    });
});

describe('内置插件在文档里如实登记（CI 门禁）', () =>
{
    const doc = readFileSync(new URL('../docs/PLUGINS.md', import.meta.url), 'utf8');

    it('文档列出的内置插件 id 与运行时一致', () =>
    {
        // 文档的「内置插件」表里列出了插件 id（形如 `@feng3d/editor-plugin-xxx`）；
        // 漏登记或者写错，读文档的人就以为没有这个插件——所以逐条核对
        const documented = new Set([...doc.matchAll(/`(@feng3d\/editor-plugin-[a-z-]+)`/g)].map((match) => match[1]));
        const actual = new Set(BUILTIN_PLUGINS.map((plugin) => plugin.id));

        expect([...actual].filter((id) => !documented.has(id)), '文档里没登记的插件').toEqual([]);
        expect([...documented].filter((id) => !actual.has(id)), '文档里登记了但运行时没有的插件').toEqual([]);
    });

    it('文档列出的贡献点 id 与运行时一致（面板与浮层都要有）', () =>
    {
        installBuiltinPlugins();

        const table = getContributionTable();
        // 文档里用反引号列 id，例如 `hierarchy`、`particleEffectController`
        const undocumented = [
            ...table.panels.map((panel) => panel.id),
            ...table.sceneOverlays.map((overlay) => overlay.id),
        ].filter((id) => !doc.includes(`\`${id}\``));

        expect(undocumented, '文档里没提到的贡献点').toEqual([]);
    });

    it('安装内置插件后每个贡献点都有来源（没有"无主"的东西）', () =>
    {
        installBuiltinPlugins();

        const table = getContributionTable();
        const ids = new Set(getPlugins().map((plugin) => plugin.id));

        for (const panel of table.panels) expect(ids.has(panel.source)).toBe(true);
        for (const overlay of table.sceneOverlays) expect(ids.has(overlay.source)).toBe(true);
        expect(table.plugins.length).toBe(BUILTIN_PLUGINS.length);
    });
});
