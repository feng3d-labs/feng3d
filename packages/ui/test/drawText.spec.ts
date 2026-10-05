// 真实 drawText / TextMetrics 路径的冒烟测试。
//
// 本批把 `@feng3d/polyfill` 的 `mathUtil.DEG2RAD` 与旧 math `Color4` class 的方法 `toRGBA()`
// 换成了 `@feng3d/math` 的纯函数 / 常量（class 已在 math 阶段 C 删除、`mathUtil` 也已不在
// polyfill 入口）。这里用一个受控的 canvas 2D 上下文跑真实 `drawText`，验证接线后的输出。
//
// ⚠️ `TextMetrics` 在**模块加载时**就执行 `document.createElement('canvas')`，所以必须先补
// `document` 再加载被测模块；静态 import 会被提升到文件顶部，故用顶层 `await import()`。
import { MATHUTIL_DEG2RAD } from '@feng3d/math';
import { describe, expect, it, vi } from 'vitest';

/** 记录 `shadowColor` / `shadowOffsetX` 的赋值序列（阴影 pass 会被正文 pass 覆盖成空值） */
const shadowColorSeq: unknown[] = [];
const shadowOffsetXSeq: number[] = [];

function createContextStub(): Record<string, unknown>
{
    let shadowColor = '';
    let shadowOffsetX = 0;

    const context: Record<string, unknown> = {
        font: '',
        fillStyle: '',
        strokeStyle: '',
        textBaseline: '',
        lineWidth: 0,
        lineJoin: 'miter',
        miterLimit: 10,
        shadowBlur: 0,
        shadowOffsetY: 0,
        scale: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        putImageData: vi.fn(),
        // 每字符 10px 的确定性度量，便于推算画布尺寸
        measureText: (text: string) => ({ width: text.length * 10 }),
        getImageData: (_x: number, _y: number, width: number, height: number) => ({
            width,
            height,
            data: new Uint8ClampedArray(width * height * 4).fill(255),
        }),
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
    };

    Object.defineProperty(context, 'shadowColor', {
        get: () => shadowColor,
        set: (value: string) =>
        {
            shadowColorSeq.push(value);
            shadowColor = value;
        },
        enumerable: true,
    });
    Object.defineProperty(context, 'shadowOffsetX', {
        get: () => shadowOffsetX,
        set: (value: number) =>
        {
            shadowOffsetXSeq.push(value);
            shadowOffsetX = value;
        },
        enumerable: true,
    });

    return context;
}

function createCanvasStub()
{
    const context = createContextStub();

    return {
        width: 0,
        height: 0,
        getContext: () => context,
        context,
    };
}

const canvasStub = createCanvasStub();
vi.stubGlobal('document', { createElement: () => canvasStub });

const { drawText } = await import('../src/text/drawText');
const { TextStyle } = await import('../src/text/TextStyle');

describe('drawText（真实路径，纯函数化后的接线）', () =>
{
    it('按文本度量设置画布尺寸并绘制（填充色经 color4ToRGBA）', () =>
    {
        shadowColorSeq.length = 0;
        const canvas = createCanvasStub();
        const style = new TextStyle();

        const result = drawText(canvas as unknown as HTMLCanvasElement, 'AB', style);

        expect(result).toBe(canvas);
        // 每字符 10px → 两字符 20px（strokeThickness 0）
        expect(canvas.width).toBe(20);
        expect(canvas.height).toBeGreaterThan(0);
        // 填充与描边都走 `color4ToRGBA`（旧 `Color4.toRGBA()` 的纯函数版）
        expect(canvas.context.fillStyle).toBe('rgba(0,0,0,1)');
        expect(canvas.context.strokeStyle).toBe('rgba(0,0,0,1)');
        expect(canvas.context.fillText).toHaveBeenCalled();
    });

    it('投影 pass 的颜色与偏移角度使用纯函数 / 常量（原 mathUtil.DEG2RAD）', () =>
    {
        shadowColorSeq.length = 0;
        shadowOffsetXSeq.length = 0;
        const canvas = createCanvasStub();
        const style = new TextStyle({ dropShadow: true, dropShadowDistance: 5, dropShadowAngle: 30 });

        drawText(canvas as unknown as HTMLCanvasElement, 'A', style);

        // 阴影 pass 先写投影色，正文 pass 再清成 ''
        expect(shadowColorSeq[0]).toBe('rgba(0,0,0,1)');
        expect(shadowColorSeq).toContain('');
        // 角度按度 → 弧度换算（MATHUTIL_DEG2RAD 与原 mathUtil.DEG2RAD 同值）
        expect(shadowOffsetXSeq[0]).toBeCloseTo(Math.cos(30 * MATHUTIL_DEG2RAD) * 5);
    });

    it('填充为颜色数组时走渐变分支', () =>
    {
        const canvas = createCanvasStub();
        const style = new TextStyle();
        (style as unknown as { fill: string[] }).fill = ['#fff'];

        // 单元素数组直接返回该元素，不建渐变
        drawText(canvas as unknown as HTMLCanvasElement, 'A', style);
        expect(canvas.context.fillStyle).toBe('#fff');

        (style as unknown as { fill: string[] }).fill = ['#fff', '#000'];

        drawText(canvas as unknown as HTMLCanvasElement, 'A', style);
        expect((canvas.context.fillStyle as { addColorStop?: unknown }).addColorStop).toBeTruthy();
    });

    it('letterSpacing 非 0 时逐字符绘制', () =>
    {
        const canvas = createCanvasStub();
        const style = new TextStyle({ letterSpacing: 2 });

        drawText(canvas as unknown as HTMLCanvasElement, 'AB', style);

        // 两个字符各画一次
        expect(canvas.context.fillText).toHaveBeenCalledTimes(2);
    });

    it('trim 为真时按不透明像素裁剪画布', () =>
    {
        const canvas = createCanvasStub();
        const style = new TextStyle({ trim: true });

        drawText(canvas as unknown as HTMLCanvasElement, 'AB', style);

        expect(canvas.context.putImageData).toHaveBeenCalled();
    });
});
