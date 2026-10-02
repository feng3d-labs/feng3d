import { beforeEach, describe, expect, it } from 'vitest';
import {
    EDITOR_BOOT_KEY,
    installPluginsFromBoot,
    readBootGraph,
    resetClientHalfImporter,
    resetPluginLoader,
} from '../src/plugins/loader';
import { getPlugins, resetPlugins } from '../src/plugins/registry';
import { getEditorSlots, installEditorSlots, resetEditorSlots } from '../src/plugins/slots';

/**
 * 启动装载（#276 任务 4）：宿主注入入口图 → 页面自行装载。
 *
 * 这一组守着"注入内容是**外部输入**"这条：形状不对必须当没有（而不是让编辑器起不来），
 * 坏条目只报错、不影响启动；合法时走的是**真样板包**（不是 mock）。
 */
const ROTATE_ID = '@feng3d/editor-plugin-rotate';

/** 造一个带注入的假全局作用域 */
function scopeWith(payload: unknown): object
{
    return { [EDITOR_BOOT_KEY]: payload };
}

describe('启动装载：读宿主注入的入口图', () =>
{
    beforeEach(async () =>
    {
        resetPlugins();
        resetPluginLoader();
        resetClientHalfImporter();
        await resetEditorSlots();
        installEditorSlots();
    });

    it('没有注入时是 null（没装插件是正常状态）', () =>
    {
        expect(readBootGraph({})).toBeNull();
    });

    it('注入形状不对时当没有（不信任注入内容，也不抛）', () =>
    {
        expect(readBootGraph(scopeWith('nope'))).toBeNull();
        expect(readBootGraph(scopeWith({ entries: 'nope' }))).toBeNull();
        expect(readBootGraph(scopeWith(null))).toBeNull();
    });

    it('跳过没有 id 的条目，其余照收', () =>
    {
        const graph = readBootGraph(scopeWith({
            entries: [{ clientSpecifier: '/x.js' }, { id: ROTATE_ID }, { id: '' }],
            appliedBy: 'test-host',
        }));

        expect(graph?.entries).toEqual([{ id: ROTATE_ID }]);
        expect(graph?.appliedBy).toBe('test-host');
    });

    it('按入口图装载：插槽上真的出现它的面板', async () =>
    {
        const outcomes = await installPluginsFromBoot(scopeWith({ entries: [{ id: ROTATE_ID }] }));

        expect(outcomes).toHaveLength(1);
        expect(outcomes[0].problems).toEqual([]);
        expect(getPlugins().map((plugin) => plugin.id)).toContain(ROTATE_ID);
        expect(getEditorSlots().entries('panel.main').map((entry) => entry.id)).toContain('rotate.panel');
    });

    it('没有入口图时什么也不做', async () =>
    {
        expect(await installPluginsFromBoot({})).toEqual([]);
        expect(getPlugins()).toEqual([]);
    });

    it('坏条目只报错、不抛（一个坏插件包不该让编辑器起不来）', async () =>
    {
        const outcomes = await installPluginsFromBoot(scopeWith({
            entries: [{ id: '@feng3d/definitely-not-a-real-package' }],
        }));

        expect(outcomes[0].loaded).toBe(false);
        expect(outcomes[0].problems.length).toBeGreaterThan(0);
        expect(getPlugins()).toEqual([]);
    });
});
