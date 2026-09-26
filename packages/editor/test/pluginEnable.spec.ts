import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logic } from 'feng3d';
import {
    getBridgeMethodContributions,
    getContributionTable,
    getDroppedSwitches,
    getEnabledPlugins,
    getPanelContributions,
    getPluginStatus,
    getSceneOverlays,
    installBuiltinPlugins,
    installPlugins,
    onPluginStateChanged,
    reconcilePluginState,
    registerPlugins,
    resetPluginState,
    resetPlugins,
    resolvePluginEnabled,
    setPluginEnabled,
} from '../src/plugins';
import type { EditorPluginManifest } from '../src/plugins';

/**
 * 插件启用/禁用与对账（issue #169）。
 *
 * 三条被测的性质，都是"手写列表"方案天然做不到的：
 *
 * 1. **推导**：`enabled` 由 required → 用户开关 → 清单默认三者推出，没有第二份列表；
 * 2. **对账**：用户开关里指向"已经没装的插件"的项在启动时丢掉，并报出来（自愈）；
 * 3. **关干净**：禁用后贡献点从各处消失，**并且**引擎侧的 Logic 真被注销
 *    （不是只在界面上看不见——那是"假关"）。
 */

/** 造一份最小清单 */
function manifest(id: string, extra: Partial<EditorPluginManifest> = {}): EditorPluginManifest
{
    return {
        id,
        name: id,
        contributes: {
            panels: [{ id: `${id}-panel`, labelKey: 'k', view: () => Promise.resolve({}), placement: 'main' }],
        },
        ...extra,
    };
}

/** 造一份带面板 + Logic + 桥接方法的清单（三类贡献点齐备，便于一次验"关干净"） */
function richManifest(id: string, typeName: string): EditorPluginManifest
{
    class FakeLogic { protected constructor(data: unknown) { void data; } }

    return {
        id,
        name: id,
        contributes: {
            panels: [{ id: `${id}-panel`, labelKey: 'k', view: () => Promise.resolve({}), placement: 'main' }],
            logics: [{ name: typeName, logic: FakeLogic }],
            bridgeMethods: [{ name: `${id}.do`, handler: () => 'ok' }],
        },
    };
}

beforeEach(() =>
{
    resetPlugins();
    resetPluginState();
    localStorage.clear();
});

describe('启用状态推导（不维护手写列表）', () =>
{
    it('清单没声明时默认启用', () =>
    {
        expect(resolvePluginEnabled(manifest('p1'))).toBe(true);
    });

    it('清单可以声明默认关闭（装上但默认不启用）', () =>
    {
        expect(resolvePluginEnabled(manifest('p1', { defaultEnabled: false }))).toBe(false);
    });

    it('用户开关优先于清单默认', () =>
    {
        const off = manifest('p1', { defaultEnabled: false });
        expect(setPluginEnabled('p1', true)).toBeNull(); // 还没登记 → null

        registerPlugins([off]);
        expect(setPluginEnabled('p1', true)).toBe(true);
        expect(resolvePluginEnabled(off)).toBe(true);
    });

    it('必需插件拒绝关闭（返回实际状态，而不是入参）', () =>
    {
        const required = manifest('p1', { required: true });
        registerPlugins([required]);

        expect(setPluginEnabled('p1', false)).toBe(true);
        expect(resolvePluginEnabled(required)).toBe(true);
        // 被拒时如实报出来，别让调用方以为"静默生效了"
        expect(getPluginStatus('p1')?.required).toBe(true);
    });

    it('未登记的插件 id 返回 null（调用方能区分"没有这个插件"与"关失败"）', () =>
    {
        expect(setPluginEnabled('不存在', false)).toBeNull();
        expect(getPluginStatus('不存在')).toBeNull();
    });
});

describe('持久化与对账', () =>
{
    it('开关写进 localStorage，重新读缓存后仍然生效', () =>
    {
        registerPlugins([manifest('p1')]);
        setPluginEnabled('p1', false);

        // 清掉内存缓存 → 下次访问重新从 localStorage 读，模拟"重开编辑器"
        resetPluginState();

        expect(resolvePluginEnabled(manifest('p1'))).toBe(false);
        expect(getPluginStatus('p1')?.userSwitch).toBe(true);
    });

    it('按已安装状态对账：丢掉"已经没装的插件"的开关，并报出来', () =>
    {
        registerPlugins([manifest('p1'), manifest('p2')]);
        setPluginEnabled('p1', false);
        setPluginEnabled('p2', false);
        resetPluginState();

        // 这次只装了 p1（p2 被卸载 / 换版本后没了）
        const dropped = reconcilePluginState([manifest('p1')]);

        expect(dropped).toEqual(['p2']);
        expect(getDroppedSwitches()).toEqual(['p2']);
        // p1 的开关不受影响；p2 的开关已经不在，重新装回它时按清单默认（启用）——
        // 这正是"对账"的意义：不会继承一份不知从何而来的旧开关
        expect(resolvePluginEnabled(manifest('p1'))).toBe(false);
        expect(resolvePluginEnabled(manifest('p2'))).toBe(true);
    });

    it('新登记的插件不需要谁往列表里加它：直接按清单声明生效', () =>
    {
        registerPlugins([manifest('p1', { defaultEnabled: false })]);
        const result = installBuiltinPlugins();

        // installBuiltinPlugins 内部会登记内置清单并做一次对账
        expect(result.installed).toBeGreaterThan(0);
        expect(getDroppedSwitches()).toEqual([]);
    });
});

describe('禁用后贡献点从各处消失', () =>
{
    it('面板 / 浮层 / Logic / 桥接方法都不再出现在查询结果里', () =>
    {
        registerPlugins([
            richManifest('p1', 'FakeA'),
            manifest('p2', { contributes: { sceneOverlays: [{ id: 'o2', view: () => Promise.resolve({}) }] } }),
        ]);

        expect(getPanelContributions().map((panel) => panel.id)).toEqual(['p1-panel']);
        expect(getSceneOverlays().map((overlay) => overlay.id)).toEqual(['o2']);
        expect(getBridgeMethodContributions().map((entry) => entry.name)).toEqual(['p1.do']);

        setPluginEnabled('p1', false);
        setPluginEnabled('p2', false);

        expect(getPanelContributions()).toEqual([]);
        expect(getSceneOverlays()).toEqual([]);
        expect(getBridgeMethodContributions()).toEqual([]);
        // 插件本身仍在列表里（设置面板要靠它开回来），只是 enabled=false
        expect(getEnabledPlugins()).toEqual([]);
        expect(getContributionTable().plugins.map((plugin) => plugin.enabled)).toEqual([false, false]);
    });

    it('引擎侧的 Logic 真被注销（不是只在界面上看不见）', () =>
    {
        // `logic()` 对未注册类型会打一行 error——这里只想验返回值，先把噪音压掉
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { /* 静音 */ });

        // 用 installPlugins（而不是单个 setPluginEnabled）：注册清单**不等于**安装贡献点，
        // Logic 要经 applyPluginContributions 才进引擎的全局分发表
        installPlugins([richManifest('p1', 'GateProbeType')]);
        expect(logic({ __type__: 'GateProbeType' } as never)).not.toBeNull();

        setPluginEnabled('p1', false);
        expect(logic({ __type__: 'GateProbeType' } as never)).toBeNull();

        // 开回来：注册恢复，`logic()` 又能拿到实例
        setPluginEnabled('p1', true);
        expect(logic({ __type__: 'GateProbeType' } as never)).not.toBeNull();

        spy.mockRestore();
    });

    it('内置插件关掉后：面板消失、贡献表里没有它的贡献点（但插件本身仍列着）', () =>
    {
        installBuiltinPlugins();
        expect(getPanelContributions().length).toBe(5);

        setPluginEnabled('@feng3d/editor-plugin-core-panels', false);

        const table = getContributionTable();
        expect(table.panels).toEqual([]);
        expect(table.plugins.find((plugin) => plugin.id === '@feng3d/editor-plugin-core-panels')?.enabled).toBe(false);
        expect(table.plugins.find((plugin) => plugin.id === '@feng3d/editor-plugin-core-panels')?.userSwitch).toBe(true);

        // 开回来与关闭前等价
        setPluginEnabled('@feng3d/editor-plugin-core-panels', true);
        expect(getContributionTable().panels.length).toBe(5);
    });

    it('关掉变换工具插件后，它贡献的桥接方法也没了（方法表跟着功能走）', () =>
    {
        installBuiltinPlugins();
        expect(getBridgeMethodContributions().map((entry) => entry.name)).toContain('editor.setTool');

        setPluginEnabled('@feng3d/editor-plugin-mrs-tool', false);

        expect(getBridgeMethodContributions().map((entry) => entry.name)).not.toContain('editor.setTool');
    });

    it('关掉粒子插件后浮层贡献点消失（回到"场景视图不认识粒子系统"）', () =>
    {
        installBuiltinPlugins();
        expect(getSceneOverlays().map((overlay) => overlay.id)).toEqual(['particleEffectController']);

        setPluginEnabled('@feng3d/editor-plugin-particle', false);

        expect(getSceneOverlays()).toEqual([]);
    });

    it('必需插件（属性面板配置）关不掉，贡献点也不会消失', () =>
    {
        installBuiltinPlugins();
        const before = getContributionTable().typeAttributeViews.length;

        expect(setPluginEnabled('@feng3d/editor-plugin-objectview', false)).toBe(true);

        expect(getContributionTable().typeAttributeViews.length).toBe(before);
        expect(getPluginStatus('@feng3d/editor-plugin-objectview')?.enabled).toBe(true);
    });
});

describe('开关状态可观测', () =>
{
    it('贡献表区分"用户关的"与"清单默认关的"', () =>
    {
        registerPlugins([
            manifest('p-user', {}),
            manifest('p-default', { defaultEnabled: false }),
        ]);

        setPluginEnabled('p-user', false);
        const table = getContributionTable();

        expect(table.plugins.find((plugin) => plugin.id === 'p-user'))
            .toMatchObject({ enabled: false, defaultEnabled: true, userSwitch: true });
        expect(table.plugins.find((plugin) => plugin.id === 'p-default'))
            .toMatchObject({ enabled: false, defaultEnabled: false, userSwitch: false });
    });

    it('订阅者收到通知（界面靠它刷新）', () =>
    {
        registerPlugins([manifest('p1')]);
        const onChange = vi.fn();
        const stop = onPluginStateChanged(onChange);

        setPluginEnabled('p1', false);
        expect(onChange).toHaveBeenCalledTimes(1);

        // 取消订阅后不该再收到通知（组件卸载时靠它断开）
        stop();
        setPluginEnabled('p1', true);
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
