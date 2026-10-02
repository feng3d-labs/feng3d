import { checkApiVersion } from 'feng3d-editor/client';
import { describe, expect, it } from 'vitest';
import { ROTATE_PLUGIN } from '../src/client';
import { ROTATE_API_VERSION, ROTATE_PLUGIN_ID } from '../src/shared';

/**
 * client 半（界面端）：清单形状与视图 loader。
 *
 * 只验声明（不 mount 组件）：清单是**纯数据**，视图按需加载——
 * 这条纪律让插件的单元测试不必依赖 Vue 运行时环境（与 `PanelViewLoader` 的设计理由一致）。
 */
describe('client 半：界面贡献', () =>
{
    it('清单声明的 API 版本与当前编辑器兼容', () =>
    {
        expect(ROTATE_PLUGIN.apiVersion).toBe(ROTATE_API_VERSION);
        expect(checkApiVersion(ROTATE_PLUGIN.apiVersion).compatible).toBe(true);
    });

    it('id 与包名同源（宿主靠它认人）', () =>
    {
        expect(ROTATE_PLUGIN.id).toBe(ROTATE_PLUGIN_ID);
    });

    it('贡献一个面板，落在座位 panel.main 上（正式写法，不是 placement 糖）', () =>
    {
        const panels = ROTATE_PLUGIN.contributes.panels ?? [];

        expect(panels).toHaveLength(1);
        expect(panels[0].slot).toBe('panel.main');
        expect(panels[0].labelKey).toBeTruthy();
    });

    it('视图是 loader：声明期不持有组件，加载才拿到', async () =>
    {
        const view = ROTATE_PLUGIN.contributes.panels?.[0].view;

        expect(typeof view).toBe('function');

        const loaded = await view!();

        expect(loaded).toBeTruthy();
    });
});
