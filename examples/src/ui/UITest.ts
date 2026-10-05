import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components, TransformLayout } from 'feng3d';
// 副作用导入：Canvas / CanvasRenderer / Transform2D / Rect / Text 都是纯数据类型，行为要靠各自的
// registerLogic 与 registerComponentType；只用作类型标注的 import 会被转译器整条擦除。
// 同时它会注册 UI 的**独立渲染 Pass**（见 packages/ui/src/core/UIPass.ts）。
import '@feng3d/ui';
import { TextStyle } from '@feng3d/ui';

/**
 * UI 渲染示例——「UI 到底画不画得出来」的可视化验证页。
 *
 * 三件事值得注意：
 *
 * 1. **绘制不需要手动调用**：`CanvasRenderer` 登记为 `renderPass: 'ui'` 之后，UI 由
 *    **独立的 UI Pass** 渲染——该 Pass 排在主场景 Pass 之后、颜色附件 `loadOp: 'load'`，
 *    所以 UI 一定画在 3D 之上。本页**没有**任何"手动绘制 UI"的代码。
 * 2. **布局也不需要手动驱动**：UI Pass 的每帧准备（`ViewPassProvider.update`）会把画布尺寸
 *    同步到每个 Canvas 并重算子树锚点布局。因此本页**不再**每帧调 `drawCanvas(view)`
 *    （那个函数现在只负责鼠标射线，供拾取用）。
 * 3. **层级序就是树序**：UI 的绘制顺序 = 树的前序遍历（父先画、子后画、同层按 children 顺序），
 *    不再靠"给背景一个很负的 z"来凑。本页所有 UI 元素的 z 都是 0。
 *
 * 另外：UI 的像素坐标几何不再受 3D 相机的视锥剔除影响（UI Pass 自己收集），
 * 所以**不需要**再给相机写 `frustumCulling: false`。
 */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

/**
 * UI 元素的组件数据（`rect` 由布局组件的 `size` / `pivot` 派生，再写进 UI 材质的 `u_rect`）。
 *
 * 只声明用得到的布局字段：`TransformLayoutLogic` 对每个字段都有默认值（缺失时按 0 / 1 / 0.5 处理）。
 * `Transform2D` 是**必挂**的：把 `rect` 写进 UI uniform 的是它（`TransformLayout` 只做布局计算）。
 *
 * @param size 元素尺寸（像素）
 * @param position 相对锚点的偏移（像素）
 */
function uiComponents(
    size: { x: number, y: number },
    position: { x: number, y: number } = { x: 0, y: 0 },
): Components[]
{
    return [
        {
            __type__: 'TransformLayout',
            position: { x: position.x, y: position.y, z: 0 },
            size: { x: size.x, y: size.y, z: 1 },
            pivot: { x: 0.5, y: 0.5, z: 0.5 },
        } as TransformLayout,
        { __type__: 'Transform2D' },
    ] as Components[];
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.16, g: 0.18, b: 0.22, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 6 },
            components: [{
                // 不需要 frustumCulling: false——UI 走独立 Pass，与这个 3D 相机的视锥无关
                __type__: 'PerspectiveCamera',
            }],
        }, {
            // 3D 物体：用来验证 UI 覆盖在场景之上（UI Pass 排在主 Pass 之后）
            __type__: 'Object3D',
            name: 'Cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.20, g: 0.55, b: 0.95, a: 1.0 },
                    },
                },
            }],
        }, {
            __type__: 'Object3D',
            name: 'Canvas',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
            children: [{
                // 深色面板：先画（树序在前），后面的方块与文字覆盖在它上面
                __type__: 'Object3D',
                name: 'Panel',
                components: [
                    ...uiComponents({ x: 420, y: 260 }),
                    { __type__: 'CanvasRenderer' },
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.14, a: 0.88 } },
                ],
            }, {
                // 红色方块（面板内偏左上）
                __type__: 'Object3D',
                name: 'RedBlock',
                components: [
                    ...uiComponents({ x: 120, y: 120 }, { x: -110, y: -40 }),
                    { __type__: 'CanvasRenderer' },
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.92, g: 0.26, b: 0.21, a: 1 } },
                ],
            }, {
                // 绿色方块（面板内偏右下）
                __type__: 'Object3D',
                name: 'GreenBlock',
                components: [
                    ...uiComponents({ x: 120, y: 120 }, { x: 110, y: 40 }),
                    { __type__: 'CanvasRenderer' },
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.30, g: 0.78, b: 0.35, a: 1 } },
                ],
            }, {
                // 文字（autoSize：宽高由绘制出的文本位图决定）
                __type__: 'Object3D',
                name: 'Title',
                components: [
                    ...uiComponents({ x: 1, y: 1 }, { x: 0, y: 150 }),
                    { __type__: 'CanvasRenderer' },
                    {
                        __type__: 'Text',
                        text: 'feng3d UI',
                        // TextStyle 目前仍是 EventEmitter 子类（不是纯数据接口），必须构造实例
                        style: new TextStyle({ fontSize: 48, fill: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }),
                    },
                ],
            }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    // 布局与绘制都在渲染链里（UI Pass 的每帧准备 + 提交），这里只管提交
    webgpu.submit(viewLogic.submit);
});
