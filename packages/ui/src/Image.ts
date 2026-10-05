import { Component3D, Component3DLogic, createComponentLogicBase, defaultTexture, Object3D, registerComponentType, resolveTexture, TextureField } from 'feng3d';
import { reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Color4 } from '@feng3d/math';
import { uiUniforms } from './core/UIMaterial';
import { getTransform2D } from './core/Transform2D';
// 副作用导入：`createImageObject3D()` 返回的纯数据字面量要在运行时分发到 Transform2DLogic /
// CanvasRendererLogic；只用作类型标注的 import 会被转译器整条擦除，那样它们的 registerLogic
// 就不会执行（`logic({ __type__: 'Transform2D' })` 返回 null）。
import './core/CanvasRenderer';
import './core/Transform2D';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Image: Image;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Image: ImageLogic;
    }
}

/**
 * 图片组件（纯数据接口）。
 *
 * 用于显示图片。渲染行为由 {@link ImageLogic} 提供：把纹理与着色写进 UI uniform。
 * 字段一律 `readonly`，修改经 `reactive(image).field = value` 写入。
 */
export interface Image extends Component3D
{
    readonly __type__: 'Image';

    /**
     * The source texture of the Image element.
     *
     * 图像元素的源纹理（缺失时按 `defaultTexture` 处理，见 {@link imageLogic} 工厂）。
     *
     * 迁移前字段类型是已删除的 `Texture2D`、初始值 `Texture2D.default`（1×1 白色），
     * 现按主仓纹理新模型改用 `TextureField`（`Texture | TextureResource | undefined`），
     * 消费点用 `resolveTexture()` 惰性解析。
     */
    readonly image?: TextureField;

    /**
     * Tinting color for this Image.
     *
     * 为该图像着色（缺失时按白色处理）。
     */
    readonly color?: Color4;
}

/**
 * Image 逻辑接口。
 *
 * 迁移前 `Image` 是 `Component` 子类：字段初始值 + `beforeRender` 写 uniform + `setNativeSize()` 方法。
 * 纯数据接口不能挂方法，`setNativeSize()` 按 §11.2 收进本接口，字段默认值按 §11.5 在工厂里补齐。
 *
 * ⚠️ `setNativeSize()` 从组件方法变成 Logic 方法，调用方（编辑器属性面板按钮等）需改为
 * `logic(image).setNativeSize()`。
 */
export interface ImageLogic extends Component3DLogic
{
    /**
     * 使图片显示实际尺寸。
     *
     * 迁移前是 `Image` 上的 `@oav(...)` 方法，读 `this.image.getSize()`（已删除的 `Texture2D` API）
     * 后逐分量写 `this.transform2D.size.x` / `.y`；现改为读纹理 `descriptor.size`
     * （`TextureSize = readonly [width, height, depth?]`）并整体写 2D 变换的尺寸。
     */
    setNativeSize(): void;
}

/**
 * 工厂函数：ImageLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 原构造函数体：`image` / `color` 字段默认值由工厂补（写在 raw 数据上）。
 *
 * @param data 图片组件数据（raw）
 */
export function imageLogic(data: Image): ImageLogic
{
    // §11.5：构造参数字段可选，默认值由 Logic 工厂补（写在 raw 数据上）。
    // 迁移前的初始值：`image = Texture2D.default`（1×1 白色）→ `defaultTexture`；
    // `color = new Color4()`（旧 class 默认值是白色 r=g=b=a=1，不是黑色）。
    const writable = data as UnReadonly<Image>;
    if (writable.image === undefined) writable.image = defaultTexture;
    if (writable.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

    const { state, members } = createComponentLogicBase(data);

    const logic: ImageLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        init(entity) { members.init(entity); },
        beforeRender(renderObject)
        {
            members.beforeRender(renderObject);

            // 迁移前直接写 Texture2D 实例；现按主仓纹理模型在消费点解析
            // （`TextureResource` 走响应式缓存，`undefined` 回退占位纹理）
            // 经响应式代理写入（容器是 UIMaterial 的 uniform 数据源，见 Transform2DLogic.beforeRender）
            const r_uniforms = reactive(uiUniforms(renderObject));
            r_uniforms.s_texture = resolveTexture(data.image);
            r_uniforms.u_color = data.color;
        },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
        setNativeSize()
        {
            const entity = logic.entity;
            const transform2D = entity ? getTransform2D(entity) : null;
            if (!transform2D) return;

            const size = resolveTexture(data.image).descriptor.size;
            reactive(transform2D).size = { x: size[0], y: size[1] };
        },
    };

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('Image', imageLogic);

// 登记组件类型（理由见 core/CanvasRenderer.ts）：Image 是 Component3D（进而 Component）的子类型。
registerComponentType('Image', { baseTypes: ['Component3D'] });

/**
 * 创建图片对象（带 2D 变换、画布渲染器与图片组件的 Object3D 字面量）。
 *
 * 迁移前这里是 `registerPrimitive('Image', handler)`：把「如何拼装一个 Image 对象」注册进
 * 原语注册表，供 `Object3D.createPrimitive('Image')` / 层级面板右键菜单取用。主仓已整体移除
 * primitive 体系（`registerPrimitive` / `createPrimitive` / `MixinsPrimitiveObject3D` 都不存在），
 * 故与 `core/Canvas.ts` 的 `createCanvasObject3D()` 同形态，改为直接返回纯数据字面量；编辑器侧
 * 若要恢复「新建 UI 对象」菜单，需要另行接线（见本批迁移报告）。
 *
 * 迁移前回调里的 `size.x = 100` / `size.y = 100` 逐分量写入，纯数据字面量改为整体声明。
 *
 * @returns 含 Transform2D（100×100）、CanvasRenderer 与 Image 组件的 Object3D 数据
 */
export function createImageObject3D(): Object3D
{
    return {
        __type__: 'Object3D',
        components: [
            { __type__: 'Transform2D', size: { x: 100, y: 100 } },
            { __type__: 'CanvasRenderer' },
            { __type__: 'Image' },
        ],
    };
}
