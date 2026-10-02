import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { registerPlugins, resetPlugins } from '../src/plugins/registry';
import { notifyPluginStateChanged } from '../src/plugins/state';
import { EDITOR_PLUGIN_API_VERSION } from '../src/plugins/apiVersion';
import { getEditorSlots, installEditorSlots, resetEditorSlots } from '../src/plugins/slots';
import { PANEL_SLOT_BY_PLACEMENT, SCENE_OVERLAY_SLOT } from '../src/plugins/slots/projection';
import type { EditorPluginManifest, PanelViewLoader } from '../src/plugins';

/**
 * 插槽安装点（#276 S2b）。
 *
 * 测的是**串起来的那条链**：`installEditorSlots()` 声明座位 → 投影启用的清单 →
 * 插件状态一变就自动重投。界面侧（`MainLayout.vue` / `SceneView.vue`）读的就是这里的座位内容，
 * 所以这几个用例覆盖的是"界面为什么会有这些东西"。
 *
 * 界面本身（Vue 渲染）由运行期验证负责：`node scripts/editor-plugins.mjs --open --check` + 看画面。
 */

/** 造一个最小的视图 loader */
function loader(name: string): PanelViewLoader
{
    return () => Promise.resolve({ default: defineComponent({ name }) });
}

/** 造一份"两个面板 + 一个浮层"的清单 */
function manifests(): EditorPluginManifest[]
{
    return [
        {
            id: '@feng3d/editor-plugin-hierarchy',
            name: '层级',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: {
                panels: [{ id: 'hierarchy', labelKey: 'panels.hierarchy', view: loader('Hierarchy'), placement: 'hierarchy' }],
            },
        },
        {
            id: '@feng3d/editor-plugin-scene',
            name: '场景',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: {
                panels: [{ id: 'scene', labelKey: 'panels.scene', view: loader('Scene'), placement: 'main' }],
            },
        },
        {
            id: '@feng3d/editor-plugin-particle',
            name: '粒子',
            apiVersion: EDITOR_PLUGIN_API_VERSION,
            contributes: {
                sceneOverlays: [{ id: 'particle-controller', view: loader('Particle') }],
            },
        },
    ];
}

beforeEach(() =>
{
    resetPlugins();
    resetEditorSlots();
});

describe('安装插槽', () =>
{
    it('安装后核心座位已声明，且启用的清单被投影进座位', () =>
    {
        registerPlugins(manifests());

        const result = installEditorSlots();
        const slots = getEditorSlots();

        // 声明了 4 个面板座位 + 1 个浮层座位
        expect(result.slots).toBe(5);
        expect(slots.declaredSlots()).toContain('panel.hierarchy');
        expect(slots.declaredSlots()).toContain(SCENE_OVERLAY_SLOT);

        // 面板按落位落到对应座位；浮层落到 scene.overlay
        expect(slots.entries(PANEL_SLOT_BY_PLACEMENT.hierarchy).map((entry) => entry.id)).toEqual(['hierarchy']);
        expect(slots.entries(PANEL_SLOT_BY_PLACEMENT.main).map((entry) => entry.id)).toEqual(['scene']);
        expect(slots.entries(SCENE_OVERLAY_SLOT).map((entry) => entry.id)).toEqual(['particle-controller']);
        expect(result.entries).toBe(3);
    });

    it('重复安装是幂等的：座位不重复声明、占用不叠加', () =>
    {
        registerPlugins(manifests());

        installEditorSlots();
        const second = installEditorSlots();

        expect(second.slots).toBe(5);
        expect(getEditorSlots().entries(PANEL_SLOT_BY_PLACEMENT.hierarchy)).toHaveLength(1);
    });

    it('插件状态一变就**自动**重投（onPluginStateChanged → reproject）', () =>
    {
        registerPlugins(manifests());
        installEditorSlots();
        expect(getEditorSlots().entries(PANEL_SLOT_BY_PLACEMENT.main)).toHaveLength(1);

        // 模拟"插件被禁用"：清单侧只剩空表，然后照常发一次状态变化通知
        resetPlugins();
        notifyPluginStateChanged();

        // 插槽跟着清空——界面读的就是它，所以面板会立刻消失（issue #169 的验收点）
        expect(getEditorSlots().entries(PANEL_SLOT_BY_PLACEMENT.main)).toEqual([]);
        expect(getEditorSlots().entries(SCENE_OVERLAY_SLOT)).toEqual([]);
        // 座位还在（声明方是渲染方，不随插件状态变）
        expect(getEditorSlots().declaredSlots()).toContain(PANEL_SLOT_BY_PLACEMENT.main);
    });

    it('resetEditorSlots 复位：注册表与订阅一起清掉', () =>
    {
        registerPlugins(manifests());
        installEditorSlots();

        resetEditorSlots();

        // 复位后拿到的是**新的**注册表（旧的已 reset），且订阅已解除
        const fresh = getEditorSlots();
        expect(fresh.declaredSlots()).toEqual([]);
        expect(fresh.snapshot().entries).toEqual([]);

        // 再发状态变化不会动到新注册表（旧的订阅已解除）
        notifyPluginStateChanged();
        expect(fresh.snapshot().entries).toEqual([]);
    });
});
