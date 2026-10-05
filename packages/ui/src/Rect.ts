import { Component3D, Component3DLogic, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import { reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Color4 } from '@feng3d/math';
import { uiUniforms } from './core/UIMaterial';
// 副作用导入：`createRectObject3D()` 返回的纯数据字面量要在运行时分发到 Transform2DLogic /
// CanvasRendererLogic；只用作类型标注的 import 会被转译器整条擦除，那样它们的 registerLogic
// 就不会执行（`logic({ __type__: 'Transform2D' })` 返回 null）。
import './core/CanvasRenderer';
import './core/Transform2D';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Rect: Rect;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Rect: RectLogic;
    }
}

/**
 * 矩形纯色组件（纯数据接口）。
 *
 * 用于填充 UI 中背景等颜色。渲染行为由 {@link RectLogic} 提供：把 `color` 写进 UI uniform。
 * 字段一律 `readonly`，修改经 `reactive(rect).field = value` 写入。
 */
export interface Rect extends Component3D
{
    readonly __type__: 'Rect';

    /**
     * 填充颜色（缺失时按白色处理，见 {@link rectLogic} 工厂）。
     */
    readonly color?: Color4;
}

/**
 * Rect 逻辑接口。
 *
 * 迁移前 `Rect` 是 `Component` 子类，`beforeRender` 直接写
 * `renderObject.uniforms.u_color`；本接口保留同一语义，uniform 容器改由
 * {@link uiUniforms} 按需创建（渲染链按 `components` 顺序分发，谁先写谁创建）。
 */
export interface RectLogic extends Component3DLogic
{
}

/**
 * 工厂函数：RectLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 原构造函数体：`color` 字段默认值由工厂补（写在 raw 数据上）。
 *
 * @param data 矩形组件数据（raw）
 */
export function rectLogic(data: Rect): RectLogic
{
    // §11.5：构造参数字段可选，默认值由 Logic 工厂补（写在 raw 数据上）。
    // 迁移前字段初始值是 `new Color4()`——旧 Color4 class 的默认值是**白色**
    // （`r = g = b = a = 1`，见 packages/math/src/color/color4.ts 文件头关于 `a` 的说明），
    // 不是黑色，故字面量按 1/1/1/1 补齐。
    const writable = data as UnReadonly<Rect>;
    if (writable.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

    const { state, members } = createComponentLogicBase(data);

    const logic: RectLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        init(entity) { members.init(entity); },
        beforeRender(renderObject)
        {
            members.beforeRender(renderObject);

            // 经响应式代理写入（容器是 UIMaterial 的 uniform 数据源，见 Transform2DLogic.beforeRender）
            const r_uniforms = reactive(uiUniforms(renderObject));
            r_uniforms.u_color = data.color;
        },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('Rect', rectLogic);

// 登记组件类型（理由见 core/CanvasRenderer.ts）：Rect 是 Component3D（进而 Component）的子类型。
registerComponentType('Rect', { baseTypes: ['Component3D'] });

/**
 * 创建矩形对象（带 2D 变换、画布渲染器与矩形组件的 Object3D 字面量）。
 *
 * 迁移前这里是 `registerPrimitive('Rect', handler)`：把「如何拼装一个 Rect 对象」注册进
 * 原语注册表，供 `Object3D.createPrimitive('Rect')` / 层级面板右键菜单取用。主仓已整体移除
 * primitive 体系（`registerPrimitive` / `createPrimitive` / `MixinsPrimitiveObject3D` 都不存在），
 * 故与 `core/Canvas.ts` 的 `createCanvasObject3D()` 同形态，改为直接返回纯数据字面量；编辑器侧若要恢复
 * 「新建 UI 对象」菜单，需要另行接线（见本批迁移报告）。
 *
 * 迁移前回调里的 `size.x = 100` / `size.y = 100` 逐分量写入，纯数据字面量改为整体声明。
 *
 * @returns 含 Transform2D（100×100）、CanvasRenderer 与 Rect 组件的 Object3D 数据
 */
export function createRectObject3D(): Object3D
{
    return {
        __type__: 'Object3D',
        components: [
            { __type__: 'Transform2D', size: { x: 100, y: 100 } },
            { __type__: 'CanvasRenderer' },
            { __type__: 'Rect' },
        ],
    };
}
