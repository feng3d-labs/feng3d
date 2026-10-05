import { registerViewPass } from 'feng3d';
import type { Object3D, Renderable, View, ViewPassContext, ViewPassProvider } from 'feng3d';
import { logic as getLogic } from '@feng3d/reactivity';
// 副作用导入：Canvas / CanvasRenderer / Transform2D 是纯数据类型，行为要靠各自的
// registerLogic 与 registerComponentType；只用作类型标注的 import 会被转译器整条擦除。
import './Canvas';
import './CanvasRenderer';
import './Transform2D';
import type { Canvas } from './Canvas';
import type { CanvasRenderer } from './CanvasRenderer';

/**
 * UI 的独立渲染 Pass（方案 C：UI 有自己的 Pass，相机无关的正交投影，布局由 Pass 驱动）。
 *
 * ## 为什么是独立 Pass
 *
 * UI 的顶点是**画布像素空间**几何，与 3D 相机的视锥 / 位置无关：
 * - 若照旧混在主场景渲染列表里，UI 会受 3D 相机的**视锥剔除**影响（像素坐标的包围盒
 *   通常落在视锥之外，整棵 UI 子树不进列表）——本 Pass 自己收集，天然脱离剔除；
 * - 主场景的半透明分组按「到相机的距离」排序，UI 之间因此**没有层级序**（只能靠给背景
 *   一个很负的 z 凑）——本 Pass 按**树序**（前序遍历：父先画、子后画、同层按 children 顺序）
 *   收集，这就是真正的层级序；
 * - 覆盖关系由 Pass 顺序保证：本 Pass 排在主 Pass 之后，颜色附件 `loadOp: 'load'`
 *   保留已画好的主场景，所以 UI 一定画在 3D 之上（不依赖深度）。
 *
 * ## 两半职责
 *
 * - {@link updateUI}（每帧准备，在渲染链求值**之前**）：把画布尺寸同步到每个 Canvas，
 *   驱动 `TransformLayout` 的锚点布局——"布局由 Pass 驱动"；
 * - {@link collectUI}（求值期间，只读）：按层级序收集本帧要画的 UI 渲染器。
 *
 * 两者都经 {@link uiPassProvider} 注册到 `feng3d` 的 View pass 注册表；
 * `CanvasRenderer` 用 `registerComponentType(..., { renderPass: 'ui' })` 登记，
 * 因此主场景渲染列表会跳过它（**拾取列表不受影响**），不会重复绘制。
 */

/**
 * 收集场景里所有可见的 Canvas 组件（树序）。
 *
 * @param view 视图
 * @returns 可见的 Canvas 组件列表
 */
function collectCanvases(view: View): Canvas[]
{
    const sceneEntity = getLogic(getLogic(view).scene).entity as Object3D | null;
    if (!sceneEntity) return [];

    return getLogic(sceneEntity)
        .getComponentsInChildren<Canvas>('Canvas')
        .filter((v) => getLogic(v).isVisibleAndEnabled.value);
}

/**
 * 收集一个 Canvas 子树里所有可见的 UI 渲染器。
 *
 * `getComponentsInChildren` 是前序遍历（父先子后、同层按 `children` 顺序），
 * 正好是 UI 的层级序：先画的在下、后画的覆盖在上面。
 *
 * @param canvas 画布组件
 * @returns 可见的 UI 渲染器列表（层级序）
 */
function collectRenderers(canvas: Canvas): CanvasRenderer[]
{
    const canvasEntity = getLogic(canvas).entity as Object3D | null;
    if (!canvasEntity) return [];

    return getLogic(canvasEntity)
        .getComponentsInChildren<CanvasRenderer>('CanvasRenderer')
        .filter((v) => getLogic(v).isVisibleAndEnabled.value);
}

/**
 * UI Pass 的每帧准备：把画布尺寸同步到每个 Canvas（写 2D 变换 + 通知子树重算锚点布局）。
 *
 * 必须在渲染链求值**之前**完成（由 `ViewLogic.updateView` 调用）：布局写入若发生在
 * computed 求值期间，等于在求值里写回自己依赖的字段（自激失效）。
 *
 * @param view 视图
 * @param context pass 上下文（含宿主画布元素）
 */
function updateUI(view: View, context: ViewPassContext): void
{
    const { canvas } = context;
    // 画布尺寸为 0 时跳过：`layout` 会算 `2 / 0` 的投影矩阵（Infinity）。
    // `ViewLogic` 已经保证 canvas.width/height 不为 0（会保留上一次的有效尺寸），这里只作兜底。
    if (canvas.width <= 0 || canvas.height <= 0) return;

    const canvases = collectCanvases(view);
    for (let i = 0; i < canvases.length; i++)
    {
        getLogic(canvases[i]).layout(canvas.width, canvas.height);
    }
}

/**
 * UI Pass 的收集：按层级序返回本帧要画的 UI 渲染器（只读，建立响应式依赖）。
 *
 * @param view 视图
 * @returns 渲染对象列表（层级序）
 */
function collectUI(view: View): readonly Renderable[]
{
    const renderables: Renderable[] = [];
    const canvases = collectCanvases(view);
    for (let i = 0; i < canvases.length; i++)
    {
        const renderers = collectRenderers(canvases[i]);
        for (let j = 0; j < renderers.length; j++)
        {
            renderables.push(renderers[j]);
        }
    }

    return renderables;
}

/**
 * UI Pass 提供者：注册到 `feng3d` 的 View pass 注册表。
 *
 * `name` 与组件的 `registerComponentType(..., { renderPass: 'ui' })` 对应。
 */
export const uiPassProvider: ViewPassProvider = {
    name: 'ui',
    update: updateUI,
    collect: collectUI,
};

// 模块顶层注册（与 registerLogic / registerComponentType 同一模式：上层包在 import 时接入引擎）
registerViewPass(uiPassProvider);
