import { ComponentLogicBase } from 'feng3d';
import type { Camera, Color4, Object3D, PerspectiveCamera, Ray3, Scene, Stats, View, ViewLogic } from 'feng3d';
import { logic as getLogic, reactive, ticker } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import type { Submit } from '@feng3d/webgpu';
import { EditorData } from '../global/EditorData';
import type { EditorComponent } from './EditorComponent';
import { hierarchy } from './hierarchy/Hierarchy';

/**
 * 编辑器视图。
 *
 * 迁移自旧写法 `class EditorView extends View`：主仓 `View` **已是纯数据 interface**
 * （运行时无值），`class X extends View` 会在**模块加载期**抛
 * `TypeError: Class extends value undefined`，导致整个模块图加载失败。
 *
 * 现按新范式实现（与 `Feng3dScreenShotRenderer` 同构）：
 * - `view`：纯数据 `{ __type__: 'View', canvas, root }`，`root` 即 {@link EditorView.root}；
 * - `viewLogic`：`logic(view)` 得到的渲染链入口，每帧读 `viewLogic.submit`；
 * - 渲染循环：`start()` 里 `ticker.onframe(...)` → `webgpu.submit(viewLogic.submit)`。
 *
 * **视图根的数据组织**（由调用方 `SceneView` 在构造后写入，随后 `logic(root)` 触发挂载）：
 * - `root.components`：视图 `Scene` 组件（渲染背景 / 环境光，`ViewLogic` 从 root 自身解析）；
 * - `root.children`：编辑器相机（**必须排在第一位**，`ViewLogic` 取子树第一个 Camera）、
 *   编辑器场景对象（网格 / 工具）、游戏场景对象。
 *
 * 游戏场景对象作为**子级**而非视图根本身，使游戏场景树保持干净：层级面板与
 * `保存场景`（序列化 `hierarchy.rootnode.object3D`）都不会带出编辑器对象。
 */
export class EditorView
{
    /**
     * 兼容旧 `View` 的类型判别字段。
     */
    readonly __type__ = 'View';

    /** 宿主画布 */
    readonly canvas: HTMLCanvasElement | string;

    /** 视图根 Object3D（渲染入口，见类注释的数据组织约定） */
    readonly root: Object3D;

    /** 编辑器相机（由 SceneView 注入） */
    camera: Camera | null = null;

    /** 当前游戏场景（由 SceneView 经 `EditorData` 同步） */
    scene: Scene | null = null;

    /** 编辑器场景（仅编辑器存在的对象：灯光图标、操作工具等） */
    editorScene: Scene | null = null;

    /** 编辑器模块组件（图标跟随逻辑） */
    editorComponent: EditorComponent | null = null;

    /** 编辑器模块组件的 logic */
    editorComponentLogic: ComponentLogicBase | null = null;

    /** Stats 实例（可选，由 SceneView 设置） */
    statsInstance: unknown;

    /** 线框颜色（画布上的选中对象线框） */
    readonly wireframeColor: Color4 = { __type__: 'Color4', r: 125 / 255, g: 176 / 255, b: 250 / 255, a: 1 };

    /**
     * 鼠标射线。
     *
     * TODO(P1 API 迁移)：旧 `View.render()` 每帧写入；新范式下改为按需现算——
     * `logic(cameraObject).local2world` + `logic(camera).getRay3D(ndcX, ndcY)`，
     * NDC 由 {@link EditorView.viewRect} 换算。拾取恢复前保持 null。
     */
    mouseRay3D: unknown = null;

    /** 选中对象（编辑器场景拾取结果） */
    selectedObject: { __type__?: string } | null = null;

    /** 纯数据视图（首次读取时构造，此时 root 必须已是最终形态） */
    #view: View | null = null;

    /** 视图 logic（渲染链入口） */
    #viewLogic: ViewLogic | null = null;

    /** WebGPU 实例（初始化完成前为 null，`render()` 跳过提交） */
    #webgpu: WebGPU | null = null;

    /** WebGPU 初始化 Promise（去重，避免每帧重复创建设备） */
    #webgpuInit: Promise<void> | null = null;

    /** 每帧渲染回调（`start()` / `stop()` 配对） */
    #frame: (() => void) | null = null;

    /**
     * @param canvas 宿主画布
     */
    constructor(canvas?: HTMLCanvasElement | string)
    {
        this.canvas = canvas ?? document.createElement('canvas');
        // 视图根：调用方随后写入视图 Scene 组件与各子对象（见类注释）
        this.root = {
            __type__: 'Object3D',
            name: 'editorViewRoot',
            components: [],
            children: [],
        };
    }

    /** 纯数据视图（`logic(view)` 的输入） */
    get view(): View
    {
        this.#view ||= { __type__: 'View', canvas: this.canvas, root: this.root };

        return this.#view;
    }

    /** 视图 logic（渲染链由响应式提交链承载） */
    get viewLogic(): ViewLogic
    {
        this.#viewLogic ||= getLogic(this.view);

        return this.#viewLogic;
    }

    /** 视图场景（`ViewLogic` 从 root 自身组件解析出的 Scene） */
    get viewScene(): Scene | null
    {
        return getLogic(this.root).getComponent<Scene>('Scene') ?? null;
    }

    /**
     * 视图矩形（屏幕坐标）。
     *
     * 旧 `View.viewRect` 的等价物：编辑器鼠标交互（旋转 / 拖拽场景相机）按它换算位移。
     */
    get viewRect(): { x: number, y: number, width: number, height: number }
    {
        const canvas = typeof this.canvas === 'string'
            ? document.getElementById(this.canvas) as HTMLCanvasElement | null
            : this.canvas;
        const rect = canvas?.getBoundingClientRect();

        return {
            x: rect?.left ?? 0,
            y: rect?.top ?? 0,
            width: rect?.width ?? 0,
            height: rect?.height ?? 0,
        };
    }

    /**
     * 同步画布显示尺寸。
     *
     * 渲染分辨率由 `ViewLogic` 每帧按 `canvas.clientWidth/Height` 同步，这里只写 CSS 尺寸
     * （宿主布局给了 0 尺寸时兜底）。
     *
     * @param width 显示宽度（像素）
     * @param height 显示高度（像素）
     */
    setSize(width: number, height: number): void
    {
        if (typeof this.canvas === 'string') return;

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /** 启动渲染循环（每帧提交一次视图） */
    start(): void
    {
        if (this.#frame) return;

        this.#ensureWebGPU();
        const frame = () => { this.render(); };
        this.#frame = frame;
        ticker.onframe(frame);
    }

    /** 停止渲染循环 */
    stop(): void
    {
        if (!this.#frame) return;

        ticker.offframe(this.#frame);
        this.#frame = null;
    }

    /** WebGPU 懒初始化（失败只记录一次；渲染循环继续运行但不提交） */
    #ensureWebGPU(): void
    {
        if (this.#webgpuInit) return;

        this.#webgpuInit = new WebGPU({ canvasId: this.canvas }).init()
            .then((webgpu) =>
            {
                this.#webgpu = webgpu;
            })
            .catch((e) =>
            {
                console.error('[EditorView] WebGPU 初始化失败：', e);
            });
    }

    /**
     * 提交一个附属视图（复用编辑器已初始化的 WebGPU 设备）。
     *
     * 供编辑器内的独立小视图（如右上角场景旋转工具）使用，避免为每个小画布各建一个设备；
     * 设备尚未就绪时静默跳过（下一帧再提交）。
     *
     * @param submit 视图提交对象（`viewLogic.submit`）
     */
    submit(submit: Submit): void
    {
        this.#webgpu?.submit(submit);
    }

    /**
     * 绘制场景（每帧由渲染循环调用）。
     *
     * 读取 `viewLogic.submit` 会同步画布尺寸、更新场景并求值响应式渲染链，
     * 返回的 Submit 交 `webgpu.submit` 提交（版本未变时按需跳过）。
     */
    render(): void
    {
        const stats = this.statsInstance as Stats | undefined;
        if (stats) stats.begin();

        try
        {
            this.#webgpu?.submit(this.viewLogic.submit);
        }
        catch (e)
        {
            console.error('[EditorView] 提交渲染失败：', e);
        }
        finally
        {
            if (stats)
            {
                stats.end();
                stats.update();
            }
        }
    }

    /**
     * 把编辑器场景与游戏场景同步到本视图。
     *
     * @param scene 游戏场景
     */
    setScene(scene: Scene | null): void
    {
        this.scene = scene;
        // 渲染树由图结构决定（游戏场景对象是视图根的子级），
        // 这里只需维护编辑器侧引用（EditorComponent 图标跟随等）。
    }

    /**
     * 把编辑器相机与编辑器模块组件同步到本视图。
     *
     * @param camera 编辑器相机
     * @param editorComponent 编辑器模块组件（图标跟随逻辑）
     */
    setEditorContext(camera: Camera | null, editorComponent: EditorComponent | null): void
    {
        this.camera = camera;
        this.editorComponent = editorComponent;
        this.editorComponentLogic = editorComponent ? getLogic(editorComponent) as ComponentLogicBase : null;

        // 经响应式代理写入组件数据字段（数据只读，写入必须走代理）——等价旧写法的
        // `editorComponent.scene = ...` / `editorComponent.editorCamera = ...`，
        // 由 EditorComponentLogic 的 effect 驱动图标创建与相机广播。
        if (editorComponent)
        {
            const r_editorComponent = reactive(editorComponent);
            r_editorComponent.scene = this.scene ?? undefined;
            r_editorComponent.editorCamera = this.camera ?? undefined;
        }
    }

    /**
     * 由屏幕坐标现算鼠标射线（旧 `View.mouseRay3D` 的按需替代）。
     *
     * 屏幕坐标 → GPU 坐标（-1~1，Y 翻转）→ 相机 `getRay3D`；
     * 与 `examples/src/base/MousePickTest.ts` 的换算一致。
     *
     * @param clientX 屏幕 X（client 坐标系）
     * @param clientY 屏幕 Y（client 坐标系）
     * @returns 鼠标射线；相机或视图尺寸缺失时返回 null
     */
    getRay3D(clientX: number, clientY: number): Ray3 | null
    {
        const camera = this.camera as PerspectiveCamera | null;
        if (!camera) return null;

        const rect = this.viewRect;
        if (!rect.width || !rect.height) return null;

        const gx = ((clientX - rect.x) * 2 - rect.width) / rect.width;
        const gy = -((clientY - rect.y) * 2 - rect.height) / rect.height;

        return getLogic(camera).getRay3D(gx, gy);
    }

    /** 编辑器数据（读取当前场景与选中对象） */
    get editorData(): typeof EditorData.editorData
    {
        return EditorData.editorData;
    }

    /** 层级树（同步 `rootObject3D`） */
    get hierarchy(): typeof hierarchy
    {
        return hierarchy;
    }
}
