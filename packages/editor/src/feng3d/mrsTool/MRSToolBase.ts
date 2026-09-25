import { ComponentLogicBase, Matrix4x4, Plane, shortcut, ticker, Vector3, windowEventProxy } from 'feng3d';
import type { Camera, Component3D, Object3D } from 'feng3d';
import { reactive, UnReadonly } from '@feng3d/reactivity';
import { CoordinateAxis, CoordinateCube, CoordinatePlane } from './models/MToolModel';
import { CoordinateRotationAxis, CoordinateRotationFreeAxis } from './models/RToolModel';
import { CoordinateScaleCube } from './models/SToolModel';
import { MRSToolTarget } from './MRSToolTarget';

/**
 * 位移旋转缩放工具的公共数据（纯数据接口）。
 *
 * 迁移自旧写法 `class MRSToolBase extends Component`：
 * 新范式中组件是纯数据接口，行为由 {@link MRSToolBaseLogic} 提供。
 *
 * `editorCamera` 在旧写法里是 getter/setter（setter 内触发 invalidate）；新范式中
 * **写入经响应式代理落到 raw 字段**，`invalidate()` 由 Logic 的 `editorCamera` 写入入口调用。
 */
export interface MRSToolBase extends Component3D
{
    /** 组件类型名（由具体子接口收窄为字面量类型） */
    readonly __type__: string;

    /** 编辑器相机（由编辑器注入） */
    readonly editorCamera?: Camera;

    /** 位移/旋转/缩放共享的操作目标（跨组件传递的运行时对象） */
    readonly mrsToolTarget?: MRSToolTarget;

    /** 工具当前选中的坐标轴/平面/立方体 */
    readonly selectedItem?: CoordinateAxis | CoordinatePlane | CoordinateCube | CoordinateScaleCube | CoordinateRotationAxis | CoordinateRotationFreeAxis;

    /** 工具模型组件（由子类 Logic 在 init 时创建并写入） */
    readonly toolModel?: Component3D;

    /** 鼠标是否按下 */
    readonly ismouseDown?: boolean;

    /** 平移平面，该平面处于场景空间，用于计算位移量 */
    readonly movePlane3D?: Plane;

    /** 开始变换时记录的本地转世界矩阵 */
    readonly startSceneTransform?: Matrix4x4;
}

/**
 * MRSToolBaseLogic 逻辑类。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 原 class 的 `extends Component` 在新范式下会导致**模块加载期崩溃**——`Component`
 * 已是纯 interface，运行时为 `undefined`。本类只做「结构迁移」：保留公开 API
 * （`toolModel` / `selectedItem` / `editorCamera` 与事件回调方法），
 * 依赖旧 API 的方法体标注 `TODO(P1 API 迁移)`。
 */
export class MRSToolBaseLogic extends ComponentLogicBase
{
    #data: MRSToolBase;

    protected constructor(data: MRSToolBase)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<MRSToolBase>;
        if (data.ismouseDown === undefined) writable.ismouseDown = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口，供子类使用） */
    static create(data: MRSToolBase): MRSToolBaseLogic
    {
        return new MRSToolBaseLogic(data);
    }

    get editorCamera(): Camera
    {
        return this.#data.editorCamera;
    }

    set editorCamera(v: Camera)
    {
        // §8.4：从 raw 读当前值，向响应式代理写新值
        const current = this.#data.editorCamera;
        if (current === v) return;
        (this.#data as UnReadonly<MRSToolBase>).editorCamera = v;
        this.invalidate();
    }

    init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此给宿主挂 HoldSizeComponent 以保持工具屏幕尺寸：
        //   const holdSizeComponent = this.object3D.addComponent(HoldSizeComponent);
        //   holdSizeComponent.holdSize = 0.005;
        // 新范式改为声明式字面量：{ __type__: 'HoldSize', holdSize: 0.005 }（无 camera 字段）。
        // 同时旧的 'addedToScene' / 'removedFromScene' 字符串事件需改为 effect 监听父子关系。
    }

    protected onAddedToScene(): void
    {
        // TODO(P1 API 迁移)：原实现在此
        //   this.mrsToolTarget.controllerTool = this.transform;   // Transform 已删除 → logic(entity)
        //   windowEventProxy / ticker.onframe 注册
        // 待控制器迁移完成后恢复。
    }

    protected onRemovedFromScene(): void
    {
        // TODO(P1 API 迁移)：同 onAddedToScene（反注册 windowEventProxy / ticker）。
    }

    private invalidate(): void
    {
        ticker.nextframe(this.update, this);
    }

    private update(): void
    {
        // TODO(P1 API 迁移)：原实现在此把 editorCamera 同步给 HoldSize 组件：
        //   this.object3D.getComponent(HoldSizeComponent).camera = this.#data.editorCamera;
        // 新范式 `HoldSize` 无 camera 字段（从 cameraUniforms 自动取），本方法可删除。
    }

    protected onItemMouseDown(event: unknown): void
    {
        void event;
        shortcut.activityState('inTransforming');
    }

    protected get toolModel(): Component3D
    {
        return this.#data.toolModel;
    }

    protected set toolModel(value: Component3D)
    {
        // TODO(P1 API 迁移)：旧实现在此把工具模型挂到宿主下：
        //   this.object3D.removeChild(this.#data.toolModel.object3D) / addChild(value.object3D)
        // 新范式：`logic(this.entity).children` 经响应式 splice 增删（组件 → 实体用 logic(component).entity）。
        (this.#data as UnReadonly<MRSToolBase>).toolModel = value;
    }

    get selectedItem(): CoordinateAxis | CoordinatePlane | CoordinateCube | CoordinateScaleCube | CoordinateRotationAxis | CoordinateRotationFreeAxis
    {
        return this.#data.selectedItem;
    }

    set selectedItem(value: CoordinateAxis | CoordinatePlane | CoordinateCube | CoordinateScaleCube | CoordinateRotationAxis | CoordinateRotationFreeAxis)
    {
        const current = this.#data.selectedItem;
        if (current === value)
        {
            return;
        }
        if (current)
        {
            // §8.4：向响应式代理写入选中态
            reactive(current).selected = false;
        }
        (this.#data as UnReadonly<MRSToolBase>).selectedItem = value;
        if (value)
        {
            reactive(value).selected = true;
        }
    }

    protected updateToolModel(): void
    {
        // 由子类覆盖
    }

    protected onMouseDown(): void
    {
        this.selectedItem = undefined;
        (this.#data as UnReadonly<MRSToolBase>).ismouseDown = true;
    }

    protected onMouseUp(): void
    {
        const writable = this.#data as UnReadonly<MRSToolBase>;
        writable.ismouseDown = false;
        writable.movePlane3D = undefined;
        writable.startSceneTransform = undefined;

        ticker.nextframe(() =>
        {
            shortcut.deactivityState('inTransforming');
        });
    }

    /**
     * 获取鼠标射线与移动平面的交点（模型空间）
     */
    protected getLocalMousePlaneCross(): Vector3
    {
        // 射线与平面交点
        let crossPos = this.getMousePlaneCross();
        // 把交点从世界转换为模型空间
        const inverseGlobalMatrix = this.#data.startSceneTransform.clone();
        inverseGlobalMatrix.invert();
        crossPos = inverseGlobalMatrix.transformPoint3(crossPos);

        return crossPos;
    }

    protected getMousePlaneCross(): Vector3
    {
        // TODO(P1 API 迁移)：旧实现取 `this.object3D.scene.mouseRay3D`；
        // 主仓 Scene 无该字段，已确认用场景相机 `getRay3D(ndcX, ndcY)` 现算替代（见 API_MIGRATION.md §8）。
        // 新范式宿主对象为 `this.entity`（Object3D），`scene` 经 `logic(entity).scene` 获取。
        // 恢复写法：
        //   const line3D = logic(logic(this.entity).scene).mouseRay3D;
        //   return this.#data.movePlane3D.intersectWithLine3(line3D) as Vector3;
        return undefined;
    }
}
