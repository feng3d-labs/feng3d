import { describe, expect, it, vi } from 'vitest';
import { validateFieldTypes } from './Validate';

/**
 * JSON 侧字段类型校验（设计 8.2「字段类型不匹配」行）：
 * dev 警告（期望类型 / 实际值），缺省字段跳过。
 */
describe('core/Validate validateFieldTypes', () =>
{
    it('类型不匹配时打印带上下文的警告', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        validateFieldTypes({ width: 'oops', height: 1 }, { width: 'number', height: 'number' }, 'CubeGeometry');

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('CubeGeometry.width');
        expect(warn.mock.calls[0][0]).toContain('期望 number');
        expect(warn.mock.calls[0][0]).toContain('实际 string');

        warn.mockRestore();
    });

    it('缺省字段跳过（由工厂补默认值）', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        validateFieldTypes({}, { width: 'number', tile6: 'boolean' }, 'CubeGeometry');

        expect(warn).not.toHaveBeenCalled();

        warn.mockRestore();
    });

    it('类型匹配时不警告', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        validateFieldTypes({ width: 2, tile6: false }, { width: 'number', tile6: 'boolean' }, 'CubeGeometry');

        expect(warn).not.toHaveBeenCalled();

        warn.mockRestore();
    });

    it('大对象值预览被截断', () =>
    {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        validateFieldTypes({ width: { huge: 'x'.repeat(500) } }, { width: 'number' }, 'X');

        expect(warn.mock.calls[0][0]).toContain('…');

        warn.mockRestore();
    });
});
