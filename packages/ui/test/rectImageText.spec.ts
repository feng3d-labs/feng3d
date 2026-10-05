// 副作用导入：Rect / Image / Text 与 CanvasRenderer / Transform2D 都是纯数据类型，
// 只用作类型标注的 import 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic
// 都不执行、logic() 返回 null（第 1 批实测踩过的坑，见 tmp/progress-ui-migration.md）。
import 'feng3d';
import { defaultTexture, Object3D } from 'feng3d';
import { logic, reactive } from '@feng3d/reactivity';
import type { RenderObject } from '@feng3d/webgpu';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/Image';
import '../src/Rect';
import '../src/Text';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import type { CanvasRenderer } from '../src/core/CanvasRenderer';
import { getTransform2D } from '../src/core/Transform2D';
import { createImageObject3D } from '../src/Image';
import type { Image } from '../src/Image';
import { createRectObject3D } from '../src/Rect';
import type { Rect } from '../src/Rect';
import { createTextObject3D } from '../src/Text';
import type { Text } from '../src/Text';
import { createUIUniforms } from '../src/core/UIMaterial';
import { TextStyle, TextAlign } from '../src/text/TextStyle';

// 文本绘制依赖真实 canvas 2D 上下文（drawText → TextMetrics.measureText）。本文件只验证
// Text 的「数据 → uniform 装配 / 重绘失效」流程，故把 drawText 换成受控桩；
// 真实的 drawText 仍由 TextStyle 用例间接覆盖到 `toFontString()`。
const mocks = vi.hoisted(() => ({ drawText: vi.fn() }));
vi.mock('../src/text/drawText', () => ({ drawText: mocks.drawText }));

/** 假画布（drawText 的返回值只需 width / height） */
function fakeCanvas(width: number, height: number): HTMLCanvasElement
{
    return { width, height } as unknown as HTMLCanvasElement;
}

/** 挂一个只含指定 UI 组件的对象（可选带 Transform2D） */
function mount(type: 'Rect' | 'Image' | 'Text', options: { withTransform2D?: boolean, size?: { x: number, y: number } } = {})
{
    const components: Record<string, unknown>[] = [];
    if (options.withTransform2D !== false)
    {
        components.push({ __type__: 'Transform2D', ...(options.size ? { size: options.size } : {}) });
    }
    components.push({ __type__: type });

    const object3D = { __type__: 'Object3D', components } as Object3D;
    logic(object3D);

    return {
        object3D,
        component: object3D.components!.find((component) => component.__type__ === type)!,
    };
}

describe('Rect / Image / Text（新架构迁移）', () =>
{
    beforeEach(() =>
    {
        mocks.drawText.mockReset();
        mocks.drawText.mockReturnValue(fakeCanvas(64, 32));
    });

    describe('Rect', () =>
    {
        it('缺省 color 补成旧 Color4 class 的默认值（白色，不是黑色）', () =>
        {
            const { component } = mount('Rect');

            expect((component as Rect).color).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
        });

        it('显式声明的 color 不被覆盖，beforeRender 写进 UI uniform 容器', () =>
        {
            const object3D: Object3D = {
                __type__: 'Object3D',
                components: [{ __type__: 'Rect', color: { __type__: 'Color4', r: 0.25, g: 0.5, b: 0.75, a: 1 } }],
            };
            logic(object3D);
            const rect = object3D.components![0] as Rect;
            const renderObject = {} as RenderObject;

            logic(rect).beforeRender(renderObject);

            const uniforms = (renderObject as unknown as { uniforms: Record<string, unknown> }).uniforms;
            expect(uniforms.u_color).toEqual({ __type__: 'Color4', r: 0.25, g: 0.5, b: 0.75, a: 1 });
        });

        it('createRectObject3D 返回 100×100 的 Transform2D + CanvasRenderer + Rect', () =>
        {
            const object3D = createRectObject3D();

            expect(object3D.__type__).toBe('Object3D');
            expect(object3D.components!.map((component) => component.__type__))
                .toEqual(['Transform2D', 'CanvasRenderer', 'Rect']);
            expect(getTransform2D(object3D)!.size).toEqual({ x: 100, y: 100 });
        });
    });

    describe('Image', () =>
    {
        it('缺省 image / color 补成 defaultTexture 与白色', () =>
        {
            const { component } = mount('Image');

            expect((component as Image).image).toBe(defaultTexture);
            expect((component as Image).color).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
        });

        it('beforeRender 解析纹理字段并写 s_texture / u_color', () =>
        {
            const texture = { descriptor: { size: [8, 4] as const, format: 'rgba8unorm' as const } };
            const object3D: Object3D = { __type__: 'Object3D', components: [{ __type__: 'Image', image: texture }] };
            logic(object3D);
            const image = object3D.components![0] as Image;
            const renderObject = {} as RenderObject;

            logic(image).beforeRender(renderObject);

            const uniforms = (renderObject as unknown as { uniforms: Record<string, unknown> }).uniforms;
            expect(uniforms.s_texture).toBe(texture);
            expect(uniforms.u_color).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
        });

        it('setNativeSize 按纹理 descriptor.size 写 2D 尺寸（迁移前读的是已删除的 Texture2D.getSize）', () =>
        {
            const texture = { descriptor: { size: [200, 100] as const, format: 'rgba8unorm' as const } };
            const object3D: Object3D = {
                __type__: 'Object3D',
                components: [{ __type__: 'Transform2D', size: { x: 1, y: 1 } }, { __type__: 'Image', image: texture }],
            };
            logic(object3D);
            const image = object3D.components![1] as Image;

            logic(image).setNativeSize();

            expect(getTransform2D(object3D)!.size).toEqual({ x: 200, y: 100 });
        });

        it('setNativeSize：未挂载到对象上（没有 Transform2D）时安全返回', () =>
        {
            const image = { __type__: 'Image' } as Image;

            expect(() => logic(image).setNativeSize()).not.toThrow();
        });

        it('createImageObject3D 返回 100×100 的 Transform2D + CanvasRenderer + Image', () =>
        {
            const object3D = createImageObject3D();

            expect(object3D.components!.map((component) => component.__type__))
                .toEqual(['Transform2D', 'CanvasRenderer', 'Image']);
            expect(getTransform2D(object3D)!.size).toEqual({ x: 100, y: 100 });
        });
    });

    describe('Text', () =>
    {
        it('缺省 text / autoSize / style 由 Logic 补齐', () =>
        {
            const { component } = mount('Text');
            const text = component as Text;

            expect(text.text).toBe('Hello 🌷 world\nHello 🌷 world');
            expect(text.autoSize).toBe(true);
            expect(text.style).toBeInstanceOf(TextStyle);
        });

        it('beforeRender 绘制文本、写纹理与 u_uvRect，autoSize 时把画布尺寸写到 2D 变换', () =>
        {
            const { object3D, component } = mount('Text', { withTransform2D: true });
            const renderObject = {} as RenderObject;

            logic(component).beforeRender(renderObject);

            expect(mocks.drawText).toHaveBeenCalledTimes(1);
            const uniforms = (renderObject as unknown as { uniforms: Record<string, unknown> }).uniforms;
            expect(uniforms.s_texture).toBeTruthy();
            expect((uniforms.s_texture as { descriptor: { size: readonly number[] } }).descriptor.size).toEqual([64, 32]);
            // 自动尺寸后显示区域是完整画布（64/64、32/32）
            expect(uniforms.u_uvRect).toEqual({ __type__: 'Vector4', x: 0, y: 0, z: 1, w: 1 });
            expect(getTransform2D(object3D)!.size).toEqual({ x: 64, y: 32 });
        });

        it('autoSize 关闭时按 2D 尺寸与画布尺寸的比值写 u_uvRect', () =>
        {
            const object3D: Object3D = {
                __type__: 'Object3D',
                components: [
                    { __type__: 'Transform2D', size: { x: 32, y: 16 } },
                    { __type__: 'Text', autoSize: false },
                ],
            };
            logic(object3D);
            const text = object3D.components![1] as Text;
            const renderObject = {} as RenderObject;

            logic(text).beforeRender(renderObject);

            const uniforms = (renderObject as unknown as { uniforms: Record<string, unknown> }).uniforms;
            expect(uniforms.u_uvRect).toEqual({ __type__: 'Vector4', x: 0, y: 0, z: 0.5, w: 0.5 });
            // 不自动改尺寸
            expect(getTransform2D(object3D)!.size).toEqual({ x: 32, y: 16 });
        });

        it('文本变化经 effect 失效，下次 beforeRender 重新绘制', () =>
        {
            const { component } = mount('Text');
            const text = component as Text;
            const renderObject = {} as RenderObject;

            logic(text).beforeRender(renderObject);
            logic(text).beforeRender(renderObject);
            // 没有变化时不重绘（画布与纹理复用）
            expect(mocks.drawText).toHaveBeenCalledTimes(1);

            reactive(text).text = 'changed';
            logic(text).beforeRender(renderObject);

            expect(mocks.drawText).toHaveBeenCalledTimes(2);
            expect(mocks.drawText.mock.calls[1][1]).toBe('changed');
        });

        it('样式内部字段变化经 TextStyle 的 changed 事件失效', () =>
        {
            const { component } = mount('Text');
            const text = component as Text;
            const renderObject = {} as RenderObject;

            logic(text).beforeRender(renderObject);
            expect(mocks.drawText).toHaveBeenCalledTimes(1);

            text.style!.fontSize = 40;
            logic(text).beforeRender(renderObject);

            expect(mocks.drawText).toHaveBeenCalledTimes(2);
        });

        it('样式对象被替换时换挂 changed 监听（与迁移前一致：替换本身不立即失效）', () =>
        {
            const { component } = mount('Text');
            const text = component as Text;
            const oldStyle = text.style!;
            const renderObject = {} as RenderObject;

            logic(text).beforeRender(renderObject);
            reactive(text).style = new TextStyle();
            logic(text).beforeRender(renderObject);
            // 迁移前 `_styleChanged` 只做 off / on，不置失效标志——替换样式本身不触发重绘
            expect(mocks.drawText).toHaveBeenCalledTimes(1);

            // 旧样式变化不再影响该文本（监听已换挂）
            oldStyle.fontSize = 50;
            logic(text).beforeRender(renderObject);
            expect(mocks.drawText).toHaveBeenCalledTimes(1);

            // 新样式变化照常失效
            text.style!.fontSize = 60;
            logic(text).beforeRender(renderObject);
            expect(mocks.drawText).toHaveBeenCalledTimes(2);
        });

        it('invalidate() 显式失效（迁移前是 Text 组件上的公开方法）', () =>
        {
            const { component } = mount('Text');
            const text = component as Text;
            const renderObject = {} as RenderObject;

            logic(text).beforeRender(renderObject);
            logic(text).invalidate();
            logic(text).beforeRender(renderObject);

            expect(mocks.drawText).toHaveBeenCalledTimes(2);
        });

        it('createTextObject3D 返回 160×30 的 Transform2D + CanvasRenderer + Text', () =>
        {
            const object3D = createTextObject3D();

            expect(object3D.components!.map((component) => component.__type__))
                .toEqual(['Transform2D', 'CanvasRenderer', 'Text']);
            expect(getTransform2D(object3D)!.size).toEqual({ x: 160, y: 30 });
        });
    });

    describe('与 CanvasRenderer 的集成', () =>
    {
        it('createUIUniforms 的默认值逐项对应原 UIUniforms class（u_color 是旧 Color4 的白色默认值）', () =>
        {
            const uniforms = createUIUniforms();

            expect(uniforms.u_rect).toEqual({ __type__: 'Vector4', x: 0, y: 0, z: 100, w: 100 });
            expect(uniforms.u_uvRect).toEqual({ __type__: 'Vector4', x: 0, y: 0, z: 1, w: 1 });
            expect(uniforms.s_texture).toBe(defaultTexture);
            expect(uniforms.u_color).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
        });

        it('renderObject computed 按组件顺序分发 beforeRender，三种 UI 组件的 uniform 都进同一容器', () =>
        {
            const object3D: Object3D = {
                __type__: 'Object3D',
                components: [
                    { __type__: 'Transform2D', size: { x: 10, y: 20 } },
                    { __type__: 'CanvasRenderer' },
                    { __type__: 'Rect' },
                ],
            };
            logic(object3D);
            const renderer = object3D.components![1] as CanvasRenderer;
            const renderObject = logic(renderer).renderObject.value as unknown as { uniforms: Record<string, unknown> };

            expect(renderObject.uniforms.u_color).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
            // Transform2D 的 u_rect 与 Rect 的 u_color 在同一个容器里。
            // 对象没有走 Canvas.layout，布局组件保持缺省（size 1、pivot 0.5）→ 左上角 -0.5,-0.5
            expect(renderObject.uniforms.u_rect).toEqual({ __type__: 'Vector4', x: -0.5, y: -0.5, z: 1, w: 1 });
        });
    });
});

describe('TextStyle（本批：去装饰器 + Color4 纯数据化）', () =>
{
    it('默认填充/描边/投影色是纯数据字面量（旧 Color4 class 的同名实参 (0,0,0,1)）', () =>
    {
        const style = new TextStyle();
        const black = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };

        expect(style.fill).toEqual(black);
        expect(style.stroke).toEqual(black);
        expect(style.dropShadowColor).toEqual(black);
    });

    it('构造参数经 serialization.setValue 生效', () =>
    {
        const style = new TextStyle({ fontSize: 12, align: TextAlign.center });

        expect(style.fontSize).toBe(12);
        expect(style.align).toBe(TextAlign.center);
    });

    it('toFontString 生成 canvas 字体串；含空格且未登记的字体名会被加引号', () =>
    {
        const style = new TextStyle();

        expect(style.toFontString()).toBe('normal normal normal 26px Arial');

        style.fontSize = 12;
        (style as unknown as { fontFamily: string }).fontFamily = 'My Font';
        expect(style.toFontString()).toBe('normal normal normal 12px "My Font"');
    });

    it('字段变化触发 changed 事件（Text 的重绘失效依赖它），invalidate() 也可以直接触发', () =>
    {
        const style = new TextStyle();
        const listener = vi.fn();
        style.on('changed', listener);

        style.fontSize = 40;
        expect(listener).toHaveBeenCalledTimes(1);

        style.invalidate();
        expect(listener).toHaveBeenCalledTimes(2);

        style.off('changed', listener);
        style.fontSize = 41;
        expect(listener).toHaveBeenCalledTimes(2);
    });
});
