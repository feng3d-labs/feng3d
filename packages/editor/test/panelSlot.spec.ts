import { describe, expect, it } from 'vitest';
import { PANEL_PLACEMENTS, PANEL_SLOTS, isPanelSlot, normalizePanelSlot, resolvePanelSlot } from '../src/plugins/panelSlot';

/**
 * 落位 ↔ 座位与位置解析（#276 S3）。
 *
 * S3 让面板贡献点的位置有**两种写法**：`slot`（座位名，正式）与 `placement`（落位缩写，糖）。
 * 这个文件测的就是"两种写法被抹平成同一个座位"，以及"不认识的位置必须说清合法取值"。
 */

/** 最小视图 loader */
const view = () => Promise.resolve({});

describe('落位与座位', () =>
{
    it('座位表与落位表一一对应，且顺序固定（排序口径靠它）', () =>
    {
        expect(PANEL_PLACEMENTS).toEqual(['hierarchy', 'main', 'project', 'bottom']);
        expect(PANEL_SLOTS).toEqual(['panel.hierarchy', 'panel.main', 'panel.project', 'panel.bottom']);
        // 每个落位都能映射到同名座位（映射表与座位表的键是同一套）
        expect(PANEL_SLOTS.map((slot) => slot.replace('panel.', ''))).toEqual([...PANEL_PLACEMENTS]);
    });

    it('normalizePanelSlot：座位名原样返回，落位缩写查表（两者等价）', () =>
    {
        expect(normalizePanelSlot('panel.main')).toBe('panel.main');
        expect(normalizePanelSlot('main')).toBe('panel.main');

        for (const placement of PANEL_PLACEMENTS)
        {
            expect(isPanelSlot(normalizePanelSlot(placement))).toBe(true);
        }
    });

    it('不认识的位置报错，并列出合法取值', () =>
    {
        expect(() => normalizePanelSlot('center' as never)).toThrow(/panel\.main/);
        expect(() => normalizePanelSlot('center' as never)).toThrow(/只能是/);
    });

    it('resolvePanelSlot：slot 优先，placement 是糖', () =>
    {
        expect(resolvePanelSlot({ id: 'a', labelKey: 'k', view, placement: 'main' })).toBe('panel.main');
        expect(resolvePanelSlot({ id: 'b', labelKey: 'k', view, slot: 'panel.bottom' })).toBe('panel.bottom');

        // 两个都给：以 slot 为准（placement 留作对照与诊断）
        expect(resolvePanelSlot({ id: 'c', labelKey: 'k', view, slot: 'panel.bottom', placement: 'main' })).toBe('panel.bottom');
    });
});
