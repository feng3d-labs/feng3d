import { shortcut } from 'feng3d';
import type { IEvent, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { MToolModel } from './models/MToolModel';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';

/**
 * 位移工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class MTool extends MRSToolBase`：
 * 新范式中组件是纯数据接口，行为由 {@link MToolLogic} 提供。
 * 原 class 的私有字段（`changeXYZ` / `startPlanePos` / `startPos`）改为数据字段，
 * 默认值由 Logic 构造时在 `super` 之前填充。
 */
export interface MTool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'MTool';

    /** 工具模型组件（由 Logic 在 init 中创建） */
    readonly toolModel?: MToolModel;

    /** 用于判断是否改变了 XYZ（默认 { x: 0, y: 0, z: 0 }） */
    readonly changeXYZ?: { readonly x: number, readonly y: number, readonly z: number };

    /** 开始拖拽时的平面交点 */
    readonly startPlanePos?: { readonly x: number, readonly y: number, readonly z: number };

    /** 开始拖拽时的位置 */
    readonly startPos?: { readonly x: number, readonly y: number, readonly z: number };
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        MTool: MTool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MTool: MToolLogic;
    }
}

/** MToolLogic 逻辑类。 */
export class MToolLogic extends MRSToolBaseLogic
{
    #data: MTool;

    protected constructor(data: MTool)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<MTool>;
        if (data.changeXYZ === undefined) writable.changeXYZ = { x: 0, y: 0, z: 0 };

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: MTool): MToolLogic
    {
        return new MToolLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现 `this.toolModel = new Object3D().addComponent(MToolModel);`
        // 新范式：工具模型用声明式字面量 `{ __type__: 'Object3D', components: [{ __type__: 'MToolModel' }] }`，
        // 并挂到宿主子对象（`reactive(logic(this.entity).children).push(...)`）。
    }

    protected override onAddedToScene(): void
    {
        super.onAddedToScene();

        // TODO(P1 API 迁移)：原实现给 6 个坐标轴/平面/立方体注册 `mousedown` 字符串事件。
        // 主仓已移除纯数据 Object3D 的字符串事件，改用鼠标拾取（Mouse3DManager / pickClick）
        // 或编辑器事件总线接线；接线前本方法为空。
    }

    protected override onRemovedFromScene(): void
    {
        super.onRemovedFromScene();

        // TODO(P1 API 迁移)：同 onAddedToScene（反注册鼠标事件）。
    }

    /**
     * 点击坐标轴/平面开始拖拽。
     *
     * **P0 说明**：本方法保留旧 API 调用（`logic(...).local2world.value`、`new Vector3()`、
     * `new Plane()` 等）。这些调用只在**用户点击时**求值，不阻塞模块加载与编辑器启动；
     * 待 P1 按 API_MIGRATION.md §3.6 统一改写（`local2world` 直接返回矩阵、Vector3 用字面量）。
     */
    protected override onItemMouseDown(event: IEvent<unknown>): void
    {
        if (!shortcut.getState('mouseInView3D')) return;

        if (shortcut.keyState.getKeyState('alt'))
        { return; }
        if (!this.editorCamera) return;

        super.onItemMouseDown(event);
        // TODO(P1 API 迁移)：以下为旧 API 调用，待 P1 改写
        //   const globalMatrix = logic(this.transform).local2world.value;
        //   ...（中心/X/Y/Z 轴上点坐标、cameraDir、movePlane3D、changeXYZ 分支、startTranslation）
        void this.#data.changeXYZ;
    }

    protected override onMouseUp(): void
    {
        super.onMouseUp();

        // TODO(P1 API 迁移)：原实现反注册 windowEventProxy 'mousemove' 并调用
        // `this.mrsToolTarget.stopTranslation()`；待控制器迁移完成后恢复。
    }

    protected override updateToolModel(): void
    {
        // TODO(P1 API 迁移)：原实现按相机位置翻转三个平面的位置：
        //   const cameraPos = logic(this.editorCamera.transform).worldPosition;
        //   const localCameraPos = logic(this.toolModel.transform).world2local.value.transformPoint3(cameraPos);
        //   reactive(this.toolModel.xyPlane.transform.position).x = ...
        // 新范式：`logic(object3D).worldPosition` 已是 Vector3，`world2local` 直接返回矩阵。
    }
}

// 注册到 logic 分发表
registerLogic('MTool', MToolLogic as unknown as new (data: MTool) => MToolLogic);
