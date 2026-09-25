import { shortcut, Vector2, Vector3 } from 'feng3d';
import type { IEvent, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { SToolModel } from './models/SToolModel';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';

/**
 * 缩放工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class STool extends MRSToolBase`：
 * 新范式中组件是纯数据接口，行为由 {@link SToolLogic} 提供。
 * 原 class 的私有字段（`startMousePos` / `changeXYZ` / `startPlanePos`）
 * 改为数据字段，默认值由 Logic 构造时在 `super` 之前填充。
 */
export interface STool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'STool';

    /** 工具模型组件（由 Logic 在 init 中创建） */
    readonly toolModel?: SToolModel;

    /** 开始拖拽时的鼠标屏幕坐标 */
    readonly startMousePos?: Vector2;

    /** 用于判断是否改变了 XYZ（默认 { x: 0, y: 0, z: 0 }） */
    readonly changeXYZ?: { readonly x: number, readonly y: number, readonly z: number };

    /** 开始拖拽时的平面交点 */
    readonly startPlanePos?: Vector3;
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        STool: STool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        STool: SToolLogic;
    }
}

/** SToolLogic 逻辑类。 */
export class SToolLogic extends MRSToolBaseLogic
{
    #data: STool;

    protected constructor(data: STool)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<STool>;
        if (data.changeXYZ === undefined) writable.changeXYZ = { x: 0, y: 0, z: 0 };

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: STool): SToolLogic
    {
        return new SToolLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现 `this.toolModel = new Object3D().addComponent(SToolModel);`
        // 新范式：工具模型用声明式字面量 `{ __type__: 'Object3D', components: [{ __type__: 'SToolModel' }] }`，
        // 并挂到宿主子对象（`reactive(logic(this.entity).children).push(...)`）。
    }

    protected override onAddedToScene(): void
    {
        super.onAddedToScene();

        // TODO(P1 API 迁移)：原实现给 xCube / yCube / zCube / oCube 注册 `mousedown` 字符串事件；
        // 主仓已移除纯数据 Object3D 的字符串事件，待鼠标拾取接线。
    }

    protected override onRemovedFromScene(): void
    {
        super.onRemovedFromScene();

        // TODO(P1 API 迁移)：同 onAddedToScene（反注册鼠标事件）。
    }

    /**
     * 点击缩放轴开始拖拽。
     *
     * **P0 说明**：本方法保留旧 API 调用（`logic(...).local2world.value`、`new Vector3()`、
     * `new Plane()`、`editorui.stage` 等）。这些调用只在**用户点击时**求值，
     * 不阻塞模块加载与编辑器启动；待 P1 按 API_MIGRATION.md §3.6 统一改写。
     */
    protected override onItemMouseDown(event: IEvent<unknown>): void
    {
        if (!shortcut.getState('mouseInView3D')) return;
        if (shortcut.keyState.getKeyState('alt')) return;
        if (!this.editorCamera) return;

        super.onItemMouseDown(event);
        // TODO(P1 API 迁移)：以下为旧 API 调用，待 P1 改写
        //   const globalMatrix = logic(this.transform).local2world.value;
        //   ...（取中心/三轴点坐标、cameraDir、movePlane3D 分支、startMousePos、startScale、windowEventProxy）
        void this.#data.changeXYZ;
    }

    protected override onMouseUp(): void
    {
        super.onMouseUp();

        // TODO(P1 API 迁移)：原实现反注册 windowEventProxy 'mousemove'、调用
        // `this.mrsToolTarget.stopScale()` 并把三个缩放轴的 scaleValue 复位为 1。
    }

    protected override updateToolModel(): void
    {
        // TODO(P1 API 迁移)：原实现的缩放轴模型不需要逐帧更新（与 MTool/RTool 不同），保持空实现。
    }
}

// 注册到 logic 分发表
registerLogic('STool', SToolLogic as unknown as new (data: STool) => SToolLogic);
