import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { defineComponent } from 'vue';
import { getContributionTable, getPanelContributions, getPlugins, registerPlugins, resetPlugins } from '../src/plugins/registry';
import { BUILTIN_PLUGINS, EDITOR_PLUGIN_API_VERSION, installBuiltinPlugins } from '../src/plugins';
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
    return { id, name: `插件 ${id}`, description: `${id} 的说明`, apiVersion: EDITOR_PLUGIN_API_VERSION, contributes };
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
        // 层叠加是**当前**的语义（内置 < 插件 < 用户，上层赢且覆盖关系可查）
        expect(table.overridePolicy).toBe('layered');
        // 没有 patch 时如实报"没有"，而不是让调用方以为有个空的用户层
        expect(table.userPatch.source).toBe('none');
        expect(table.userPatch.applied).toBe(false);
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
        // 声明了就在表里报出来（API 版本契约要求必填，见 apiVersion.spec.ts）
        expect(entry.apiVersion).toBe(EDITOR_PLUGIN_API_VERSION);
        // 但没声明的字段不该凭空造：`userPatch` 相关的两个可选字段此时不该出现
        expect('patchName' in entry).toBe(false);
        expect('patchEnabled' in entry).toBe(false);
    });

    it('声明了 apiVersion 的插件如实带出来', () =>
    {
        registerPlugins([manifest('p1', { panels: [] })]);

        expect(getContributionTable().plugins[0].apiVersion).toBe(EDITOR_PLUGIN_API_VERSION);
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

    it('视图 loader 与 Logic 类都不进贡献表（dump 出来是函数，没有意义）', () =>
    {
        registerPlugins([manifest('p1', { panels: [{ id: 'a', labelKey: 'k', view: loader('A'), placement: 'main' }] })]);

        // 贡献表是给"看"的：只该有 id / 落位 / 标签键 / 来源这类元数据。
        // Logic 尤其要注意——清单里存的是**类本身**，直接序列化会打出一串压缩后的函数源码
        const table = getContributionTable();

        expect(JSON.stringify(table)).not.toContain('function');
        expect(table.logics).toEqual([]);
    });

    it('Logic 贡献点带类型名与来源，且不带类本身', () =>
    {
        class FakeLogic { protected constructor(data: unknown) { void data; } }

        registerPlugins([{
            id: 'p1',
            name: 'p1',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: { logics: [{ name: 'Fake', logic: FakeLogic }] },
        }]);

        const table = getContributionTable();

        expect(table.logics).toEqual([{ name: 'Fake', source: 'p1', layer: 'plugin', overriddenBy: [] }]);
        expect(table.plugins[0].logics).toBe(1);
    });

    it('属性面板的「类型 → 控件」带控件类名与来源（面板上那个下拉是哪来的）', () =>
    {
        registerPlugins([{
            id: 'p1',
            name: 'p1',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: { objectView: { typeAttributeViews: [{ type: 'Enum', view: { component: 'OAVEnum' } }] } },
        }]);

        const table = getContributionTable();

        expect(table.typeAttributeViews).toEqual([
            { type: 'Enum', component: 'OAVEnum', source: 'p1', layer: 'plugin', overriddenBy: [] },
        ]);
        expect(table.plugins[0].typeAttributeViews).toBe(1);
    });

    it('同一个「类型 → 控件」被同一层的两个插件指派时被拒绝（否则面板上是哪套说不清）', () =>
    {
        registerPlugins([{
            id: 'p1',
            name: 'p1',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: { objectView: { typeAttributeViews: [{ type: 'Enum', view: { component: 'OAVEnum' } }] } },
        }]);

        expect(() => registerPlugins([{
            id: 'p2',
            name: 'p2',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: { objectView: { typeAttributeViews: [{ type: 'Enum', view: { component: 'OtherEnum' } }] } },
        }])).toThrow(/typeAttributeView:Enum（plugin 层的 p1 与 p2）/);
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

    it('文档列出的贡献点 id 与运行时一致（面板 / 浮层 / Logic / 属性控件都要有）', () =>
    {
        installBuiltinPlugins();

        const table = getContributionTable();
        // 文档里用反引号列 id：面板与浮层是贡献点 id，Logic 是 `__type__`，
        // 属性控件是「类型 → 控件」里的类型名与控件名
        const undocumented = [
            ...table.panels.map((panel) => panel.id),
            ...table.sceneOverlays.map((overlay) => overlay.id),
            ...table.logics.map((entry) => entry.name),
            ...table.typeAttributeViews.flatMap((entry) => [entry.type, entry.component]),
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
        for (const entry of table.logics) expect(ids.has(entry.source)).toBe(true);
        for (const entry of table.typeAttributeViews) expect(ids.has(entry.source)).toBe(true);
        expect(table.plugins.length).toBe(BUILTIN_PLUGINS.length);
    });
});
