import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components, Object3D, TransformLayout } from 'feng3d';
import type { Color4 } from '@feng3d/math';
// 副作用导入：Canvas / CanvasRenderer / Transform2D / UI 组件都是纯数据类型，行为要靠各自的
// registerLogic 与 registerComponentType；只用作类型标注的 import 会被转译器整条擦除。
// 同时它会注册 UI 的**独立渲染 Pass**（见 packages/ui/src/core/UIPass.ts）。
import '@feng3d/ui';
import { TextStyle } from '@feng3d/ui';

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
 * Transform2D / TransformLayout 示例 —— 锚点与布局。
 *
 * 演示三种锚点用法（子元素相对**父级面板**布局，不是相对画布）：
 * - `min == max`：点锚点（左上 / 中心 / 右下），`size` 生效、`position` 是相对锚点的偏移；
 * - `min != max`：拉伸锚点，`size` 由「锚点区间 − leftTop/rightBottom 边距」算出；
 * - `pivot`：自身中心点（0 = 自身左上，1 = 自身右下）。
 */
const view = buildView(webgpuCanvas, 'Transform2D / TransformLayout —— 锚点布局', [
    'anchorMin / anchorMax：锚点在父级的位置',
    'min == max：点锚点（size 生效）',
    'min != max：拉伸（size 由锚点区间减边距）',
    'pivot：自身中心点（0=左上，1=右下）',
    'Transform2D 字段靠变化驱动镜像（#729）',
], [
    uiObject('Panel', [
        ...uiComponents({ x: 380, y: 280 }, { x: 205, y: 0 }),
        { __type__: 'Rect', color: { __type__: 'Color4', r: 0.16, g: 0.18, b: 0.22, a: 1 } },
    ], [
        // 拉伸锚点：填满面板并留 14px 边距（先画，作为底板）
        uiObject('StretchAnchor', [
            ...uiComponents({ x: 1, y: 1 }, { x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }], { left: 14, top: 14, right: 14, bottom: 14 }),
            { __type__: 'Rect', color: { __type__: 'Color4', r: 0.22, g: 0.26, b: 0.33, a: 1 } },
        ]),
        // 点锚点：父级左上角 + 相对偏移 (55, 28)
        uiObject('AnchorTopLeft', [
            ...uiComponents({ x: 96, y: 48 }, { x: 48, y: 24 }, [{ x: 0, y: 0 }, { x: 0, y: 0 }]),
            { __type__: 'Rect', color: { __type__: 'Color4', r: 0.92, g: 0.26, b: 0.21, a: 1 } },
        ]),
        // 点锚点：父级中心
        uiObject('AnchorCenter', [
            ...uiComponents({ x: 96, y: 48 }, { x: 0, y: 0 }),
            { __type__: 'Rect', color: { __type__: 'Color4', r: 0.30, g: 0.78, b: 0.35, a: 1 } },
        ]),
        // 点锚点：父级右下角 + 相对偏移 (-55, -28)
        uiObject('AnchorBottomRight', [
            ...uiComponents({ x: 96, y: 48 }, { x: -48, y: -24 }, [{ x: 1, y: 1 }, { x: 1, y: 1 }]),
            { __type__: 'Rect', color: { __type__: 'Color4', r: 0.20, g: 0.55, b: 0.95, a: 1 } },
        ]),
    ]),
]);

const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
