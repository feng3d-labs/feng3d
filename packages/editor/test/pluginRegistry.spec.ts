import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import {
    getPanelContributions,
    getPanelContributionsAt,
    getPlugins,
    getSceneOverlays,
    registerPlugins,
    resetPlugins,
} from '../src/plugins/registry';
import { BUILTIN_PLUGINS, installBuiltinPlugins } from '../src/plugins';
import type { EditorPluginManifest, PanelViewLoader } from '../src/plugins';

/**
 * 插件注册表（issue #167）。
 *
 * 测的是「核心只认注册表」这件事：面板与场景浮层都从贡献表查出来，
 * 所以新增面板不必改 `MainLayout.vue` / `SceneView.vue`。
 *
 * 用例里用**合成清单**而不是内置清单：被测的是注册表语义（去重、冲突、排序、落位），
 * 与"内置了哪些面板"无关——后者由最后两个用例单独盯。
 */

/** 造一个最小的视图 loader（清单里存的是 loader，不是组件本身） */
function loader(name: string): PanelViewLoader
{
    return () => Promise.resolve({ default: defineComponent({ name }) });
}

/** 造一份最小清单 */
function manifest(id: string, contributes: EditorPluginManifest['contributes']): EditorPluginManifest
{
    return { id, name: id, contributes };
}

beforeEach(() =>
{
    resetPlugins();
});

describe('插件注册表', () =>
{
    it('import 清单本身不注册任何东西（声明与注册分离，对齐 R2）', () =>
    {
        // 这条是机制的核心：内置清单是真数据，import 它不该有副作用
        expect(BUILTIN_PLUGINS.length).toBeGreaterThan(0);
        expect(getPlugins()).toEqual([]);
        expect(getPanelContributions()).toEqual([]);
    });

    it('注册后可查到面板、落位与视图 loader', () =>
    {
        registerPlugins([
            manifest('p1', {
                panels: [
                    { id: 'a', labelKey: 'k.a', view: loader('A'), placement: 'hierarchy' },
                    { id: 'b', labelKey: 'k.b', view: loader('B'), placement: 'bottom' },
                ],
            }),
        ]);

        expect(getPanelContributions().map((panel) => panel.id)).toEqual(['a', 'b']);
        expect(getPanelContributionsAt('hierarchy').map((panel) => panel.id)).toEqual(['a']);
        expect(getPanelContributionsAt('bottom').map((panel) => panel.id)).toEqual(['b']);
        expect(getPanelContributionsAt('main')).toEqual([]);
        expect(typeof getPanelContributions()[0].view).toBe('function');
    });

    it('扁平列表先按落位分组再按 order（+ 菜单顺序不随注册顺序漂移）', () =>
    {
        registerPlugins([
            manifest('p1', {
                panels: [
                    { id: 'late', labelKey: 'k', view: loader('L'), placement: 'project', order: 10 },
                    { id: 'first', labelKey: 'k', view: loader('F'), placement: 'project', order: 0 },
                    { id: 'inspector-panel', labelKey: 'k', view: loader('I'), placement: 'bottom' },
                    { id: 'hierarchy-panel', labelKey: 'k', view: loader('H'), placement: 'hierarchy' },
                ],
            }),
        ]);

        // 落位顺序固定为 hierarchy → main → project → bottom，与注册顺序无关
        expect(getPanelContributions().map((panel) => panel.id))
            .toEqual(['hierarchy-panel', 'first', 'late', 'inspector-panel']);
    });

    it('两个插件贡献同名面板时抛出（冲突必须启动就报，不能静默互相覆盖）', () =>
    {
        registerPlugins([manifest('p1', { panels: [{ id: 'scene', labelKey: 'k', view: loader('A'), placement: 'main' }] })]);

        expect(() => registerPlugins([
            manifest('p2', { panels: [{ id: 'scene', labelKey: 'k', view: loader('B'), placement: 'main' }] }),
        ])).toThrow(/贡献点 id 冲突.*panel:scene/);
    });

    it('同一插件重复注册是幂等的（开发期热替换不会重复贡献）', () =>
    {
        const plugin = manifest('p1', { panels: [{ id: 'a', labelKey: 'k', view: loader('A'), placement: 'main' }] });

        registerPlugins([plugin]);
        registerPlugins([plugin]);

        expect(getPlugins().length).toBe(1);
        expect(getPanelContributions().length).toBe(1);
    });

    it('场景浮层单独可查，并按 order 排序', () =>
    {
        registerPlugins([
            manifest('p1', {
                sceneOverlays: [
                    { id: 'top', view: loader('T'), order: 1 },
                    { id: 'bottom', view: loader('B'), order: 0 },
                ],
            }),
        ]);

        expect(getSceneOverlays().map((overlay) => overlay.id)).toEqual(['bottom', 'top']);
    });

    it('浮层 id 冲突同样被拒绝', () =>
    {
        registerPlugins([manifest('p1', { sceneOverlays: [{ id: 'x', view: loader('A') }] })]);

        expect(() => registerPlugins([manifest('p2', { sceneOverlays: [{ id: 'x', view: loader('B') }] })]))
            .toThrow(/sceneOverlay:x/);
    });
});

describe('内置插件清单', () =>
{
    it('覆盖改造前写死在 MainLayout 里的 5 个面板，且落位一模一样', () =>
    {
        installBuiltinPlugins();

        // 面板拆分与落位必须与改造前等价，否则界面会变样
        expect(getPanelContributions().map((panel) => panel.id))
            .toEqual(['hierarchy', 'scene', 'project', 'console', 'inspector']);
        expect(getPanelContributionsAt('hierarchy').map((panel) => panel.id)).toEqual(['hierarchy']);
        expect(getPanelContributionsAt('main').map((panel) => panel.id)).toEqual(['scene']);
        expect(getPanelContributionsAt('project').map((panel) => panel.id)).toEqual(['project', 'console']);
        expect(getPanelContributionsAt('bottom').map((panel) => panel.id)).toEqual(['inspector']);
    });

    it('每个面板都有 i18n 标签键与视图 loader', () =>
    {
        installBuiltinPlugins();

        for (const panel of getPanelContributions())
        {
            expect(panel.labelKey).toMatch(/^panels\./);
            expect(typeof panel.view).toBe('function');
        }
    });

    it('粒子控制器已从 SceneView 硬编码改为插件贡献的场景浮层', () =>
    {
        installBuiltinPlugins();

        expect(getSceneOverlays().map((overlay) => overlay.id)).toEqual(['particleEffectController']);
    });
});
