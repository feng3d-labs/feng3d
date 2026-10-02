import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { getPanelContributions, registerPlugins, resetPlugins } from '../src/plugins/registry';
import { EDITOR_PLUGIN_API_VERSION } from '../src/plugins/apiVersion';
import { Context } from '@deepseek-ai/cordis';
import { SlotRegistry } from '../src/plugins/slots';
import {
    PANEL_SLOT_BY_PLACEMENT,
    SCENE_OVERLAY_SLOT,
    declarePanelSlots,
    declareSceneOverlaySlot,
    projectContributions,
} from '../src/plugins/slots/projection';
import type { EditorPluginManifest, PanelViewLoader } from '../src/plugins';

/**
 * 清单 → 插槽的投影（#276 S2 的前半）。
 *
 * 测的是"清单仍是权威数据、插槽只是它的投影"这条分工（决策稿 §3.4）：
 * 投影不重新实现层叠加与启用过滤，它读的是已经归并好的查询结果；
 * 座位必须**先声明再投影**；宿主释放 = 占用消失。
 */

let slots: SlotRegistry;
let host: Context;

/** 造一个最小的视图 loader（清单里存的是 loader，不是组件本身） */
function loader(name: string): PanelViewLoader
{
    return () => Promise.resolve({ default: defineComponent({ name }) });
}

/** 造一份最小清单 */
function manifest(id: string, contributes: EditorPluginManifest['contributes']): EditorPluginManifest
{
    return { id, name: id, apiVersion: EDITOR_PLUGIN_API_VERSION, contributes };
}

/** 造一份"两个面板 + 一个浮层"的清单 */
function builtinLike(): EditorPluginManifest[]
{
    return [
        manifest('@feng3d/editor-plugin-hierarchy', {
            panels: [{ id: 'hierarchy', labelKey: 'panels.hierarchy', view: loader('Hierarchy'), placement: 'hierarchy' }],
        }),
        manifest('@feng3d/editor-plugin-scene', {
            panels: [{ id: 'scene', labelKey: 'panels.scene', view: loader('Scene'), placement: 'main', order: 1 }],
        }),
        manifest('@feng3d/editor-plugin-particle', {
            sceneOverlays: [{ id: 'particle-controller', view: loader('Particle'), order: 2 }],
        }),
    ];
}

beforeEach(() =>
{
    resetPlugins();
    slots = new SlotRegistry(new Context());
    host = new Context();
});

describe('落位与座位的映射', () =>
{
    it('四个落位各有一个座位（新增落位时映射表编译不过，不会漏）', async () =>
    {
        expect(Object.keys(PANEL_SLOT_BY_PLACEMENT).sort()).toEqual(['bottom', 'hierarchy', 'main', 'project']);
    });

    it('座位未声明时投影直接报错（先声明再投影是刻意的）', async () =>
    {
        registerPlugins(builtinLike());

        expect(() => projectContributions(slots, host)).toThrow(/还没有被声明/);
    });

    it('投影失败时事务性回滚：先声明一部分座位，失败后不留半套', async () =>
    {
        registerPlugins(builtinLike());
        // 只声明层级座位：面板投影到第二个座位（main）时必然失败
        slots.declare(PANEL_SLOT_BY_PLACEMENT.hierarchy);

        expect(() => projectContributions(slots, host)).toThrow(/还没有被声明/);
        // 已经注册的那条被回滚，不会留下"半个投影"
        expect(slots.entries(PANEL_SLOT_BY_PLACEMENT.hierarchy)).toEqual([]);
    });
});

describe('投影', () =>
{
    it('面板落到它落位对应的座位，且座位内顺序与清单查询一致', async () =>
    {
        registerPlugins(builtinLike());
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);

        projectContributions(slots, host);

        // 每个座位上的 id 顺序 = 清单查询里该落位的顺序（投影不自己排序）
        for (const placement of ['hierarchy', 'main', 'project', 'bottom'] as const)
        {
            const expected = getPanelContributions().filter((panel) => panel.placement === placement).map((panel) => panel.id);
            const actual = slots.entries(PANEL_SLOT_BY_PLACEMENT[placement]).map((entry) => entry.id);

            expect(actual).toEqual(expected);
        }

        expect(slots.entries('panel.hierarchy').map((entry) => entry.id)).toEqual(['hierarchy']);
        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['scene']);
    });

    it('浮层落到 scene.overlay，并带上来源与顺序', async () =>
    {
        registerPlugins(builtinLike());
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);

        projectContributions(slots, host);

        expect(slots.entries(SCENE_OVERLAY_SLOT)).toHaveLength(1);
        expect(slots.entries(SCENE_OVERLAY_SLOT)[0]).toMatchObject({
            slot: 'scene.overlay',
            id: 'particle-controller',
            order: 2,
            source: '@feng3d/editor-plugin-particle',
        });
        // 载荷是**贡献点本体**：渲染方要用它的 labelKey / icon / view（插槽层不解释，但要给齐）
        expect(slots.entries(SCENE_OVERLAY_SLOT)[0].value).toMatchObject({ id: 'particle-controller' });
        expect(typeof (slots.entries(SCENE_OVERLAY_SLOT)[0].value as { view: unknown }).view).toBe('function');
    });

    it('投影是一次原子变化：每个受影响的座位只通知一次（不留"空座位"的中间态）', async () =>
    {
        registerPlugins(builtinLike());
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);

        const changes: string[] = [];
        slots.onChanged((slot) => { changes.push(slot); });

        projectContributions(slots, host);

        expect([...changes].sort()).toEqual(['panel.hierarchy', 'panel.main', 'scene.overlay']);
    });

    it('只用 slot（座位名）与用 placement（落位缩写，糖）等价：落到同一座位（#276 S3）', async () =>
    {
        registerPlugins([
            manifest('p-slot', {
                panels: [{ id: 'a', labelKey: 'k.a', view: loader('A'), slot: 'panel.main' }],
            }),
            manifest('p-sugar', {
                panels: [{ id: 'b', labelKey: 'k.b', view: loader('B'), placement: 'main' }],
            }),
        ]);
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);

        projectContributions(slots, host);

        // 两种写法落进同一个座位，顺序按注册顺序（order 都为 0）
        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['a', 'b']);
    });

    it('重复投影是幂等的（装载器重跑不会叠加）', async () =>
    {
        registerPlugins(builtinLike());
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);

        projectContributions(slots, host);
        projectContributions(slots, host);

        expect(slots.entries('panel.hierarchy')).toHaveLength(1);
        expect(slots.entries(SCENE_OVERLAY_SLOT)).toHaveLength(1);
    });

    it('宿主释放 = 卸载：占用全部消失（无需重新投影）', async () =>
    {
        registerPlugins(builtinLike());
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);
        projectContributions(slots, host);

        await host.fiber.dispose();

        expect(slots.entries('panel.hierarchy')).toEqual([]);
        expect(slots.entries('panel.main')).toEqual([]);
        expect(slots.entries(SCENE_OVERLAY_SLOT)).toEqual([]);
        // 座位本身还在（取消声明是渲染方的事）
        expect(slots.declaredSlots()).toContain('panel.hierarchy');
    });

    it('禁用插件后重新投影，它的占用不再出现在插槽里（投影是快照：先撤销再重投）', async () =>
    {
        registerPlugins(builtinLike());
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);
        let unproject = projectContributions(slots, host);
        expect(slots.entries('panel.hierarchy')).toHaveLength(1);

        // 模拟"禁用 + 重投影"：清单侧只剩启用的那个
        resetPlugins();
        registerPlugins([manifest('@feng3d/editor-plugin-scene', {
            panels: [{ id: 'scene', labelKey: 'panels.scene', view: loader('Scene'), placement: 'main' }],
        })]);

        unproject();
        unproject = projectContributions(slots, host);

        // 这次投影里已经没有 hierarchy 了，所以它必须消失（幂等本身不做这件事）
        expect(slots.entries('panel.hierarchy')).toEqual([]);
        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['scene']);
        // 撤销是幂等的：多调一次不会影响别人
        unproject();
        unproject();
        expect(slots.entries('panel.main')).toEqual([]);
    });
});
