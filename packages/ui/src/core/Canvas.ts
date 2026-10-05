import { Behaviour, BehaviourLogic, createBehaviourLogicBase, Object3D, registerComponentType } from 'feng3d';
import { logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import {
    mat4AppendScale,
    mat4AppendTranslation,
    mat4Identity,
    Matrix4x4,
    Ray3,
    Vector2Like,
    WritableLine3Like,
} from '@feng3d/math';
import { UIRenderMode } from '../enums/UIRenderMode';
import { getTransform2D } from './Transform2D';
import type { TransformLayout, TransformLayoutLogic } from 'feng3d';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Canvas: Canvas;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Canvas: CanvasLogic;
    }
}

/**
 * Element that can be used for screen rendering.
 *
 * 能够被用于屏幕渲染的元素（纯数据接口）。
 *
 * 行为由 {@link CanvasLogic} 提供：布局（写 2D 变换与宿主对象的变换）、投影矩阵、鼠标射线。
 * 字段一律 `readonly`，修改经 `reactive(canvas).field = value` 写入。
 */
export interface Canvas extends Behaviour
{
    readonly __type__: 'Canvas';

    /**
     * Is the Canvas in World or Overlay mode?
     *
     * 画布是在世界或覆盖模式（缺失时按 {@link UIRenderMode.ScreenSpaceOverlay} 处理）。
     */
    readonly renderMode?: UIRenderMode;

    /**
     * 最近距离（缺失时按 -1000 处理）
     */
    readonly near?: number;

    /**
     * 最远距离（缺失时按 10000 处理）
     */
    readonly far?: number;
}

/**
 * Canvas 逻辑接口。
 *
 * 投影矩阵与鼠标射线是**行为派生的内部状态**（迁移前是组件上的可变字段，
 * 但它们并不参与序列化），按根规范 §11.2 收进 logic，对外只读。
 */
export interface CanvasLogic extends BehaviourLogic
{
    /** 鼠标射线（只读；origin 为画布内鼠标位置，direction 为 +Z） */
    readonly mouseRay: Ray3;

    /** 投影矩阵（只读；{@link layout} 时更新） */
    readonly projection: Matrix4x4;

    /**
     * 更新布局
     *
     * 把画布尺寸写到 2D 变换上，并把宿主对象的位移/旋转/缩放复位，
     * 最后按画布尺寸与 near/far 重算投影矩阵。
     *
     * @param width 画布宽度
     * @param height 画布高度
     */
    layout(width: number, height: number): void;

    /**
     * 计算鼠标射线
     *
     * @param mousePos 鼠标位置（画布内坐标，`x` / `y`）
     */
    calcMouseRay3D(mousePos: Vector2Like): void;
}

/**
 * 工厂函数：CanvasLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 原构造函数体：装配纯数据引用与鼠标射线 / 投影矩阵的初始值。
 *
 * @param data 画布组件数据（raw）
 */
/**
 * 让子树里的 2D 布局重新计算（画布尺寸变化时调用）。
 *
 * ## 为什么必须显式通知
 *
 * UI 的相对锚点布局（`TransformLayoutLogic.updateLayout`）在计算时读的是**父级布局组件的
 * 原始字段**（`parent.components.find(TransformLayout).size / pivot`），**不建立响应式依赖**；
 * 而它自身只在「自己的字段变化」或「被显式 `invalidateLayout`」时才执行。于是画布尺寸
 * 从默认的 `1×1` 变成真实尺寸时，子级**不会**重算——表现为整棵 UI 死在第 1 帧的错位布局上。
 *
 * 迁移前这条链由 `View.prototype.render` 每帧调 `CanvasRenderer.draw(view)` 驱动；
 * 该钩子已随 `polyfill/View.ts` 删除，所以由画布自己负责通知（只在尺寸真的变化时，
 * 不影响"静态场景零重算"）。
 *
 * @param logic 画布 logic
 */
function invalidateDescendantLayouts(logic: CanvasLogic): void
{
    const entity = logic.entity;
    if (!entity) return;

    // includeInactive = true：被禁用/不可见的 UI 元素同样要在尺寸变化后重算布局，
    // 否则重新启用时会停在旧位置上。
    const layouts = getLogic(entity).getComponentsInChildren<TransformLayout>('TransformLayout', true);

    for (let i = 0; i < layouts.length; i++)
    {
        (getLogic(layouts[i]) as TransformLayoutLogic).invalidateLayout();
    }
}

export function canvasLogic(data: Canvas): CanvasLogic
{
    const { members } = createBehaviourLogicBase(data);

    /**
     * 鼠标射线（与鼠标重叠的摄像机射线）。
     *
     * 用可写形状持有：{@link calcMouseRay3D} 就地更新 origin 的分量，
     * 与迁移前的 `mouseRay.origin.set(...)` 语义一致（对象身份不变）。
     */
    const mouseRay: WritableLine3Like = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };

    /** 投影矩阵（{@link layout} 时按画布尺寸与 near/far 重算） */
    const projection: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };

    /** 上次布局的画布宽（`-1` 表示还没布局过；用于判断子树是否需要重新布局） */
    let layoutWidth = -1;

    /** 上次布局的画布高（`-1` 表示还没布局过） */
    let layoutHeight = -1;

    const logic: CanvasLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get mouseRay() { return mouseRay as Ray3; },
        get projection() { return projection; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
        layout(width, height)
        {
            const worldSpace = (reactive(data).renderMode ?? UIRenderMode.ScreenSpaceOverlay) === UIRenderMode.WorldSpace;
            const entity = logic.entity;
            if (entity)
            {
                const transform2D = getTransform2D(entity);
                if (transform2D)
                {
                    // 迁移前逐分量赋值（size.x / size.y / pivot.set）；纯数据字段只读，改为整体写入。
                    //
                    // pivot 决定"画布像素原点在哪"：
                    // - 屏幕空间（默认）用 (0, 0)：像素原点在左上，UI 坐标直接对应屏幕；
                    // - 世界空间用 (0.5, 0.5)：像素原点在画布中心，于是画布中心正好落在
                    //   宿主 Object3D 的位置上（UI 挂上去时不会整体偏半个画布）。
                    const r_transform2D = reactive(transform2D);
                    r_transform2D.size = { x: width, y: height };
                    r_transform2D.pivot = worldSpace ? { x: 0.5, y: 0.5 } : { x: 0, y: 0 };
                }

                // 迁移前写的是已删除的 Transform 组件，主仓的变换数据直接挂在 Object3D 上。
                //
                // ⚠️ 只对**屏幕空间**画布复位：屏幕空间画布钉在"画布像素原点"，宿主变换必须是单位变换；
                // 世界空间画布（UIRenderMode.WorldSpace）的位置 / 旋转 / 缩放就是它在 3D 里的摆放，
                // 复位会把平面打回原点、缩放到 1 倍（UI 于是贴在屏幕空间而不是那个平面上）。
                if (!worldSpace)
                {
                    const r_entity = reactive(entity);
                    r_entity.position = { x: 0, y: 0, z: 0 };
                    r_entity.rotation = { x: 0, y: 0, z: 0 };
                    r_entity.scale = { x: 1, y: 1, z: 1 };
                }
            }

            const r_data = reactive(data);
            const near = r_data.near ?? -1000;
            const far = r_data.far ?? 10000;

            // 阶段 C-e：Matrix4x4 的链式方法已删除，改用纯函数（out 传自身 = 原地运算，与旧链式语义一致）
            mat4Identity(projection);
            mat4AppendTranslation(projection, 0, 0, -(far + near) / 2, projection);
            mat4AppendScale(projection, 2 / width, -2 / height, 2 / (far - near), undefined, projection);
            mat4AppendTranslation(projection, -1, 1, 0, projection);

            // 画布尺寸变化 → 子树的锚点布局需要重算（原因见 invalidateDescendantLayouts）。
            // 首次布局时 layoutWidth / layoutHeight 为 -1，必然进入本分支。
            if (layoutWidth !== width || layoutHeight !== height)
            {
                layoutWidth = width;
                layoutHeight = height;
                invalidateDescendantLayouts(logic);
            }
        },
        calcMouseRay3D(mousePos)
        {
            // 迁移前签名是 `calcMouseRay3D(view: View)` 并读 `view.mousePos`；
            // 主仓 View 已无 mousePos 字段（鼠标位置由输入层持有），故改为显式传入。
            mouseRay.origin.x = mousePos.x;
            mouseRay.origin.y = mousePos.y;
            mouseRay.origin.z = 0;
        },
    };

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('Canvas', canvasLogic);

// 登记组件类型（理由见 core/CanvasRenderer.ts）：Canvas 是 Behaviour 的子类型，
// 不登记则 `Scene.behaviours` / `getComponentsInChildren('Behaviour')` 扫不到它。
registerComponentType('Canvas', { baseTypes: ['Behaviour'] });

/**
 * 创建 Canvas 对象（带 2D 变换与画布组件的 Object3D 字面量）。
 *
 * 迁移前这里是 `registerPrimitive('Canvas', handler)`：把「如何拼装一个 Canvas 对象」
 * 注册进原语注册表，供 `Object3D.createPrimitive('Canvas')` / 层级面板右键菜单取用。
 * 主仓已整体移除 primitive 体系（`registerPrimitive` / `createPrimitive` /
 * `MixinsPrimitiveObject3D` 都不存在），故改为直接返回纯数据字面量；
 * 编辑器侧若要恢复「新建 UI 对象」菜单，需要另行接线（见本批迁移报告）。
 *
 * @returns 含 Transform2D 与 Canvas 组件的 Object3D 数据
 */
export function createCanvasObject3D(): Object3D
{
    return {
        __type__: 'Object3D',
        components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
    };
}