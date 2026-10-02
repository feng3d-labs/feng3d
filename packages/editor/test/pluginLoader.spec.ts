import { beforeEach, describe, expect, it } from 'vitest';
import {
    getLoadedPackages,
    loadPluginGraph,
    loadPluginPackage,
    resetClientHalfImporter,
    resetPluginLoader,
    setClientHalfImporter,
    unloadPluginPackage,
} from '../src/plugins/loader';
import { getPanelContributions, getPluginEntries, getPlugins, resetPlugins } from '../src/plugins/registry';
import { getEditorSlots, installEditorSlots, resetEditorSlots } from '../src/plugins/slots';

/**
 * 运行时装载器（#276 阶段 4）：**不重新构建就装一个插件**。
 *
 * 被装载的对象是**真实的样板包** `@feng3d/editor-plugin-rotate`（阶段 3 建的），
 * 不是 mock——这条链走的是 `import('<包名>/client')` → 取清单 → 登记 → 重投插槽，
 * 与运行时装载要走的路径完全一致。
 *
 * 只有"坏包"的用例才注入假模块（那正是模块表存在的理由之一）。
 */
const ROTATE_ID = '@feng3d/editor-plugin-rotate';

/** 面板座位上的 id 列表 */
function panelIds(): readonly string[]
{
    return getEditorSlots().entries('panel.main').map((entry) => entry.id);
}

/**
 * 造一个"贡献同一个面板 id"的清单（用来验**跨层覆盖**与**同层冲突**）。
 *
 * 同一个贡献点 id 由不同层的两个插件提供时该"上层赢 + 留痕"；
 * 同层两个插件抢它则是错误——两种情形共用这份样本，差别只在装载时给的 `layer`。
 *
 * @param id 插件 id
 * @param labelKey 标签键（只是让两份清单可区分）
 * @returns 插件清单
 */
function makeSharedPanelManifest(id: string, labelKey: string)
{
    return {
        id,
        name: id,
        apiVersion: '^1.0.0',
        contributes: {
            panels: [{ id: 'shared.panel', labelKey, view: async () => ({ default: {} }), placement: 'main' }],
        },
    };
}

describe('运行时装载器', () =>
{
    beforeEach(async () =>
    {
        resetPlugins();
        resetPluginLoader();
        resetClientHalfImporter();
        await resetEditorSlots();
        installEditorSlots();
    });

    it('从插件包装载：清单登记 + 插槽上出现它的面板', async () =>
    {
        const outcome = await loadPluginPackage({ id: ROTATE_ID, halves: ['host', 'client', 'runtime'] });

        expect(outcome.problems).toEqual([]);
        expect(outcome.loaded).toBe(true);
        expect(getPlugins().map((plugin) => plugin.id)).toContain(ROTATE_ID);
        expect(panelIds()).toContain('rotate.panel');
    });

    it('重复装载是幂等的（不重复登记、不重复重投）', async () =>
    {
        await loadPluginPackage({ id: ROTATE_ID });
        await loadPluginPackage({ id: ROTATE_ID });

        expect(getLoadedPackages()).toEqual([ROTATE_ID]);
        expect(getPlugins().filter((plugin) => plugin.id === ROTATE_ID)).toHaveLength(1);
        expect(panelIds().filter((id) => id === 'rotate.panel')).toHaveLength(1);
    });

    it('卸载：面板从插槽消失、清单里也没了', async () =>
    {
        await loadPluginPackage({ id: ROTATE_ID });
        expect(panelIds()).toContain('rotate.panel');

        expect(unloadPluginPackage(ROTATE_ID)).toBe(true);

        expect(panelIds()).not.toContain('rotate.panel');
        expect(getPlugins().map((plugin) => plugin.id)).not.toContain(ROTATE_ID);
        expect(getLoadedPackages()).toEqual([]);
    });

    it('没装过的包卸载返回 false（幂等，不抛错）', () =>
    {
        expect(unloadPluginPackage('@feng3d/not-loaded')).toBe(false);
    });

    it('只声明 runtime 端的包不能按界面插件装载', async () =>
    {
        const outcome = await loadPluginPackage({ id: ROTATE_ID, halves: ['runtime'] });

        expect(outcome.loaded).toBe(false);
        expect(outcome.problems.join('\n')).toMatch(/没有 client 端/);
        expect(getLoadedPackages()).toEqual([]);
    });

    it('client 半没按约定导出清单时装载失败（失败是数据，不抛错）', async () =>
    {
        setClientHalfImporter(async () => ({ somethingElse: true }));

        const outcome = await loadPluginPackage({ id: 'fake-package' });

        expect(outcome.loaded).toBe(false);
        expect(outcome.problems.join('\n')).toMatch(/manifest/);
    });

    it('清单 id 与装载条目 id 不一致会被拦下（装错包的典型症状）', async () =>
    {
        setClientHalfImporter(async () => ({
            manifest: { id: 'someone-else', name: 'x', apiVersion: '^1.0.0', contributes: {} },
        }));

        const outcome = await loadPluginPackage({ id: 'wanted-package' });

        expect(outcome.loaded).toBe(false);
        expect(outcome.problems.join('\n')).toMatch(/不一致/);
        expect(getPlugins()).toEqual([]);
    });

    it('API 版本不兼容会被拦下，且注册表保持原样（事务性）', async () =>
    {
        setClientHalfImporter(async () => ({
            manifest: { id: 'future-plugin', name: 'x', apiVersion: '^9.0.0', contributes: {} },
        }));

        const outcome = await loadPluginPackage({ id: 'future-plugin' });

        expect(outcome.loaded).toBe(false);
        expect(outcome.problems.join('\n')).toMatch(/不兼容|版本/);
        expect(getPlugins()).toEqual([]);
    });

    it('导入失败（包不存在）也是数据：报出说明符与原因', async () =>
    {
        const outcome = await loadPluginPackage({ id: '@feng3d/definitely-not-a-real-package' });

        expect(outcome.loaded).toBe(false);
        expect(outcome.problems.join('\n')).toMatch(/导入 client 半失败/);
    });

    it('按入口图批量装载：一个坏包不影响其它包', async () =>
    {
        const outcomes = await loadPluginGraph({
            entries: [
                { id: ROTATE_ID },
                { id: '@feng3d/definitely-not-a-real-package' },
            ],
        });

        expect(outcomes).toHaveLength(2);
        expect(outcomes[0].loaded).toBe(true);
        expect(outcomes[1].loaded).toBe(false);
        expect(panelIds()).toContain('rotate.panel');
    });

    /**
     * **层由来源方判定**（#272 P3：内置 < 插件 < 用户）。
     *
     * 装载器看不到"这条声明是产物目录里的、还是用户用 `--plugins` 叠上来的"，
     * 所以它**不该猜**——#272 P3 之前它硬编码 `plugin`，于是宿主侧的多来源优先级
     * 到了页面就消失：两个来源给的插件抢同一个贡献点 id 时，本该"上层赢 + 留痕"，
     * 实际却变成同层冲突（直接拒绝装载）。
     */
    it('★ 条目带层时按那一层登记（层是宿主判定后传下来的）', async () =>
    {
        await loadPluginPackage({ id: ROTATE_ID, layer: 'user' });

        expect(getPluginEntries().find((one) => one.manifest.id === ROTATE_ID)?.layer).toBe('user');
    });

    it('条目没带层时缺省是 `plugin`（老宿主不传层，行为与以前一致）', async () =>
    {
        await loadPluginPackage({ id: ROTATE_ID });

        expect(getPluginEntries().find((one) => one.manifest.id === ROTATE_ID)?.layer).toBe('plugin');
    });

    it('★ 跨层叠加：user 层的同名贡献点盖住 plugin 层的，并且**留痕**', async () =>
    {
        const manifests: Record<string, unknown> = {
            'project-pkg': makeSharedPanelManifest('project-pkg', 'panels.project'),
            'user-pkg': makeSharedPanelManifest('user-pkg', 'panels.user'),
        };

        // 装载器按约定取 `<id>/client`（条目没给 clientSpecifier 时），所以这里摘掉那一段再查表
        setClientHalfImporter(async (specifier: string) => ({ manifest: manifests[specifier.replace(/\/client$/, '')] }));

        const firstLoad = await loadPluginPackage({ id: 'project-pkg', layer: 'plugin' });

        expect(firstLoad.problems, `装载 project-pkg 的问题：${JSON.stringify(firstLoad.problems)}`).toEqual([]);
        expect(firstLoad.loaded).toBe(true);
        expect((await loadPluginPackage({ id: 'user-pkg', layer: 'user' })).loaded).toBe(true);


        const shared = getPanelContributions().filter((one) => one.id === 'shared.panel');

        expect(shared, '同一个 id 只该留一条').toHaveLength(1);
        expect(shared[0].source).toBe('user-pkg');
        expect(shared[0].layer).toBe('user');
        expect(shared[0].overriddenBy, '被盖住的 plugin 层要查得到').toContain('project-pkg');
    });

    it('★ 同层抢同一个贡献点 id 仍然是**错误**（层叠加不是"谁都能盖谁"）', async () =>
    {
        const manifests: Record<string, unknown> = {
            'a-pkg': makeSharedPanelManifest('a-pkg', 'panels.a'),
            'b-pkg': makeSharedPanelManifest('b-pkg', 'panels.b'),
        };

        // 装载器按约定取 `<id>/client`（条目没给 clientSpecifier 时），所以这里摘掉那一段再查表
        setClientHalfImporter(async (specifier: string) => ({ manifest: manifests[specifier.replace(/\/client$/, '')] }));

        const firstLoad = await loadPluginPackage({ id: 'a-pkg', layer: 'plugin' });

        expect(firstLoad.problems, `装载 a-pkg 的问题：${JSON.stringify(firstLoad.problems)}`).toEqual([]);
        expect(firstLoad.loaded).toBe(true);

        const second = await loadPluginPackage({ id: 'b-pkg', layer: 'plugin' });

        expect(second.loaded).toBe(false);
        expect(second.problems.join('\n')).toMatch(/同层冲突/);
    });
});
