import type { Computed } from '@feng3d/reactivity';
import type { PassEncoder, RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../../cameras/Camera';
import type { View } from '../../core/View';
import type { Scene } from '../../scene/Scene';

/**
 * 一帧渲染的序列声明（issue #93：pass 编排声明化）。
 *
 * 背景：pass 顺序原先硬编码在 `View` 的 `submitComputed` 里（阴影在前、主 Pass 在后），
 * 新增一个渲染模块必须改核心编排代码。本模块把「一帧里有哪些 pass、按什么顺序、
 * 每个 pass 里有哪些 RenderObject」抽成**注册表 + 数据声明**：
 *
 * - **贡献者（contributor）**：按名字注册，只描述「我能产出什么」，不关心自己排第几；
 * - **序列（sequence）**：`View.passes` / `View.renderObjects` 给出名字顺序，
 *   缺省用 {@link getDefaultPassSequence} / {@link getDefaultObjectSequence}；
 * - `View` 的渲染链只做「按名字查表 + 按顺序拼接」，不再认识任何具体 renderer。
 *
 * 有意**不做**完整 FrameGraph：没有资源别名、没有跨 pass 依赖推导、没有自动裁剪。
 * 够用的理由是 feng3d 的 pass 之间只有「写 shadowMap → 采样」这一条真实依赖，
 * 而它由**顺序**表达就够（阴影在前）。
 */

/** 主 pass 的固定名（内置项：它由 View 自身构造，不由注册表提供） */
export const VIEW_MAIN_PASS = 'main';

/** 主 pass 内天空盒对象的固定名（内置项：每个 View 各有一份，不能模块级注册） */
export const VIEW_SKYBOX_OBJECT = 'SkyBox';

/** 额外 pass 聚合器的固定名（内置项：把 `registerViewPass` 注册的提供者聚合成一条序列） */
export const VIEW_EXTRA_PASS = 'extra';

/**
 * 贡献者构建时收到的上下文。
 *
 * `viewport` 保持 **computed**（不是值）：`ForwardRenderer.draw` 内部读 `viewport.value`
 * 建立响应式依赖，画布尺寸变化时那一层 computed 才会失效；传值会把这条依赖掐断。
 */
export interface ViewRenderContext
{
    /** 场景 */
    readonly scene: Scene;
    /** 相机 */
    readonly camera: Camera;
    /** 画布像素尺寸（响应式） */
    readonly viewport: Computed<readonly [number, number]>;
    /** 宿主画布元素 */
    readonly canvas: HTMLCanvasElement;
}

/** pass 级贡献者在序列里的位置（相对主 pass） */
export type ViewPassStage = 'beforeMain' | 'afterMain';

/**
 * pass 级贡献者：产出一段 `PassEncoder` 序列。
 *
 * 典型用法是「自带 pass 的渲染模块」（阴影、后处理、UI 叠加层）。
 * 一个贡献者可以产出**多个** pass（阴影按光源数产出），也可以产出空数组（本帧无内容）。
 */
export interface ViewPassContributor
{
    /** 序列里引用的名字（同名重复注册时后者覆盖前者） */
    readonly name: string;
    /** 相对主 pass 的位置，缺省 'afterMain' */
    readonly stage?: ViewPassStage;
    /**
     * 产出本帧的 pass 序列。
     *
     * 调用发生在渲染链求值期间，本方法必须**只读**：读到的场景 / 相机数据会建立响应式依赖。
     *
     * @param view 视图数据
     * @param context 渲染上下文
     * @returns pass 序列（顺序即执行顺序）
     */
    build(view: View, context: ViewRenderContext): readonly PassEncoder[];
}

/**
 * 主 pass 内的对象贡献者：产出 `RenderObject` 列表。
 *
 * 这类贡献者共享**同一个**主 pass（颜色 / 深度附件相同），因此它们之间只有绘制顺序，
 * 不产生新的 pass。典型用法：主场景（Forward）、轮廓、线框。
 */
export interface ViewObjectContributor
{
    /** 序列里引用的名字（同名重复注册时后者覆盖前者） */
    readonly name: string;
    /**
     * 产出本帧的渲染对象（按绘制顺序，先画的在前）。
     *
     * 与 {@link ViewPassContributor.build} 同样必须**只读**。
     *
     * @param view 视图数据
     * @param context 渲染上下文
     * @returns 渲染对象列表；返回空数组表示本帧无内容
     */
    build(view: View, context: ViewRenderContext): readonly RenderObject[];
}

/** pass 级贡献者注册表（lazy-init，R2：import 期创建缓存会被门禁拦下） */
let _passContributors: ViewPassContributor[] | null = null;

/** 对象级贡献者注册表（lazy-init，理由同上） */
let _objectContributors: ViewObjectContributor[] | null = null;

function getPassContributors(): ViewPassContributor[]
{
    if (!_passContributors) _passContributors = [];

    return _passContributors;
}

function getObjectContributors(): ViewObjectContributor[]
{
    if (!_objectContributors) _objectContributors = [];

    return _objectContributors;
}

/**
 * 注册一个 pass 级贡献者（渲染模块在自己的模块里登记，例如 `ShadowRenderer`）。
 *
 * 注册本身**不决定位置**：位置由 `View.passes` 的声明顺序（或默认序列）给出。
 * 同名重复注册时后者覆盖前者，不产生两条序列项。
 *
 * @param contributor pass 贡献者
 */
export function registerViewPassContributor(contributor: ViewPassContributor): void
{
    const list = getPassContributors();
    const index = list.findIndex((p) => p.name === contributor.name);

    if (index >= 0) list[index] = contributor;
    else list.push(contributor);
}

/**
 * 注册一个主 pass 内的对象贡献者（例如 `ForwardRenderer` / `OutlineRenderer`）。
 *
 * @param contributor 对象贡献者
 */
export function registerViewObjectContributor(contributor: ViewObjectContributor): void
{
    const list = getObjectContributors();
    const index = list.findIndex((c) => c.name === contributor.name);

    if (index >= 0) list[index] = contributor;
    else list.push(contributor);
}

/**
 * 按名字取 pass 贡献者。
 *
 * @param name 贡献者名
 * @returns 贡献者；未注册时返回 undefined
 */
export function findViewPassContributor(name: string): ViewPassContributor | undefined
{
    return getPassContributors().find((c) => c.name === name);
}

/**
 * 按名字取对象贡献者。
 *
 * @param name 贡献者名
 * @returns 贡献者；未注册时返回 undefined
 */
export function findViewObjectContributor(name: string): ViewObjectContributor | undefined
{
    return getObjectContributors().find((c) => c.name === name);
}

/**
 * 默认 pass 序列：所有 `beforeMain` 贡献者（按注册序）→ 主 pass → 所有 `afterMain` 贡献者（按注册序）。
 *
 * 这是「新增 pass 不必改核心编排」的落点：只注册、不声明，就自动落在主 pass 之前 / 之后。
 *
 * @returns 贡献者名序列（含 {@link VIEW_MAIN_PASS}）
 */
export function getDefaultPassSequence(): readonly string[]
{
    const sequence: string[] = [];
    const contributors = getPassContributors();

    for (let i = 0; i < contributors.length; i++)
    {
        if ((contributors[i].stage ?? 'afterMain') === 'beforeMain') sequence.push(contributors[i].name);
    }
    sequence.push(VIEW_MAIN_PASS);
    for (let i = 0; i < contributors.length; i++)
    {
        if ((contributors[i].stage ?? 'afterMain') !== 'beforeMain') sequence.push(contributors[i].name);
    }

    return sequence;
}

/**
 * 默认的主 pass 内对象序列。
 *
 * 顺序即绘制顺序：天空盒打底 → 主场景（Forward）→ 轮廓 → 线框。
 * 每次返回**新数组**，避免调用方改写共享常量。
 *
 * **Mouse 不在其中**：GPU 拾取已由 CPU 射线（Mouse3DManager + Raycaster）取代，
 * `MouseRenderer.draw()` 恒返回 null——把它塞进序列只会留下一条恒空的遍历。
 * 声明化之后「某个 renderer 不占位」由**它不注册贡献者**表达，而不是编排代码里的特例；
 * 将来要恢复它，注册一个对象贡献者并把名字写进 `View.renderObjects` 即可，核心不动。
 *
 * @returns 贡献者名序列
 */
export function getDefaultObjectSequence(): readonly string[]
{
    return [VIEW_SKYBOX_OBJECT, 'Forward', 'Outline', 'Wireframe'];
}

/**
 * 解析一帧的 pass 序列（issue #93）。
 *
 * 显式声明（`View.passes`）优先——**声明即接管整条序列**，没列进去的贡献者本帧不执行；
 * 未声明时用 {@link getDefaultPassSequence}（所有 beforeMain → main → 所有 afterMain）。
 *
 * @param view 视图数据
 * @returns 贡献者名序列（含 {@link VIEW_MAIN_PASS}）
 */
export function resolveViewPassSequence(view: View): readonly string[]
{
    return view.passes ?? getDefaultPassSequence();
}

/**
 * 解析主 pass 内的对象序列（issue #93）。
 *
 * @param view 视图数据
 * @returns 对象贡献者名序列
 */
export function resolveViewObjectSequence(view: View): readonly string[]
{
    return view.renderObjects ?? getDefaultObjectSequence();
}