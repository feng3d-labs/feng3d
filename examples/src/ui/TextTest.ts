import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components, Object3D, TransformLayout } from 'feng3d';
import type { Color4 } from '@feng3d/math';
// 副作用导入：Canvas / CanvasRenderer / Transform2D / UI 组件都是纯数据类型，行为要靠各自的
// registerLogic 与 registerComponentType；只用作类型标注的 import 会被转译器整条擦除。
// 同时它会注册 UI 的**独立渲染 Pass**（见 packages/ui/src/core/UIPass.ts）。
import '@feng3d/ui';
import { FontStyle, FontWeight, TextAlign, TextStyle } from '@feng3d/ui';

/**
 * 造一个 UI 元素的组件数据：布局 + 2D 变换 + 画布渲染器。
 *
 * 三个组件缺一不可：
 * - `TransformLayout` 决定位置 / 尺寸 / 锚点（**必须显式声明**，见 issue #729）；
 * - `Transform2D` 把布局结果写进 UI 材质的 `u_rect`；
 * - `CanvasRenderer` 才是"可渲染"组件（UI Pass 收集的是它）。
 *
 * @param size 尺寸（像素）
 * @param position 相对锚点的偏移（像素）
 * @param anchor 锚点（缺省居中；`[min, max]` 相同为点锚点，不同为拉伸锚点）
 * @param margins 拉伸锚点时的左 / 上 / 右 / 下边距
 */
function uiComponents(
    size: { x: number, y: number },
    position: { x: number, y: number } = { x: 0, y: 0 },
    anchor: [{ x: number, y: number }, { x: number, y: number }] = [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }],
    margins: { left?: number, top?: number, right?: number, bottom?: number } = {},
): Components[]
{
    return [
        {
            __type__: 'TransformLayout',
            position: { x: position.x, y: position.y, z: 0 },
            size: { x: size.x, y: size.y, z: 1 },
            leftTop: { x: margins.left ?? 0, y: margins.top ?? 0, z: 0 },
            rightBottom: { x: margins.right ?? 0, y: margins.bottom ?? 0, z: 0 },
            anchorMin: { x: anchor[0].x, y: anchor[0].y, z: 0.5 },
            anchorMax: { x: anchor[1].x, y: anchor[1].y, z: 0.5 },
            pivot: { x: 0.5, y: 0.5, z: 0.5 },
        } as TransformLayout,
        { __type__: 'Transform2D' },
        { __type__: 'CanvasRenderer' },
    ] as Components[];
}

/** 造一个 UI 对象（可带子对象——子对象会相对它的 `TransformLayout` 布局） */
function uiObject(name: string, components: Components[], children?: Object3D[]): Object3D
{
    return { __type__: 'Object3D', name, components, children } as Object3D;
}

/** 造一个文本元素（autoSize，尺寸由文本位图决定） */
function textComponents(content: string, position: { x: number, y: number }, style: TextStyle): Components[]
{
    return [
        ...uiComponents({ x: 1, y: 1 }, position),
        { __type__: 'Text', text: content, style },
    ] as Components[];
}

const WHITE_COLOR: Color4 = { __type__: 'Color4', r: 0.92, g: 0.94, b: 0.98, a: 1 };

/**
 * 页面骨架：深色背景 + 左侧半透明说明面板（标题 + 若干功能点）+ 右侧演示区。
 *
 * 面板本身就是"功能提示"——每个示例页都直接把该 UI 组件的功能点写在画面上。
 *
 * @param title 页面标题（这是哪个 UI 组件）
 * @param lines 功能点（每行一条）
 * @param demo 演示对象（直接挂到 Canvas 下）
 */
function buildView(webgpuCanvas: HTMLCanvasElement, title: string, lines: string[], demo: Object3D[]): View
{
    const lineHeight = 28;
    const rowCount = 1 + lines.length;
    const panelHeight = lineHeight * rowCount + 24;
    const panelTop = -270;
    const panelCenterX = -195;
    const rowY = (i: number) => panelTop + 15 + i * lineHeight;

    const docPanel = uiObject('DocPanel', [
        ...uiComponents({ x: 390, y: panelHeight }, { x: panelCenterX, y: panelTop + panelHeight / 2 }),
        { __type__: 'Rect', color: { __type__: 'Color4', r: 0.09, g: 0.11, b: 0.15, a: 0.9 } },
    ]);

    const docLabels = Array.from({ length: rowCount }, (_, i) =>
    {
        const isTitle = i === 0;
        const label = isTitle ? title : lines[i - 1];

        return uiObject(isTitle ? 'DocTitle' : `DocLine${i}`, textComponents(label, { x: panelCenterX, y: rowY(i) }, new TextStyle({
            fontSize: isTitle ? 20 : 13,
            fill: isTitle ? { __type__: 'Color4', r: 0.45, g: 0.78, b: 1, a: 1 } : WHITE_COLOR,
        })));
    });

    return {
        __type__: 'View',
        canvas: webgpuCanvas,
        root: {
            __type__: 'Object3D',
            name: 'Untitled',
            components: [{
                __type__: 'Scene',
                background: { __type__: 'Color4', r: 0.12, g: 0.14, b: 0.17, a: 1 },
            }],
            children: [{
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 6 },
                components: [{ __type__: 'PerspectiveCamera' }],
            }, uiObject('Canvas', [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }], [docPanel, ...docLabels, ...demo])],
        },
    } as View;
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

/**
 * Text 示例 —— 文本与 TextStyle。
 *
 * 展示 `text` / `autoSize` 与 TextStyle 的主要字段（字号 / 填充 / 描边 / 投影 / 字形 / 对齐）。
 */
const view = buildView(webgpuCanvas, 'Text —— 文本与 TextStyle', [
    'text / autoSize：内容与自动尺寸',
    'fontSize / fontWeight / fontStyle：字体',
    'fill：填充色；stroke + strokeThickness：描边',
    'dropShadow*：投影（角度/距离/模糊）',
    'align / wordWrap / lineHeight：多行排版',
    '⚠ 必须 new TextStyle({...})',
], [
    uiObject('Default', textComponents('默认字号 26px', { x: 190, y: -160 }, new TextStyle({ fontSize: 26, fill: WHITE_COLOR }))),
    uiObject('BigBlue', textComponents('40px + 蓝色填充', { x: 195, y: -110 }, new TextStyle({ fontSize: 40, fill: { __type__: 'Color4', r: 0.35, g: 0.7, b: 1, a: 1 } }))),
    uiObject('Stroke', textComponents('描边：白字 + 4px 黑边', { x: 205, y: -42 }, new TextStyle({
        fontSize: 34,
        fill: WHITE_COLOR,
        stroke: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1 },
        strokeThickness: 4,
    }))),
    uiObject('DropShadow', textComponents('投影：dropShadow', { x: 185, y: 24 }, new TextStyle({
        fontSize: 34,
        fill: { __type__: 'Color4', r: 1, g: 0.85, b: 0.35, a: 1 },
        dropShadow: true,
        dropShadowColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 0.65 },
        dropShadowAngle: 45,
        dropShadowDistance: 8,
        dropShadowBlur: 3,
    }))),
    uiObject('BoldItalic', textComponents('粗体 + 斜体 + 字距 3', { x: 210, y: 86 }, new TextStyle({
        fontSize: 30,
        fontWeight: FontWeight.bold,
        fontStyle: FontStyle.italic,
        letterSpacing: 3,
        fill: { __type__: 'Color4', r: 0.6, g: 0.95, b: 0.6, a: 1 },
    }))),
    uiObject('Multiline', textComponents('多行 + 居中对齐\n第二行比较短\n第三行', { x: 230, y: 185 }, new TextStyle({
        fontSize: 24,
        align: TextAlign.center,
        lineHeight: 30,
        fill: WHITE_COLOR,
    }))),
]);

const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
