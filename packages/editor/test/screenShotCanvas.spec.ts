import { describe, expect, it } from 'vitest';
import { pixelsToDataURL } from '../src/feng3d/screenShotCanvas';

/**
 * `pixelsToDataURL` 的输入校验（issue #139）。
 *
 * 越界读像素会得到 `undefined`，写进 `ImageData` 变成透明缺口——产出一张"看着有内容、
 * 其实缺了一块"的图，比直接报错难查得多。校验刻意放在触碰 canvas **之前**，
 * 所以这两条用例不需要 DOM 环境。
 */
describe('pixelsToDataURL 的输入校验', () =>
{
    it('像素字节数不足时直接报错（而不是越界读成 undefined）', () =>
    {
        expect(() => pixelsToDataURL(new Uint8Array(4), 'rgba8unorm', 2, 2))
            .toThrow(/需要 16 字节/);
    });

    it('尺寸不合法时直接报错', () =>
    {
        expect(() => pixelsToDataURL(new Uint8Array(16), 'rgba8unorm', 0, 2))
            .toThrow(/尺寸不合法/);
        expect(() => pixelsToDataURL(new Uint8Array(16), 'rgba8unorm', 2.5, 2))
            .toThrow(/尺寸不合法/);
    });

    it('字节数刚好够时放行到 canvas 那一步（不再被校验拦住）', () =>
    {
        // 无 DOM 环境下会在 create2DCanvas 抛错——这里只断言"不再是我们这条校验"
        expect(() => pixelsToDataURL(new Uint8Array(16), 'rgba8unorm', 2, 2))
            .not.toThrow(/需要 16 字节/);
    });
});
