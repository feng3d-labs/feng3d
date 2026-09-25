import { ComponentLogicBase } from 'feng3d';
import type { Camera, Color4, Renderable, Scene, View } from 'feng3d';
import { logic as getLogic, reactive } from 'feng3d';
import { EditorData } from '../global/EditorData';
import type { EditorComponent } from './EditorComponent';
import { hierarchy } from './hierarchy/Hierarchy';

// TODO(P1 API 迁移)：以下符号仅在下方「旧实现存档」注释中使用，当前不需要导入——
// `RunEnvironment`（设置场景运行环境）、`Color4`（线框色，现为纯数据接口不可 `new`）、
// `Renderable`（线框绘制判别）。

/**
 * 编辑器视图。
 *
 * 迁移自旧写法 `class EditorView extends View`：
 * 主仓 `View` **已是纯数据 interface**（运行时无值），`class X extends View` 会在
 * **模块加载期**抛 `TypeError: Class extends value undefined`，导致整个模块图加载失败。
 *
 * **P0 处理方式**：先把继承与渲染实现整体摘除（标注 TODO），只保留编辑器各处依赖的
 * 字段与构造入口，使模块可加载、`new EditorView(canvas)` 不再崩溃。
 *
 * **P1 迁移方向**（新范式）：
 * - 视图本身改为纯数据 `{ __type__: 'View', canvas, root }`，经 `logic(view)` 得到
 *   `ViewLogic`；渲染由 `ViewLogic.submit` 驱动（`webgpu.submit(logic(view).submit)`），
 *   不再有 `render()` / `start()` / `setSize()` 等命令式方法。
 * - `this.scene` → `getLogic(scene).entity`（视图根），场景切换改为替换 view.root；
 *   `this.editorScene` 属于编辑器自有数据，需在数据层重新建模（不再挂在 View 上）。
 * - `this.mouse3DManager.pick(...)` → `raycaster.pick(mouseRay3D, logic(scene).mouseCheckObjects)`，
 *   鼠标射线由相机 `getRay3D(ndcX, ndcY)` 现算。
 */
export class EditorView
{
    /**
     * 兼容旧 `View` 的类型判别字段。
     *
     * P1 迁移后本对象将由纯数据 `View` + `ViewLogic` 取代。
     */
    readonly __type__ = 'View';

    /** 宿主画布 */
    readonly canvas: HTMLCanvasElement | string;

    /** 视图根 Object3D（新范式 View 的唯一场景入口） */
    readonly root: View['root'];

    /** 编辑器相机（由 SceneView 注入） */
    camera: Camera | null = null;

    /** 当前游戏场景（由 SceneView 经 `EditorData` 同步） */
    scene: Scene | null = null;

    /** 编辑器场景（仅编辑器存在的对象：灯光图标、操作工具等） */
    editorScene: Scene | null = null;

    /** 编辑器模块组件（图标跟随逻辑） */
    editorComponent: EditorComponent | null = null;

    /** 编辑器模块组件的 logic（P1 恢复渲染时用于取逻辑能力） */
    editorComponentLogic: ComponentLogicBase | null = null;

    /** Stats 实例（可选，由 SceneView 设置） */
    statsInstance: unknown;

    /** 线框颜色（画布上的选中对象线框） */
    readonly wireframeColor: Color4 = { __type__: 'Color4', r: 125 / 255, g: 176 / 255, b: 250 / 255, a: 1 };

    /** 鼠标射线（由相机 `getRay3D` 现算，P1 恢复鼠标拾取时写入） */
    mouseRay3D: unknown = null;

    /** 选中对象（编辑器场景拾取结果） */
    selectedObject: { __type__?: string } | null = null;

    /**
     * @param canvas 宿主画布
     */
    constructor(canvas?: HTMLCanvasElement | string)
    {
        this.canvas = canvas ?? document.createElement('canvas');

        // TODO(P1 API 迁移)：视图初始化改为纯数据 + logic 触发：
        //   const view: View = { __type__: 'View', canvas: this.canvas, root: { __type__: 'Object3D', name: 'editorRoot' } };
        //   getLogic(view);                       // 注册 ViewLogic（含默认 Scene / Camera）
        //   this.view = view;
        // 当前 `root` 仅作为占位数据，未被任何渲染路径消费。
        this.root = {
            __type__: 'Object3D',
            name: 'editorRoot',
            components: [],
            children: [],
        };
    }

    /**
     * 绘制场景（每帧由渲染循环调用）。
     *
     * TODO(P1 API 迁移)：旧实现整体暂缓执行——它依赖 `scene.runEnvironment`、
     * `scene.mouseRay3D`、`scene.update()`、`mouse3DManager.pick()`、
     * `object3D.getComponent(Renderable)` 与已移除的 `forwardRenderer.draw(gl, ...)` /
     * `wireframeRenderer.drawObject3D(gl, ...)`。新渲染链由 `ViewLogic.submit` 承载。
     *
     * 旧实现（仅存档，勿直接恢复）：
     * render()
     * {
     *     if (this.statsInstance) this.statsInstance.begin();
     *     if (EditorData.editorData.gameScene !== this.scene)
     *     {
     *         if (this.scene) this.scene.runEnvironment = RunEnvironment.feng3d;
     *         this.scene = EditorData.editorData.gameScene;
     *         if (this.scene)
     *         {
     *             this.scene.runEnvironment = RunEnvironment.editor;
     *             hierarchy.rootObject3D = this.scene.object3D;
     *         }
     *     }
     *     if (this.editorComponent)
     *     {
     *         this.editorComponent.scene = getRawObject(this.scene);
     *         this.editorComponent.editorCamera = getRawObject(this.camera);
     *     }
     *     if (this.scene && this.scene.object3D) super.render();
     *     else { ...只更新编辑器场景... }
     *     if (this.contextLost) return;
     *     if (this.editorScene)
     *     {
     *         this.editorScene.mouseRay3D = this.mouseRay3D;
     *         this.editorScene.camera = this.camera;
     *         this.editorScene.update();
     *         const selectedObject = this.mouse3DManager.pick(this, this.editorScene, this.camera);
     *         if (selectedObject) this.selectedObject = selectedObject;
     *     }
     *     if (this.scene)
     *     {
     *         EditorData.editorData.selectedObject3Ds.forEach((element) =>
     *         {
     *             if (element.getComponent(Renderable)) { wireframeRenderer.drawObject3D(element.getComponent(Renderable), this.wireframeColor); }
     *         });
     *     }
     *     if (this.statsInstance) { this.statsInstance.end(); this.statsInstance.update(); }
     * }
     */
    render(): void
    {
        // P1 恢复入口；当前渲染链由 ViewLogic.submit 驱动（见类注释）。
    }

    /**
     * 把编辑器场景与游戏场景同步到本视图。
     *
     * @param scene 游戏场景
     */
    setScene(scene: Scene | null): void
    {
        this.scene = scene;
        // TODO(P1 API 迁移)：旧 `render()` 内据此设置 `runEnvironment` 并把
        // `hierarchy.rootObject3D` 指向 `logic(scene).entity`；`Scene.runEnvironment`
        // 现在位于 `Behaviour` 基接口上（`packages/feng3d/src/component/Behaviour.ts`），
        // 迁移时经响应式代理写入。
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

    /** 编辑器数据（P1 恢复渲染循环时读取当前场景与选中对象） */
    get editorData(): typeof EditorData.editorData
    {
        return EditorData.editorData;
    }

    /** 层级树（P1 恢复渲染循环时同步 `rootObject3D`） */
    get hierarchy(): typeof hierarchy
    {
        return hierarchy;
    }
}
