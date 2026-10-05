import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker, View } from 'feng3d';
import type { Components, Object3D, Ray3, TransformLayout } from 'feng3d';
import type { Color4 } from '@feng3d/math';
// 副作用导入：Canvas / CanvasRenderer / Transform2D / UI 组件都是纯数据类型，行为要靠各自的
// registerLogic 与 registerComponentType；只用作类型标注的 import 会被转译器整条擦除。
// 同时它会注册 UI 的**独立渲染 Pass**（见 packages/ui/src/core/UIPass.ts）。
import '@feng3d/ui';
import { ButtonState, TextStyle, drawCanvas } from '@feng3d/ui';
import type { Button, CanvasRenderer, Text as TextComponent } from '@feng3d/ui';

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
 * Button 示例 —— 状态机 + 子对象数据写回。
 *
 * Button **自身不渲染**：画面由子对象提供；每个状态下保存一份子对象数据
 * （`allStateData`），`state` 变化时把对应状态的数据写回子对象（`ButtonLogic.updateState`）。
 *
 * 本页用鼠标驱动状态：悬停 → `over`、按住 → `down`、移开 → `up`；`disabled` 由键盘 `D` 切换。
 */
const RED: Color4 = { __type__: 'Color4', r: 0.92, g: 0.26, b: 0.21, a: 1 };
const ORANGE: Color4 = { __type__: 'Color4', r: 0.98, g: 0.62, b: 0.15, a: 1 };
const DARK_RED: Color4 = { __type__: 'Color4', r: 0.62, g: 0.14, b: 0.12, a: 1 };
const GREEN: Color4 = { __type__: 'Color4', r: 0.22, g: 0.72, b: 0.42, a: 1 };
const GRAY: Color4 = { __type__: 'Color4', r: 0.38, g: 0.40, b: 0.44, a: 1 };

/** Bg 子对象在某个状态下的纯数据（Button 的 updateState 会把它写回子对象） */
const bgStateData = (color: Color4) => ({
    __type__: 'Object3D',
    name: 'Bg',
    // color 必须**每次新建**：`allStateData` 是会被反复 `setValue` 的模板数据，
    // 各状态共用同一个 Color4 对象时会被写脏——表现为"回到 up 时按钮还是按下态的深红"。
    components: [...uiComponents({ x: 240, y: 90 }), { __type__: 'Rect', color: { ...color } }],
});

/** 每个状态一份子对象数据——这就是 Button 的核心机制 */
const allStateData = {
    up: { Bg: bgStateData(RED) },
    over: { Bg: bgStateData(ORANGE) },
    down: { Bg: bgStateData(DARK_RED) },
    selected_up: { Bg: bgStateData(GREEN) },
    disabled: { Bg: bgStateData(GRAY) },
};

const button: Button = { __type__: 'Button', state: ButtonState.up, allStateData };

/** 当前状态文字（随 state 变化更新，Text.text 变化经 effect 触发重绘） */
const stateText: TextComponent = {
    __type__: 'Text',
    text: `state: ${ButtonState.up}`,
    style: new TextStyle({ fontSize: 22, fill: WHITE_COLOR }),
};

const buttonObject = uiObject('Button', [
    {
        __type__: 'TransformLayout',
        position: { x: 180, y: -10, z: 0 },
        size: { x: 240, y: 90, z: 1 },
        leftTop: { x: 0, y: 0, z: 0 },
        rightBottom: { x: 0, y: 0, z: 0 },
        anchorMin: { x: 0.5, y: 0.5, z: 0.5 },
        anchorMax: { x: 0.5, y: 0.5, z: 0.5 },
        pivot: { x: 0.5, y: 0.5, z: 0.5 },
    } as TransformLayout,
    button as Components,
], [
    uiObject('Bg', [...uiComponents({ x: 240, y: 90 }), { __type__: 'Rect', color: { ...RED } }]),
    uiObject('Label', textComponents('点我 / 悬停 / 按住', { x: 0, y: 0 }, new TextStyle({
        fontSize: 24,
        fill: WHITE_COLOR,
        dropShadow: true,
        dropShadowColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 0.5 },
        dropShadowDistance: 3,
    }))),
]);

const view = buildView(webgpuCanvas, 'Button —— 状态机与子对象数据', [
    'Button 自身不渲染：画面由子对象提供',
    'state: up / over / down / selected_* / disabled',
    'allStateData：每个状态一份子对象数据',
    '实测：悬停=over、按住=down、松开=up',
    '按键盘 D 切换 disabled（不用单击——那样点一下就没反应）',
], [
    buttonObject,
    uiObject('StateText', [...uiComponents({ x: 1, y: 1 }, { x: 180, y: 90 }), stateText]),
    uiObject('StateList', textComponents('up / over / down / selected_up / selected_down / disabled', { x: 195, y: 150 }, new TextStyle({
        fontSize: 14,
        fill: { __type__: 'Color4', r: 0.6, g: 0.66, b: 0.75, a: 1 },
    }))),
]);

const viewLogic = logic(view);

// ---- 鼠标 / 键盘交互：驱动 Button.state ----
let mouseX = 0;
let mouseY = 0;
/** 鼠标是否在画布内——离开后不能再用最后坐标判定（否则会误报 over） */
let mouseInside = false;
let mouseDown = false;
/** 按下的视觉至少保持到该时刻——单击时 down 只有一瞬，看不到反馈 */
let downHoldUntil = 0;
let disabled = false;

/** 命中检测：按钮的 Bg 子对象（UI 的 worldRayIntersection 用画布鼠标射线做 2D 包围盒判定） */
const hitRay: Ray3 = { __type__: 'Line3', origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };
function hitButton(): boolean
{
    // 鼠标不在画布内：按"未命中"处理
    if (!mouseInside) return false;

    // 每帧重新查 Bg 的渲染器：状态写回会替换子对象数据，不能缓存组件引用
    const entity = logic(buttonObject).entity as Object3D | null;
    const bg = entity?.children?.find((child) => child.name === 'Bg') as Object3D | undefined;
    const renderer = bg?.components?.find((component) => component.__type__ === 'CanvasRenderer') as CanvasRenderer | undefined;
    if (!renderer) return false;

    // drawCanvas 现在只做一件事：把画布内鼠标位置换算成各 Canvas 的鼠标射线（拾取用）
    drawCanvas(view, { x: mouseX, y: mouseY });

    return !!logic(renderer).worldRayIntersection(hitRay);
}

webgpuCanvas.addEventListener('mouseenter', () => { mouseInside = true; });
webgpuCanvas.addEventListener('mousemove', (e) =>
{
    mouseInside = true;
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});
webgpuCanvas.addEventListener('mouseleave', () =>
{
    // 鼠标离开画布（示例挂在 #ButtonTest 的 iframe 里时，也可能是移出 iframe）：
    // 必须就地结束按下——否则"按住后拖出去松开"收不到 mouseup，按钮会永久停在 down。
    mouseInside = false;
    mouseDown = false;
    downHoldUntil = 0;
});
webgpuCanvas.addEventListener('mousedown', (e) =>
{
    mouseInside = true;
    mouseDown = true;
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});
// mouseup 绑在 window 上：鼠标在 canvas 之外松开时，canvas 收不到这个事件
// （那正是"按住 → 拖出去松开 → 按钮卡在 down"的成因）。
window.addEventListener('mouseup', () =>
{
    mouseDown = false;
    // 让按下状态多停一小会儿：单击时 down 只持续一瞬，视觉上等于没有反馈
    downHoldUntil = performance.now() + 160;
});

// disabled 由键盘 D 切换。
//
// 这里**刻意不用单击**：早先的实现是"点一下切到 disabled"，于是用户点过一次之后，
// 再悬停 / 再按住都停在灰色的 disabled 上——看起来就像"这个按钮坏了"。
window.addEventListener('keydown', (e) =>
{
    if (e.key === 'd' || e.key === 'D') disabled = !disabled;
});

ticker.onframe(() =>
{
    const over = hitButton();
    const holdingDown = mouseDown || performance.now() < downHoldUntil;
    const next = disabled
        ? ButtonState.disabled
        : (holdingDown && over ? ButtonState.down : (over ? ButtonState.over : ButtonState.up));

    if (button.state !== next) reactive(button).state = next;

    const label = disabled ? `state: ${next}（按 D 恢复）` : `state: ${next}`;
    if (stateText.text !== label) reactive(stateText).text = label;

    webgpu.submit(viewLogic.submit);
});
