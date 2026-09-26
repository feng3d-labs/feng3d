import { beforeEach, describe, expect, it } from 'vitest';
import { logic, objectview } from 'feng3d';
import {
    BUILTIN_PLUGINS,
    EDITOR_PLUGIN_API_VERSION,
    LOGIC_PLUGINS,
    OBJECT_VIEW_PLUGIN,
    getContributionTable,
    getPlugins,
    installBuiltinPlugins,
    registerPlugins,
    resetPlugins,
} from '../src/plugins';
import type { EditorPluginManifest } from '../src/plugins';

/**
 * 清单声明的**安装路径**（issue #170）。
 *
 * 为什么必须有这组用例：把 `registerLogic` 从模块顶层搬进清单，机制上换了一条路——
 * 原来"import 到就注册"，现在"清单声明 + `installBuiltinPlugins()` 执行"。
 * 纯逻辑测试（`pluginTable.spec.ts`）只验清单**数据**对不对，
 * 抓不到"声明了但没人执行"这类断链：数据完全正确，而编辑器起来后所有 Logic 都没注册。
 *
 * 所以这里验的是**执行结果**：装完之后引擎侧注册表里真的有这些东西。
 */

/** 造一份最小清单（只带 Logic 贡献） */
function logicManifest(id: string, logics: { name: string; logic: object }[]): EditorPluginManifest
{
    return {
        id,
        name: id,
        apiVersion: EDITOR_PLUGIN_API_VERSION,
        contributes: { logics: logics as unknown as EditorPluginManifest['contributes']['logics'] },
    };
}

/** 假的 Logic 类（有 `prototype`，满足清单的类引用形状） */
class FakeLogic
{
    protected constructor(data: unknown) { void data; }
}

beforeEach(() =>
{
    resetPlugins();
});

describe('清单 → 引擎注册表（Logic）', () =>
{
    it('内置清单声明的每个 Logic 都真被注册进引擎（声明与执行不许断链）', () =>
    {
        installBuiltinPlugins();

        const declared = LOGIC_PLUGINS.flatMap((plugin) => plugin.contributes.logics ?? []);

        expect(declared.length).toBe(23);

        // 行为判据而不是"看清单里写了几个"：未注册的类型 `logic()` 会返回 null
        // （见 packages/reactivity/src/logic.ts）。构造需要的字段由各 Logic 自己补默认值，
        // 补不了的（依赖真实场景的）会抛——那种情况不算"没注册"，单独统计。
        const notRegistered: string[] = [];
        const constructed: string[] = [];
        for (const entry of declared)
        {
            try
            {
                if (logic({ __type__: entry.name } as never) === null) notRegistered.push(entry.name);
                else constructed.push(entry.name);
            }
            catch
            {
                // 构造需要合法数据：拿不到实例不代表没注册，跳过
            }
        }

        expect(notRegistered, '声明了却没注册（installBuiltinPlugins 漏执行）').toEqual([]);
        // 核对本身别落空：至少得有一部分能直接用裸字面量构造出来
        expect(constructed.length).toBeGreaterThan(0);
        // 顺手记下能构造的比例（其余是需要真实场景数据的，属于正常）
        console.log(`[pluginInstall] 23 个 Logic 中 ${constructed.length} 个能用裸字面量直接构造`);
    });

    it('清单里的类型名与类名对得上（防「写错一个字母」这类复制粘贴错误）', () =>
    {
        // 清单里类型名与类名各写一遍（`{ name: 'MRSTool', logic: MRSToolLogic }`），
        // 正是最容易复制粘贴出错的地方：错配的后果是**另一个类型**被注册，且不报错。
        // 命名约定是 `${类型名}Logic`，逐个核对。
        const mismatched = LOGIC_PLUGINS
            .flatMap((plugin) => plugin.contributes.logics ?? [])
            .filter((entry) => entry.logic.name !== `${entry.name}Logic`)
            .map((entry) => `${entry.name} → ${entry.logic.name}`);

        expect(mismatched).toEqual([]);
    });

    it('重复的类型名在注册时被拒绝（后注册静默顶掉先注册更难查）', () =>
    {
        registerPlugins([logicManifest('p1', [{ name: 'Same', logic: FakeLogic }])]);

        // 幂等跳过只按插件 id 生效：不同插件贡献同一个类型名必须报错并点名双方
        expect(() => registerPlugins([
            logicManifest('p2', [{ name: 'Same', logic: FakeLogic }]),
        ])).toThrow(/logic:Same（plugin 层的 p1 与 p2）/);

        // 失败必须**不留痕**：冲突的 p2 不能被留在注册表里，否则之后每次注册都会报同一个幽灵冲突
        expect(getPlugins().map((plugin) => plugin.id)).toEqual(['p1']);

        // 换成不冲突的类型名则正常通过（说明上面的失败确实来自冲突，而不是别的原因）
        expect(() => registerPlugins([
            logicManifest('p3', [{ name: 'Other', logic: FakeLogic }]),
        ])).not.toThrow();
        expect(getPlugins().map((plugin) => plugin.id)).toEqual(['p1', 'p3']);
    });
});

describe('清单 → 引擎注册表（属性面板）', () =>
{
    it('安装后 objectview 真的拿到了默认视图、类型→控件、描述表与人工配置', () =>
    {
        installBuiltinPlugins();

        const contributed = OBJECT_VIEW_PLUGIN.contributes.objectView!;

        // 四个默认视图类名
        expect(objectview.defaultBaseObjectViewClass).toBe(contributed.defaults!.baseObjectView);
        expect(objectview.defaultObjectViewClass).toBe(contributed.defaults!.objectView);
        expect(objectview.defaultObjectAttributeViewClass).toBe(contributed.defaults!.objectAttributeView);
        expect(objectview.defaultObjectAttributeBlockView).toBe(contributed.defaults!.objectAttributeBlockView);

        // 类型→控件：逐个核对（漏一个就等于那个类型静默退化成默认控件）
        for (const entry of contributed.typeAttributeViews ?? [])
        {
            expect(objectview.defaultTypeAttributeView[entry.type], `${entry.type} 未生效`).toEqual(entry.view);
        }

        // 描述表与人工配置是"按引用整块注册"的两张表
        expect(objectview.dataTypeSchema).toBe(contributed.dataTypeSchema);
        expect(objectview.objectViewConfig).toBe(contributed.objectViewConfig);
    });

    it('重复安装是幂等的（开发期热替换、多次 install 不会叠加或报错）', () =>
    {
        installBuiltinPlugins();
        const after = getContributionTable();

        expect(() => installBuiltinPlugins()).not.toThrow();

        const again = getContributionTable();
        expect(again.plugins.length).toBe(after.plugins.length);
        expect(again.panels.length).toBe(after.panels.length);
        expect(again.logics.length).toBe(after.logics.length);
        expect(again.typeAttributeViews.length).toBe(after.typeAttributeViews.length);
    });

    it('省略 defaults 里的字段时不清空已有值（"不写"是"不管"，不是"重置"）', () =>
    {
        installBuiltinPlugins();
        const before = objectview.defaultObjectViewClass;

        registerPlugins([{
            id: 'p-partial',
            name: 'p-partial',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: { objectView: { defaults: { baseObjectView: 'OVBaseDefault' } } },
        }]);
        // 注意：registerPlugins 只登记，不执行——这里直接走安装入口才有效果
        installBuiltinPlugins();

        expect(objectview.defaultObjectViewClass).toBe(before);
    });
});

describe('内置插件的总量基线', () =>
{
    it('内置插件清单包含面板 / 浮层 / Logic / 属性面板四类贡献', () =>
    {
        installBuiltinPlugins();

        const table = getContributionTable();

        expect(table.plugins.length).toBe(BUILTIN_PLUGINS.length);
        expect(table.panels.length).toBe(5);
        expect(table.sceneOverlays.length).toBe(1);
        expect(table.logics.length).toBe(23);
        expect(table.typeAttributeViews.length).toBe(16);
    });
});
