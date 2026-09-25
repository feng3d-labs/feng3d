import { shortcut, Vector2, Vector3 } from 'feng3d';
import type { IEvent, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { RToolModel } from './models/RToolModel';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';

/**
 * 旋转工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class RTool extends MRSToolBase`：
 * 新范式中组件是纯数据接口，行为由 {@link RToolLogic} 提供。
 * 原 class 的私有字段（`startPlanePos` / `stepPlaneCross` / `startMousePos`）
 * 改为数据字段，P0 暂不填充默认值（首个鼠标事件即被赋值）。
 */
export interface RTool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'RTool';

    /** 工具模型组件（由 Logic 在 init 中创建） */
    readonly toolModel?: RToolModel;

    /** 开始拖拽时的平面交点 */
    readonly startPlanePos?: Vector3;

    /** 上一次的平面交点（用于计算增量夹角） */
    readonly stepPlaneCross?: Vector3;

    /** 开始拖拽时的鼠标屏幕坐标 */
    readonly startMousePos?: Vector2;
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        RTool: RTool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        RTool: RToolLogic;
    }
}

/** RToolLogic 逻辑类。 */
export class RToolLogic extends MRSToolBaseLogic
{
    #data: RTool;

    protected constructor(data: RTool)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: RTool): RToolLogic
    {
        return new RToolLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现 `this.toolModel = new Object3D().addComponent(RToolModel);`
        // 新范式：工具模型用声明式字面量 `{ __type__: 'Object3D', components: [{ __type__: 'RToolModel' }] }`，
        // 并挂到宿主子对象（`reactive(logic(this.entity).children).push(...)`）。
    }

    protected override onAddedToScene(): void
    {
        super.onAddedToScene();

        // TODO(P1 API 迁移)：原实现给 xAxis / yAxis / zAxis / freeAxis / cameraAxis 注册
        // `mousedown` 字符串事件；主仓已移除纯数据 Object3D 的字符串事件，待鼠标拾取接线。
    }

    protected override onRemovedFromScene(): void
    {
        super.onRemovedFromScene();

        // TODO(P1 API 迁移)：同 onAddedToScene（反注册鼠标事件）。
    }

    /**
     * 点击旋转轴开始拖拽。
     *
     * **P0 说明**：本方法保留旧 API 调用（`logic(...).local2world.value`、`new Plane()`、
     * `editorui.stage` 等）。这些调用只在**用户点击时**求值，不阻塞模块加载与编辑器启动；
     * 待 P1 按 API_MIGRATION.md §3.6 统一改写。
     */
    protected override onItemMouseDown(event: IEvent<unknown>): void
    {
        if (!shortcut.getState('mouseInView3D')) return;
        if (shortcut.keyState.getKeyState('alt')) return;
        if (!this.editorCamera) return;

        super.onItemMouseDown(event);
        // TODO(P1 API 迁移)：以下为旧 API 调用，待 P1 改写
        //   const globalMatrix = logic(this.transform).local2world.value;
        //   ...（取位置/三轴方向、cameraDir、movePlane3D 分支、startRotate、windowEventProxy）
        void this.#data.startPlanePos;
    }

    protected override onMouseUp(): void
    {
        super.onMouseUp();

        // TODO(P1 API 迁移)：原实现反注册 windowEventProxy 'mousemove'，
        // 并在选中 `CoordinateRotationAxis` 时调用 `selectedItem.hideSector()`、
        // 调用 `this.mrsToolTarget.stopRote()`；待控制器迁移完成后恢复。
    }

    protected override updateToolModel(): void
    {
        // TODO(P1 API 迁移)：原实现按相机朝向更新各轴 `filterNormal` 与自由轴旋转：
        //   const cameraSceneTransform = logic(this.editorCamera.transform).local2world.value.clone();
        //   axis.filterNormal = cameraDir; ... reactive(this.toolModel.freeAxis.transform.rotation).x = ...
        // 新范式：`logic(object3D).local2world` 直接返回矩阵；写入走响应式代理。
    }
}

// 注册到 logic 分发表
registerLogic('RTool', RToolLogic as unknown as new (data: RTool) => RToolLogic);
