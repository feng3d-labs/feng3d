import { ComponentLogicBase, Matrix4x4, globalEmitter } from 'feng3d';
import type { Component3D } from 'feng3d';
import type { Object3D } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { EditorView } from '../EditorView';

// TODO(P1 API 迁移)：以下符号仅在下方「旧实现存档」注释中使用，当前不需要导入——
// `loader`（加载 SceneRotateTool.object3D.json）、`serialization`（反序列化模型）、
// `ticker`（每帧朝向计算）、`Rectangle` / `windowEventProxy`（鼠标区域判定）、
// `shortcut`（mouseInSceneRotateTool 状态）、`View`（工具小视图）、
// `Vector3` / `Quaternion`（视图常量与相机旋转补间）、`mathUtil`（角度换算）、
// `reactive` / `logic`（响应式写入）、`@tweenjs/tween.js`（缓动）、
// `sceneControlConfig`（lookDistance）、`menu`（右键菜单）、`EditorData`（选中对象）。

declare module 'feng3d'
{
    export interface ComponentMap
    {
        SceneRotateTool: SceneRotateTool;
    }
}

// 全局事件声明合并：`MixinsGlobalEvents` 是主仓开放的空接口（`packages/feng3d/src/MixinsGlobalEvents.ts`
// → `packages/event/src/GlobalEmitter.ts`），旧的 `'editorCameraRotate'` 事件名在迁移中丢失，
// 此处按主仓既有机制显式补回，避免类型检查中退化为「未声明的事件名」。
declare global
{
    export interface MixinsGlobalEvents
    {
        /** 编辑器相机旋转到指定欧拉角（弧度） */
        'editorCameraRotate': { readonly x: number; readonly y: number; readonly z: number };
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SceneRotateTool: SceneRotateToolLogic;
    }
}

/**
 * 场景旋转工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SceneRotateTool extends Component`：
 * 新范式中组件是纯数据接口，行为由 {@link SceneRotateToolLogic} 提供。
 *
 * 职责：加载旋转工具模型（六个轴向箭头 + 六个平面热区），放入独立小视图渲染，
 * 点击箭头把编辑器相机旋转到对应视图（前/后/左/右/顶/底）。
 */
export interface SceneRotateTool extends Component3D
{
    readonly __type__: 'SceneRotateTool';

    /** 编辑器视图（由 SceneView 注入，缺失时不加载） */
    readonly view?: EditorView;

    /** 图层容器（可选，缺失时回退到全局 `#SceneRotateToolLayer` 元素） */
    readonly layerContainer?: HTMLElement;

    /** 六个轴向箭头对象（由加载的模型解析得到，供点击命中比对） */
    readonly arrowsX?: Object3D;
    readonly arrowsNX?: Object3D;
    readonly arrowsY?: Object3D;
    readonly arrowsNY?: Object3D;
    readonly arrowsZ?: Object3D;
    readonly arrowsNZ?: Object3D;
}

/**
 * SceneRotateToolLogic 逻辑类。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 原 class 的 `extends Component` 在新范式下会导致**模块加载期崩溃**——`Component`
 * 已是纯 interface，运行时为 `undefined`，`class X extends undefined` 直接抛
 * `TypeError`。因此本类先只做「结构迁移」：接口 + Logic 骨架可加载，
 * 依赖旧 API 的 `load` / `onLoaded` / `newView` 整体暂缓执行并标注 TODO。
 *
 * **P1 迁移方向**：
 * - `loader.loadText` + `serialization.deserialize` 加载工具模型 → 纯数据字面量（或保留加载但补 `logic()` 触发）
 * - `new View(canvas)` → `{ __type__: 'View', canvas, root: {...} }` + `logic(view).submit`
 * - `element.on('click', ...)` → 主仓纯数据 Object3D 无字符串事件（`Mouse3DManager.pickClick` 是现存替代入口）
 * - `ticker.onframe` / `windowEventProxy.on` 保持可用，但需改为响应式读取相机与模型状态
 */
export class SceneRotateToolLogic extends ComponentLogicBase
{
    #data: SceneRotateTool;

    protected constructor(data: SceneRotateTool)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SceneRotateTool): SceneRotateToolLogic
    {
        return new SceneRotateToolLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：旧实现由 `set view(v) { this._view = v; this.load(); }` 触发加载。
        // 新范式字段只读，「view 就绪 → 加载模型」应改为 effect 响应式：
        // effect(() => { reactive(this.#data).view; if (this.#data.view) this.#load(); });
        //
        // 待迁移的旧实现（存档）：
        // private async load()
        // {
        //     if (!this.view) return;
        //     if (this.isload) return;
        //     this.isload = true;
        //     const content = await loader.loadText(EditorData.editorData.getEditorAssetPath('object3Ds/SceneRotateTool.object3D.json'));
        //     const rotationToolModel: Object3D = serialization.deserialize(JSON.parse(content));
        //     this.onLoaded(rotationToolModel);
        // }
        //
        // private onLoaded(rotationToolModel: Object3D)
        // {
        //     const arrowsX = this.arrowsX = rotationToolModel.find('arrowsX');
        //     ...（arrowsY/NX/NY/Z/NZ 同，`Object3D.find` 已移除，P1 用 `findObject3DChild`）
        //     const { toolView, canvas } = this.newView();
        //     toolView.root.addChild(rotationToolModel);
        //     { const rs = reactive(rotationToolModel.transform.scale); rs.x = 0.01; ... }
        //     arr.forEach((element) => { element.on('click', this.onclick, this); });
        //     ticker.onframe(() => { ...按编辑器相机朝向更新箭头显隐与工具模型朝向... });
        //     windowEventProxy.on('mouseup', (event) => { ...右键弹出六个视图菜单... });
        // }
        //
        // private newView()
        // {
        //     const canvas = document.createElement('canvas');
        //     const container = this.layerContainer || document.getElementById('SceneRotateToolLayer');
        //     ...
        //     const toolView = new View(canvas);
        //     toolView.scene.background.a = 0.0;
        //     toolView.scene.ambientColor.setTo(0.2, 0.2, 0.2);
        //     toolView.root.addChild(Object3D.createPrimitive('Point Light'));
        //     return { toolView, canvas };
        // }
    }

    /**
     * 点击某个轴向箭头 → 把编辑器相机旋转到对应视图。
     *
     * 说明：旧实现在 `onLoaded` 中以字符串事件 `element.on('click', ...)` 绑定，
     * 主仓纯数据 `Object3D` 已无事件系统，需由鼠标拾取入口（`Mouse3DManager.pickClick`）
     * 或新的交互层调用本方法（TODO(P1 API 迁移)：接线）。
     *
     * @param item 被点击的箭头对象
     */
    clickItem(item: Object3D): void
    {
        if (!item) return;

        const frontView = { x: 0, y: 0, z: 0 }; // 前视图
        const backView = { x: 0, y: 180, z: 0 }; // 后视图
        const rightView = { x: 0, y: 90, z: 0 }; // 右视图
        const leftView = { x: 0, y: -90, z: 0 }; // 左视图
        const topView = { x: -90, y: 0, z: 0 }; // 顶视图
        const bottomView = { x: 90, y: 0, z: 0 }; // 底视图

        let rotation: { readonly x: number; readonly y: number; readonly z: number } | undefined;
        switch (item)
        {
            case this.#data.arrowsX:
                rotation = rightView;
                break;
            case this.#data.arrowsNX:
                rotation = leftView;
                break;
            case this.#data.arrowsY:
                rotation = topView;
                break;
            case this.#data.arrowsNY:
                rotation = bottomView;
                break;
            case this.#data.arrowsZ:
                rotation = backView;
                break;
            case this.#data.arrowsNZ:
                rotation = frontView;
                break;
        }
        if (rotation)
        {
            const cameraTargetMatrix = Matrix4x4.fromRotation(rotation.x, rotation.y, rotation.z);
            cameraTargetMatrix.invert();
            const result = cameraTargetMatrix.toTRS()[1];

            globalEmitter.emit('editorCameraRotate', result);

            // TODO(P1 API 迁移)：旧实现直接调用 `this.onEditorCameraRotate(result)` 做相机补间。
            // 补间依赖 `Quaternion` + `TWEEN` + `logic(camera.transform).matrix/setMatrix`
            // （`transform` 已移除，新范式为 `logic(cameraObject).local2world` + 响应式写入
            // position/rotation），迁移完成前由 `'editorCameraRotate'` 事件订阅方承担。
        }
    }

    // ---------------------------------------------------------------------
    // 旧实现存档（P1 按新范式重写）：相机旋转补间。
    //
    // private onEditorCameraRotate(resultRotation: Vector3)
    // {
    //     const camera = this.view.camera;
    //     const forward = logic(camera.transform).matrix.value.getAxisZ();
    //     let lookDistance: number;
    //     if (EditorData.editorData.selectedObject3Ds.length > 0) { ... }
    //     else { lookDistance = sceneControlConfig.lookDistance; }
    //     const rotateCenter = logic(camera.transform).worldPosition.value.addTo(forward.scaleNumber(lookDistance));
    //     const targetQuat = new Quaternion();
    //     targetQuat.fromEuler(resultRotation.x * mathUtil.DEG2RAD, ...);
    //     const tween = new TWEEN.Tween({ rate: 0.0 }).to({ rate: 1 }, 300)...;
    //     tween.start();
    // }
    // ---------------------------------------------------------------------

    /** 组件数据（raw）。P1 恢复加载/交互逻辑时使用。 */
    get data(): SceneRotateTool
    {
        return this.#data;
    }
}

// 注册到 logic 分发表
registerLogic('SceneRotateTool', SceneRotateToolLogic as unknown as new (data: SceneRotateTool) => SceneRotateToolLogic);
