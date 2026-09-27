import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { ImageUtil } from './ImageUtil';

/**
 * `ImageUtil` 的颜色参数改为**结构化 `ImageUtilColorLike`**（issue #134）后的行为。
 *
 * 旧实现用 `@feng3d/math` 的 class 版 `Color3` / `Color4`，参数类型上与主仓的纯数据颜色
 * 不兼容，编辑器只能靠 `toImageUtilColor()` 做边界转换；现在只要求可读的 r/g/b(/a)，
 * 既接受纯数据字面量、也接受 class 实例（字段都在）。
 *
 * 这里钉住两件事：
 * 1. 纯数据字面量（字段可有可无）直接可用，缺字段按「rgb 补 1、alpha 补 1」兜底；
 * 2. 原有像素语义没变：alpha 混合、颜色拾取矩形、色带矩形的取值都与旧实现一致。
 *
 * 断言用 `toBeCloseTo`：像素存储在 `Uint8ClampedArray` 里（8 位量化，`0.5*255=127.5` 会存成
 * 128），逐字段精确比较必然抖动；精度取 2（±0.005）足以覆盖量化误差。
 */
describe('ImageUtil 颜色参数（issue #134）', () =>
{
    /** 逐字段比较像素（8 位量化，用容差而非精确相等） */
    function expectPixel(image: ImageUtil, x: number, y: number, expected: { r: number, g: number, b: number, a: number })
    {
        const actual = image.getPixel(x, y);

        expect(actual.r).toBeCloseTo(expected.r, 2);
        expect(actual.g).toBeCloseTo(expected.g, 2);
        expect(actual.b).toBeCloseTo(expected.b, 2);
        expect(actual.a).toBeCloseTo(expected.a, 2);
    }

    it('setPixel / getPixel 往返，缺字段按白与不透明兜底', () =>
    {
        const image = new ImageUtil(2, 2);

        image.setPixel(0, 0, { r: 1, g: 0, b: 0, a: 0.5 });
        expectPixel(image, 0, 0, { r: 1, g: 0, b: 0, a: 0.5 });

        // 空字面量：rgb 补 1、alpha 补 1（与 webgpu 侧 color4Logic 的 `c.r ?? 1` 一致）
        image.setPixel(1, 1, {});
        expectPixel(image, 1, 1, { r: 1, g: 1, b: 1, a: 1 });
    });

    it('drawPixel 按 alpha 做逐分量混合（含 alpha 自身）', () =>
    {
        const image = new ImageUtil(1, 1, { r: 0, g: 0, b: 0, a: 0 });

        image.drawPixel(0, 0, { r: 1, g: 0, b: 0, a: 0.5 });
        // old*(1-a) + color*a —— alpha 自身也参与插值（与旧 class 的 mix 一致）：
        // r = 0*0.5 + 1*0.5 = 0.5；a = 0*0.5 + 0.5*0.5 = 0.25
        expectPixel(image, 0, 0, { r: 0.5, g: 0, b: 0, a: 0.25 });

        // 再叠一层同色：r = 0.5*0.5 + 1*0.5 = 0.75；a = 0.25*0.5 + 0.5*0.5 = 0.375
        image.drawPixel(0, 0, { r: 1, g: 0, b: 0, a: 0.5 });
        expectPixel(image, 0, 0, { r: 0.75, g: 0, b: 0, a: 0.375 });
    });

    it('fillRect 只在矩形范围内着色', () =>
    {
        const image = new ImageUtil(3, 3, { r: 0, g: 0, b: 0, a: 1 });

        image.fillRect({ x: 1, y: 1, width: 1, height: 1 } as never, { r: 0, g: 1, b: 0, a: 1 });

        expectPixel(image, 1, 1, { r: 0, g: 1, b: 0, a: 1 });
        expectPixel(image, 0, 0, { r: 0, g: 0, b: 0, a: 1 });
        expectPixel(image, 2, 2, { r: 0, g: 0, b: 0, a: 1 });
    });

    it('drawColorPickerRect：左上白、右上接近基色、左下黑（纯函数插值替代 mixTo）', () =>
    {
        const image = new ImageUtil(4, 4);

        image.drawColorPickerRect(0xff0000);

        expectPixel(image, 0, 0, { r: 1, g: 1, b: 1, a: 1 });
        // 插值比例是 i/width、j/height，最右列只走到 3/4、最下行只走到 3/4：
        // 右上 ≈ 白 0.25 + 红 0.75；左下 ≈ 白 0.25 与黑 0.75 混合
        expectPixel(image, 3, 0, { r: 1, g: 0.25, b: 0.25, a: 1 });
        expectPixel(image, 0, 3, { r: 0.25, g: 0.25, b: 0.25, a: 1 });
    });

    it('drawColorRect：上半为不透明基色、下半按 alpha 分左右白黑（clone 语义保留）', () =>
    {
        const image = new ImageUtil(10, 10);

        image.drawColorRect({ r: 1, g: 0, b: 0, a: 0.5 });

        // 上半部分（j <= height*0.8）是不透明基色
        expectPixel(image, 9, 0, { r: 1, g: 0, b: 0, a: 1 });

        // 下半部分：i < alphaWidth(5) 为白，否则黑
        expectPixel(image, 0, 9, { r: 1, g: 1, b: 1, a: 1 });
        expectPixel(image, 9, 9, { r: 0, g: 0, b: 0, a: 1 });
    });
});
