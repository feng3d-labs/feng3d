import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components, Object3D, TextureField, TransformLayout } from 'feng3d';
import type { Color4 } from '@feng3d/math';
// 副作用导入：Canvas / CanvasRenderer / Transform2D / UI 组件都是纯数据类型，行为要靠各自的
// registerLogic 与 registerComponentType；只用作类型标注的 import 会被转译器整条擦除。
// 同时它会注册 UI 的**独立渲染 Pass**（见 packages/ui/src/core/UIPass.ts）。
import '@feng3d/ui';
import { TextStyle } from '@feng3d/ui';
import type { Image as ImageComponent } from '@feng3d/ui';

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

/** 声明式纹理引用（`/xxx.png` 相对 examples 的 resources 目录） */
const textureOf = (url: string): TextureField => ({ __type__: 'Texture', url }) as TextureField;

/**
 * Image 示例 —— 纹理图片。
 *
 * 展示 `image`（声明式纹理）/ `color`（着色 tint）与 `setNativeSize()`（按纹理实际尺寸）。
 */
const nativeSizeImage: ImageComponent = { __type__: 'Image', image: textureOf('/blue.png') };

const view = buildView(webgpuCanvas, 'Image —— 纹理图片', [
    'image: TextureField（声明式或运行时纹理）',
    'color: 为图片着色（tint）；a<1 时半透明',
    'setNativeSize()：按纹理实际尺寸',
    '纹理异步加载：完成后自动换装',
], [
    uiObject('Original', [...uiComponents({ x: 150, y: 150 }, { x: 110, y: -130 }), { __type__: 'Image', image: textureOf('/blue.png') }]),
    uiObject('TintedRed', [...uiComponents({ x: 150, y: 150 }, { x: 290, y: -130 }), { __type__: 'Image', image: textureOf('/blue.png'), color: { __type__: 'Color4', r: 1, g: 0.35, b: 0.35, a: 1 } }]),
    uiObject('Crate', [...uiComponents({ x: 150, y: 150 }, { x: 110, y: 40 }), { __type__: 'Image', image: textureOf('/crate.gif') }]),
    uiObject('CrateDim', [...uiComponents({ x: 150, y: 150 }, { x: 290, y: 40 }), { __type__: 'Image', image: textureOf('/crate.gif'), color: { __type__: 'Color4', r: 0.5, g: 0.6, b: 0.85, a: 0.8 } }]),
    // setNativeSize：下面一行的图片尺寸不写死，加载完成后由纹理实际尺寸决定
    uiObject('NativeSize', [...uiComponents({ x: 1, y: 1 }, { x: 200, y: 200 }), nativeSizeImage]),
]);

const viewLogic = logic(view);

let frameCount = 0;
let nativeSizeApplied = false;

ticker.onframe(() =>
{
    // 纹理是异步加载的：等约 1 秒后再调 setNativeSize（它读的是纹理实际尺寸）
    frameCount++;
    if (!nativeSizeApplied && frameCount > 60)
    {
        nativeSizeApplied = true;
        logic(nativeSizeImage).setNativeSize();
    }

    webgpu.submit(viewLogic.submit);
});
