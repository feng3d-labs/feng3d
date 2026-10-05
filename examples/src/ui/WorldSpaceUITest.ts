import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components, Object3D, TransformLayout } from 'feng3d';
import type { Color4 } from '@feng3d/math';
// 副作用导入：Canvas / CanvasRenderer / Transform2D / UI 组件都是纯数据类型，行为靠各自的
// registerLogic 与 registerComponentType；同时注册 UI 的独立渲染 Pass。
import '@feng3d/ui';
import { TextStyle, UIRenderMode } from '@feng3d/ui';

/**
 * UIRenderMode.WorldSpace 示例 —— 把 UI 画在 3D 场景中的一个平面上。
 *
 * 三种画布模式里，本页演示最直观的对比：
 * - **屏幕空间（默认）**：UI 用 `globalUniforms.u_Viewport` 做像素 → NDC，与相机无关，
 *   永远贴在屏幕上（左上角那块说明面板就是它）；
 * - **世界空间（`UIRenderMode.WorldSpace`）**：UI 用 `cameraUniforms.u_viewProjection` 投影，
 *   于是宿主 `Object3D` 的位置 / 旋转 / 缩放就是"这块 UI 摆在 3D 的哪里"——
 *   右侧那块面板会跟着它下面的 3D 薄板一起转、一起随相机移动。
 *
 * 拖拽鼠标旋转相机即可看出差别；左下角的蓝色立方体是同一 3D 空间里的参照物。
 */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

/** 造一个 UI 元素的组件数据（布局 + 2D 变换 + 画布渲染器） */
function uiComponents(size: { x: number, y: number }, position: { x: number, y: number } = { x: 0, y: 0 }): Components[]
{
    return [
        {
            __type__: 'TransformLayout',
            position: { x: position.x, y: position.y, z: 0 },
            size: { x: size.x, y: size.y, z: 1 },
            leftTop: { x: 0, y: 0, z: 0 },
            rightBottom: { x: 0, y: 0, z: 0 },
            anchorMin: { x: 0.5, y: 0.5, z: 0.5 },
            anchorMax: { x: 0.5, y: 0.5, z: 0.5 },
            pivot: { x: 0.5, y: 0.5, z: 0.5 },
        } as TransformLayout,
        { __type__: 'Transform2D' },
        { __type__: 'CanvasRenderer' },
    ] as Components[];
}

/** 造一个 UI 对象 */
function uiObject(name: string, components: Components[], children?: Object3D[]): Object3D
{
    return { __type__: 'Object3D', name, components, children } as Object3D;
}

/** 造一个文本元素 */
function textComponents(content: string, position: { x: number, y: number }, style: TextStyle): Components[]
{
    return [...uiComponents({ x: 1, y: 1 }, position), { __type__: 'Text', text: content, style }];
}

const WHITE_COLOR: Color4 = { __type__: 'Color4', r: 0.92, g: 0.94, b: 0.98, a: 1 };

/** 世界空间画布在 3D 里的摆放（同一个变换用于 UI 与其下方的薄板） */
const WORLD_UI_POSITION = { x: 0.9, y: 0.25, z: 0.05 };
const WORLD_UI_ROTATION = { x: 0, y: 0.45, z: 0 };
/** UI 的像素尺寸 → 世界尺寸的换算（画布逻辑尺寸是屏幕像素，靠 scale 缩到世界） */
const WORLD_UI_SCALE = 0.008;

const view: View = {
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
            position: { x: 0.6, y: 1.5, z: 10.5 },
            components: [{ __type__: 'PerspectiveCamera' }, { __type__: 'OrbitControls' }],
        }, {
            // 参照物：同一 3D 空间里的立方体（说明 UI 真的在世界里，而不是贴在屏幕上）
            __type__: 'Object3D',
            name: 'Cube',
            position: { x: -3.8, y: -1.6, z: -0.5 },
            scale: { x: 0.9, y: 0.9, z: 0.9 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.25, g: 0.5, b: 0.95, a: 1 } } },
            }],
        }, {
            // UI 下方的 3D 薄板：让"UI 贴在平面上"看得见（UI Pass 在主 Pass 之后绘制，覆盖它）
            __type__: 'Object3D',
            name: 'Board',
            position: { x: WORLD_UI_POSITION.x, y: WORLD_UI_POSITION.y, z: WORLD_UI_POSITION.z - 0.08 },
            rotation: WORLD_UI_ROTATION,
            scale: { x: 6.9, y: 5.3, z: 0.05 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.20, g: 0.23, b: 0.29, a: 1 } } },
            }],
        }, {
            // ★ 世界空间画布：位置 / 旋转 / 缩放就是"这块 UI 在 3D 里的摆放"
            __type__: 'Object3D',
            name: 'WorldCanvas',
            position: WORLD_UI_POSITION,
            rotation: WORLD_UI_ROTATION,
            scale: { x: WORLD_UI_SCALE, y: WORLD_UI_SCALE, z: WORLD_UI_SCALE },
            components: [
                { __type__: 'Transform2D' },
                { __type__: 'Canvas', renderMode: UIRenderMode.WorldSpace },
            ],
            children: [
                uiObject('WorldUiPanel', [
                    ...uiComponents({ x: 620, y: 420 }),
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.10, g: 0.13, b: 0.18, a: 0.94 } },
                ]),
                uiObject('WorldUiTitle', textComponents('World Space UI', { x: 0, y: -130 }, new TextStyle({
                    fontSize: 52,
                    fill: { __type__: 'Color4', r: 0.45, g: 0.78, b: 1, a: 1 },
                }))),
                uiObject('WorldUiSubtitle', textComponents('UIRenderMode.WorldSpace', { x: 0, y: -70 }, new TextStyle({
                    fontSize: 24,
                    fill: WHITE_COLOR,
                }))),
                uiObject('WorldUiRed', [
                    ...uiComponents({ x: 150, y: 100 }, { x: -90, y: 60 }),
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.92, g: 0.26, b: 0.21, a: 1 } },
                ]),
                uiObject('WorldUiGreen', [
                    ...uiComponents({ x: 150, y: 100 }, { x: 90, y: 60 }),
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.30, g: 0.78, b: 0.35, a: 1 } },
                ]),
                uiObject('WorldUiHint', textComponents('这块 UI 贴在 3D 薄板上：旋转相机看它一起转', { x: 0, y: 160 }, new TextStyle({
                    fontSize: 20,
                    fill: { __type__: 'Color4', r: 0.66, g: 0.72, b: 0.82, a: 1 },
                }))),
            ],
        }, {
            // 屏幕空间画布（默认）：左上角的说明面板，永远贴在屏幕上
            __type__: 'Object3D',
            name: 'ScreenCanvas',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
            children: [
                uiObject('DocPanel', [
                    ...uiComponents({ x: 500, y: 200 }, { x: -145, y: -190 }),
                    { __type__: 'Rect', color: { __type__: 'Color4', r: 0.09, g: 0.11, b: 0.15, a: 0.92 } },
                ]),
                uiObject('DocTitle', textComponents('WorldSpace —— UI 画在 3D 平面上', { x: -145, y: -265 }, new TextStyle({
                    fontSize: 20,
                    fill: { __type__: 'Color4', r: 0.45, g: 0.78, b: 1, a: 1 },
                }))),
                uiObject('DocLine1', textComponents('世界空间：UI 用 cameraUniforms 投影', { x: -145, y: -225 }, new TextStyle({ fontSize: 13, fill: WHITE_COLOR }))),
                uiObject('DocLine2', textComponents('宿主位置/旋转/缩放 = UI 在 3D 里的摆放', { x: -145, y: -197 }, new TextStyle({ fontSize: 13, fill: WHITE_COLOR }))),
                uiObject('DocLine3', textComponents('屏幕空间：用 u_Viewport，与相机无关', { x: -145, y: -169 }, new TextStyle({ fontSize: 13, fill: WHITE_COLOR }))),
                uiObject('DocLine4', textComponents('拖拽鼠标旋转相机，右侧面板随薄板转', { x: -145, y: -141 }, new TextStyle({ fontSize: 13, fill: WHITE_COLOR }))),
                uiObject('DocLine5', textComponents('局限：UI 不参与深度遮挡（后画的 Pass）', { x: -145, y: -113 }, new TextStyle({ fontSize: 13, fill: WHITE_COLOR }))),
            ],
        }],
    },
} as View;

const viewLogic = logic(view);

ticker.onframe(() =>
{
    // 布局与绘制都在渲染链里（UI Pass 的每帧准备 + 提交），这里只管提交
    webgpu.submit(viewLogic.submit);
});
