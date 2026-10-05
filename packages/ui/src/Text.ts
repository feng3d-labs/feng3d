import { Component3D, ComponentLogicBase, createTextureFromCanvas, Object3D, registerComponentType } from 'feng3d';
import { effect, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Vector4 } from '@feng3d/math';
import type { RenderObject, Texture } from '@feng3d/webgpu';
import { uiUniforms } from './core/UIMaterial';
import { getTransform2D } from './core/Transform2D';
import { drawText } from './text/drawText';
import { TextStyle } from './text/TextStyle';
// 副作用导入：`createTextObject3D()` 返回的纯数据字面量要在运行时分发到 Transform2DLogic /
// CanvasRendererLogic；只用作类型标注的 import 会被转译器整条擦除，那样它们的 registerLogic
// 就不会执行（`logic({ __type__: 'Transform2D' })` 返回 null）。
import './core/CanvasRenderer';
import './core/Transform2D';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Text: Text;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Text: TextLogic;
    }
}

/**
 * 文本组件（纯数据接口）。
 *
 * 用于显示文字。渲染行为由 {@link TextLogic} 提供：把文本画到画布、转成纹理后写进 UI uniform。
 * 字段一律 `readonly`，修改经 `reactive(text).field = value` 写入。
 *
 * 迁移前组件上的私有运行时状态（`_canvas` / `_image` / `_invalid` / `_uvRect`）按 §11.2
 * 收进 Logic（它们都不参与序列化：`_uvRect` 没有 `@serialize`）。
 */
export interface Text extends Component3D
{
    readonly __type__: 'Text';

    /**
     * 文本内容（缺失时按默认文案处理，见 {@link TextLogic} 构造）。
     */
    readonly text?: string;

    /**
     * 是否根据文本自动调整宽高（缺失时按 `true` 处理）。
     */
    readonly autoSize?: boolean;

    /**
     * 文本样式（缺失时由 Logic 新建 {@link TextStyle}）。
     *
     * `TextStyle` 目前仍是 `EventEmitter` 子类（不是纯数据接口）：它的字段变化经 `changed`
     * 事件通知，本批保持该机制，只去掉装饰器与内部 `new Color4()`。
     */
    readonly style?: TextStyle;
}

/**
 * Text 逻辑类。
 *
 * 迁移前 `Text` 是 `Component` 子类：构造时 `watcher.watch` 文本与样式变化，`beforeRender`
 * 里按需重绘、自动尺寸、写 `u_uvRect` / `s_texture`。本类保留同一流程，差异见方法内注释。
 */
export class TextLogic extends ComponentLogicBase
{
    /** 纯数据引用（对外只读） */
    readonly #data: Text;

    /** 上次绘制的画布（迁移前是组件上的 `_canvas` 字段） */
    #canvas: HTMLCanvasElement | null = null;

    /**
     * 文本纹理（迁移前是组件上的 `_image`：一个 `Texture2D` 实例，重绘时替换 `_pixels` 后就地失效）。
     *
     * 主仓的 `Texture` 是不可变纯数据（`descriptor` + `sources`），不能在原地换像素，
     * 故每次重绘用 `createTextureFromCanvas()` 新建一份（重绘只在文本/样式变化时发生）。
     */
    #texture: Texture | null = null;

    /** 是否需要重绘（迁移前是组件上的 `_invalid` 字段） */
    #invalid = true;

    /**
     * 显示区域（`z` = 宽度比例、`w` = 高度比例；迁移前是组件上的 `_uvRect`）。
     *
     * 由画布尺寸与 2D 尺寸派生的渲染中间数据，不参与序列化，按 §11.2 收进 Logic；
     * 就地更新分量（对象身份不变），与迁移前 `this._uvRect.z = ...` 语义一致。
     */
    readonly #uvRect: Vector4 = { __type__: 'Vector4', x: 0, y: 0, z: 1, w: 1 };

    /** 当前已挂 `changed` 监听的样式对象（`style` 被替换时换挂） */
    #watchedStyle: TextStyle | null = null;

    /** init 去重标志 */
    #inited = false;

    protected constructor(data: Text)
    {
        // §11.5：构造参数字段可选，默认值由 Logic 工厂补（写在 raw 数据上，放 super() 之前）。
        // 三个默认值逐字对应迁移前的字段初始值（`text` / `autoSize` / `style`）。
        const writable = data as UnReadonly<Text>;
        if (writable.text === undefined) writable.text = 'Hello 🌷 world\nHello 🌷 world';
        if (writable.autoSize === undefined) writable.autoSize = true;
        if (writable.style === undefined) writable.style = new TextStyle();

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Text): TextLogic
    {
        return new TextLogic(data);
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);
        if (this.#inited) return;
        this.#inited = true;

        this.#installInvalidate();
    }

    /**
     * 使文本失效（下次 `beforeRender` 重绘）。
     *
     * 迁移前是 `Text` 组件上的公开方法 `invalidate()`，两个 `watcher.watch` 与样式的
     * `changed` 事件都会调它。
     */
    invalidate(): void
    {
        this.#invalid = true;
    }

    override beforeRender(renderObject: RenderObject): void
    {
        super.beforeRender(renderObject);

        const data = this.#data;
        // 构造已按 §11.5 补默认值（`writable.style = new TextStyle()`），`style` 运行时一定存在；
        // strictNullChecks 下在这里显式收窄一次，不把非空断言散进绘制调用。
        const style = data.style;
        if (!style) return;

        let canvas = this.#canvas;

        if (!canvas || this.#invalid)
        {
            // 迁移前：`this._image['_pixels'] = canvas; this._image.invalidate();`
            // （往同一 Texture2D 上塞像素源并就地失效）。现按主仓纹理模型新建 Texture。
            canvas = this.#canvas = drawText(canvas, data.text, style);
            this.#texture = createTextureFromCanvas(canvas);
            this.#invalid = false;
        }

        const entity = this.entity as Object3D | null;
        const transform2D = entity ? getTransform2D(entity) : null;

        if (data.autoSize && transform2D)
        {
            // 迁移前逐分量写 `this.transform2D.size.x` / `.y`；纯数据字段只读，改为整体写入
            reactive(transform2D).size = { x: canvas.width, y: canvas.height };
        }

        // 调整缩放使得更改尺寸时文字不被缩放。（迁移前写 `this._uvRect.z` / `.w`）
        const size = transform2D?.size ?? { x: 1, y: 1 };
        const uvRect = this.#uvRect as UnReadonly<Vector4>;
        uvRect.z = size.x / canvas.width;
        uvRect.w = size.y / canvas.height;

        const uniforms = uiUniforms(renderObject);
        uniforms.s_texture = this.#texture;
        uniforms.u_uvRect = this.#uvRect;
    }

    /**
     * 安装「文本 / 样式变化 → 重绘」的失效监听。
     *
     * 迁移前是构造里的两个 `watcher.watch`：
     * - `watch(this, 'text', this.invalidate)` —— 文本变化即失效；
     * - `watch(this, 'style', this._styleChanged)` —— 样式对象被替换时改挂 `changed` 事件，
     *   样式**内部字段**的变化由 `TextStyle` 自己的 `watcher` 发出 `changed`。
     *
     * `effect` 在 init 时才装（与 `Transform2DLogic` 同批约定）：这样未挂载到对象上的裸组件
     * 不会留下无人回收的监听。
     */
    #installInvalidate(): void
    {
        const data = this.#data;

        // @过渡 effect：数据 → 运行时失效标志（文本变化时下次 beforeRender 重绘）
        effect(() =>
        {
            reactive(data).text;
            this.#invalid = true;
        });

        // @过渡 effect：数据 → 事件监听换挂（样式对象被替换时改挂 changed，
        // 样式内部字段变化仍由 TextStyle 的 watcher 发 changed 事件通知）
        effect(() =>
        {
            // 读响应式字段建立依赖；取值仍走 raw 对象——事件监听必须挂在 raw 对象上，
            // 否则 `on` 与 `TextStyle.emit` 里的 `this` 一个是代理、一个是原对象，
            // EventEmitter 按对象查监听表会查不到（见 @feng3d/event 的 on/off 实现）。
            reactive(data).style;
            const style = data.style ?? null;
            if (style === this.#watchedStyle) return;

            this.#watchedStyle?.off('changed', this.#onStyleChanged, this);
            style?.on('changed', this.#onStyleChanged, this);
            this.#watchedStyle = style;
        });
    }

    /** 样式变化回调（迁移前是 `Text._styleChanged` 里挂到样式上的 `this.invalidate`） */
    #onStyleChanged(): void
    {
        this.#invalid = true;
    }
}

// 注册到统一 logic 分发表
registerLogic('Text', TextLogic as unknown as new (data: Text) => TextLogic);

// 登记组件类型（理由见 core/CanvasRenderer.ts）：Text 是 Component3D（进而 Component）的子类型。
registerComponentType('Text', { baseTypes: ['Component3D'] });

/**
 * 创建文本对象（带 2D 变换、画布渲染器与文本组件的 Object3D 字面量）。
 *
 * 迁移前这里是 `registerPrimitive('Text', handler)`：把「如何拼装一个 Text 对象」注册进
 * 原语注册表，供 `Object3D.createPrimitive('Text')` / 层级面板右键菜单取用。主仓已整体移除
 * primitive 体系（`registerPrimitive` / `createPrimitive` / `MixinsPrimitiveObject3D` 都不存在），
 * 故与 `core/Canvas.ts` 的 `createCanvasObject3D()` 同形态，改为直接返回纯数据字面量；编辑器侧
 * 若要恢复「新建 UI 对象」菜单，需要另行接线（见本批迁移报告）。
 *
 * 迁移前回调里的 `size.x = 160` / `size.y = 30` 逐分量写入，纯数据字面量改为整体声明。
 *
 * @returns 含 Transform2D（160×30）、CanvasRenderer 与 Text 组件的 Object3D 数据
 */
export function createTextObject3D(): Object3D
{
    return {
        __type__: 'Object3D',
        components: [
            { __type__: 'Transform2D', size: { x: 160, y: 30 } },
            { __type__: 'CanvasRenderer' },
            { __type__: 'Text' },
        ],
    };
}
