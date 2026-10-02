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
import { getPlugins, resetPlugins } from '../src/plugins/registry';
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
});
