import { ComponentLogicBase, logic as getLogic, Plane, raycaster, shortcut, ticker, windowEventProxy } from 'feng3d';
import type { Camera, Component3D, Matrix4x4, Object3D, Ray3, Vector3 } from 'feng3d';
import { reactive, toRaw, UnReadonly } from '@feng3d/reactivity';
import { CoordinateAxis, CoordinateCube, CoordinatePlane } from './models/MToolModel';
import { CoordinateRotationAxis, CoordinateRotationFreeAxis } from './models/RToolModel';
import { CoordinateScaleCube } from './models/SToolModel';
import { MRSToolTarget } from './MRSToolTarget';

/** 工具可拾取的部件（坐标轴 / 平面 / 方块 / 缩放轴 / 旋转轴） */
export type MRSToolSelectedItem = CoordinateAxis | CoordinatePlane | CoordinateCube
    | CoordinateScaleCube | CoordinateRotationAxis | CoordinateRotationFreeAxis;

/** gizmo 屏幕尺寸系数：缩放系数 = 相机距离 × HOLD_SIZE（沿用旧实现 `holdSize = 0.005`） */
const HOLD_SIZE = 0.005;

/** 可拾取部件的 `__type__` 集合（命中子对象后向上回溯定位部件组件） */
const PICKABLE_TYPES: ReadonlySet<string> = new Set([
    'CoordinateAxis', 'CoordinatePlane', 'CoordinateCube',
    'CoordinateScaleCube', 'CoordinateRotationAxis', 'CoordinateRotationFreeAxis',
]);

/**
 * 位移旋转缩放工具的公共数据（纯数据接口）。
 *
 * 迁移自旧写法 `class MRSToolBase extends Component`：新范式中组件是纯数据接口，
 * 行为由 {@link MRSToolBaseLogic} 提供；原 class 的 `_selectedItem` / `_toolModel` /
 * `_editorCamera` 私有字段改为数据字段，写入一律经响应式代理。
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
    readonly selectedItem?: MRSToolSelectedItem;

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
 * 职责：
 * - 给宿主对象挂 `HoldSize`（gizmo 屏幕尺寸恒定，旧实现 `holdSize = 0.005`）
 * - 工具进出场景时注册/反注册全局鼠标事件与逐帧回调
 * - gizmo 部件射线拾取（主仓已移除数据对象的字符串事件，改为 `raycaster.pick`）
 * - 鼠标射线与变换平面的交点计算
 */
export class MRSToolBaseLogic extends ComponentLogicBase
{
    #data: MRSToolBase;

    /** 全局事件是否已注册（工具在场景中时为 true） */
    #registered = false;

    /** 工具模型实体对象（承载工具模型组件） */
    #toolModelObject: Object3D | null = null;

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
    }

    /** 宿主对象（工具 gizmo 的根对象） */
    get host(): Object3D | null
    {
        return (this.entity as Object3D | null) ?? null;
    }

    /**
     * 编辑器相机的宿主对象。
     *
     * `editorCamera` 是 **Camera 组件**数据，`local2world` / `worldPosition` 等世界变换属于其
     * 宿主 `Object3D` 的 logic（CameraLogic 只提供 `getRay3D` 等相机行为）。
     */
    protected get editorCameraObject(): Object3D | null
    {
        const camera = this.#data.editorCamera;

        return camera ? (getLogic(camera)?.entity as Object3D ?? null) : null;
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? this.host;
        if (!host) return;

        // gizmo 屏幕尺寸恒定：主仓 `HoldSize` 组件只缩放**自身对象**的 renderObject，
        // 而工具宿主对象没有 MeshRenderer，挂在它上面不会生效（旧实现的 HoldSizeComponent
        // 会作用于整个子树）。这里改为在 {@link onFrame} 中按相机距离直接缩放工具对象。
        const r_host = reactive(host);
        if (!r_host.components) (host as { components: Component3D[] }).components = [];

        // 注册全局鼠标事件与逐帧回调。
        //
        // 旧实现监听 'addedToScene' / 'removedFromScene' 字符串事件；新范式改为**一次性注册**
        // 并在运行时用 {@link inScene} 判定工具是否挂在场景中（工具根对象由 `MRSTool` 在选中
        // 对象非空时挂到场景下），避免依赖 `parent` 的响应式追踪。
        this.onAddedToSceneInternal();
    }

    override dispose(): void
    {
        this.onRemovedFromSceneInternal();
        super.dispose();
    }

    /** 进入场景：接管控制器、注册鼠标事件与逐帧更新（子类可覆写扩展） */
    protected onAddedToScene(): void
    {
        // 由子类覆写
    }

    /** 离开场景：释放控制器与事件（子类可覆写扩展） */
    protected onRemovedFromScene(): void
    {
        // 由子类覆写
    }

    protected onItemMouseDown(_item: MRSToolSelectedItem): void
    {
        shortcut.activityState('inTransforming');
    }

    protected get toolModel(): Component3D
    {
        return this.#data.toolModel;
    }

    /**
     * 设置工具模型（传入承载工具模型组件的 `Object3D` 字面量）。
     *
     * 旧实现 `this.object3D.addChild(toolModel.object3D)`；新范式把工具模型实体对象挂到
     * 宿主 `children` 下（父子关系由 ContainerLogic 的 effect 维护），并把其组件数据写入
     * `toolModel` 字段供外部读取。
     */
    protected setToolModel(object3D: Object3D | null): void
    {
        const host = this.host;

        // 先移除旧工具模型实体
        if (this.#toolModelObject && host)
        {
            const children = reactive(host).children;
            const index = children ? children.indexOf(this.#toolModelObject) : -1;
            if (index >= 0) children.splice(index, 1);
        }
        this.#toolModelObject = object3D;
        (this.#data as UnReadonly<MRSToolBase>).toolModel = object3D?.components?.[0] as Component3D;

        if (object3D && host)
        {
            const r_host = reactive(host);
            if (!r_host.children) (host as { children: Object3D[] }).children = [];
            r_host.children.push(object3D);
        }
    }

    /** 工具模型对应的实体对象（拾取与挂载使用） */
    protected get toolModelEntity(): Object3D | null
    {
        return this.#toolModelObject;
    }

    get selectedItem(): MRSToolSelectedItem
    {
        return this.#data.selectedItem;
    }

    set selectedItem(value: MRSToolSelectedItem)
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

    /** 逐帧入口：先保持 gizmo 屏幕尺寸，再交给子类更新工具模型 */
    private onFrame(): void
    {
        if (!this.inScene) return;
        this.updateHoldSize();
        this.updateToolModel();
    }

    /** 工具是否已挂在场景中（`MRSTool` 在选中对象非空时才会把它挂到场景下） */
    private get inScene(): boolean
    {
        const host = this.host;

        return !!host && !!getLogic(host)?.parent;
    }

    /**
     * 按相机距离缩放工具对象，使 gizmo 的屏幕尺寸恒定。
     *
     * 工具模型按世界单位建模（轴长 100、平面 20），必须随相机远近等比缩放，否则近距离下
     * 平面会覆盖整个视口。系数沿用旧实现的 `holdSize = 0.005`。
     */
    private updateHoldSize(): void
    {
        const cameraObject = this.editorCameraObject;
        const host = this.host;
        if (!cameraObject || !host) return;

        const cameraPos = getLogic(cameraObject)?.worldPosition;
        const objectPos = getLogic(host)?.worldPosition;
        if (!cameraPos || !objectPos) return;

        const dx = cameraPos.x - objectPos.x;
        const dy = cameraPos.y - objectPos.y;
        const dz = cameraPos.z - objectPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const scale = Math.max(distance * HOLD_SIZE, 1e-4);

        // 值未变化时跳过写入（逐帧写入会让渲染树每帧重算）
        const current = host.scale;
        if (current && Math.abs(current.x - scale) < 1e-4) return;

        reactive(host).scale = { x: scale, y: scale, z: scale };
    }

    /**
     * 拾取 gizmo 部件（屏幕射线 → 工具模型树下 `mouseEnabled` 的网格对象）。
     *
     * 命中后向上回溯到持有部件组件的对象，返回部件数据供拖拽逻辑分支。
     */
    protected pickItem(): MRSToolSelectedItem | null
    {
        const ray3 = this.getMouseRay3D();
        const root = this.toolModelEntity;
        if (!ray3 || !root) return null;

        const pickables: Object3D[] = [];
        collectPickables(root, pickables);
        if (pickables.length === 0) return null;

        const collision = raycaster.pick(ray3, pickables);
        const object3D = collision?.object3D;
        if (!object3D) return null;

        return findItemComponent(object3D);
    }

    protected onMouseDown(): void
    {
        const item = this.pickItem();
        if (item) this.onItemMouseDown(item);
        else this.selectedItem = undefined;
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
        const startSceneTransform = this.#data.startSceneTransform;
        if (!crossPos || !startSceneTransform) return crossPos;

        const inverseGlobalMatrix = startSceneTransform.clone();
        inverseGlobalMatrix.invert();
        crossPos = inverseGlobalMatrix.transformPoint3(crossPos);

        return crossPos;
    }

    protected getMousePlaneCross(): Vector3
    {
        const line3D = this.getMouseRay3D();
        const movePlane3D = this.#data.movePlane3D;
        if (!line3D || !movePlane3D) return undefined;

        // 射线与平面交点
        return movePlane3D.intersectWithLine3(line3D) as Vector3;
    }

    /**
     * 当前鼠标位置的场景射线。
     *
     * 主仓 `Scene` 已无 `mouseRay3D` 字段，改为按画布矩形把鼠标位置换算成 NDC 后
     * 由编辑器相机现算（与 {@link EditorView.getRay3D} 的换算一致）。
     */
    protected getMouseRay3D(): Ray3 | null
    {
        const camera = this.#data.editorCamera;
        if (!camera) return null;

        // 编辑器同时存在多个画布（主视图 / 右上角视角工具 / 隐藏画布），必须取鼠标所在的那个
        const canvas = findCanvasAt(windowEventProxy.clientX, windowEventProxy.clientY);
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;

        const clientX = windowEventProxy.clientX;
        const clientY = windowEventProxy.clientY;
        const gx = ((clientX - rect.left) * 2 - rect.width) / rect.width;
        const gy = -((clientY - rect.top) * 2 - rect.height) / rect.height;

        return getLogic(camera)?.getRay3D(gx, gy) ?? null;
    }

    /** 进入场景的内部处理（注册全局事件 / 逐帧回调 / 控制器） */
    private onAddedToSceneInternal(): void
    {
        if (this.#registered) return;
        this.#registered = true;

        const host = this.host;
        if (host && this.#data.mrsToolTarget) this.#data.mrsToolTarget.controllerTool = host;

        windowEventProxy.on('mousedown', this.onWindowMouseDown, this);
        windowEventProxy.on('mouseup', this.onMouseUp, this);
        ticker.onframe(this.onFrame, this);

        this.onAddedToScene();
    }

    /** 离开场景的内部处理（与 {@link onAddedToSceneInternal} 对称） */
    private onRemovedFromSceneInternal(): void
    {
        if (!this.#registered) return;
        this.#registered = false;

        windowEventProxy.off('mousedown', this.onWindowMouseDown, this);
        windowEventProxy.off('mouseup', this.onMouseUp, this);
        ticker.offframe(this.onFrame, this);

        this.onRemovedFromScene();
    }

    /** 全局 mousedown：命中 gizmo 部件则交给子类拖拽，否则清空选中 */
    private onWindowMouseDown(): void
    {
        if (!this.inScene) return;
        if (!shortcut.getState('mouseInView3D')) return;
        if (shortcut.keyState.getKeyState('alt')) return;

        this.onMouseDown();
    }
}

/** 找到鼠标位置所在的画布（取面积最大者，排除隐藏画布与角落小画布） */
function findCanvasAt(clientX: number, clientY: number): HTMLCanvasElement | null
{
    let best: HTMLCanvasElement | null = null;
    let bestArea = 0;
    for (const canvas of document.querySelectorAll('canvas'))
    {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue;
        const area = rect.width * rect.height;
        if (area > bestArea) { bestArea = area; best = canvas; }
    }

    return best;
}

/** 收集对象树中显式开启拾取（`mouseEnabled === true`）的网格对象 */function collectPickables(object3D: Object3D, out: Object3D[]): void
{
    if (object3D.mouseEnabled === false) return;
    if (object3D.mouseEnabled === true && (object3D.components ?? []).some((c) => c.__type__ === 'MeshRenderer'))
    {
        out.push(object3D);
    }
    for (const child of object3D.children ?? []) collectPickables(child, out);
}

/**
 * 从命中的对象向上回溯，找到持有部件组件的对象。
 *
 * 返回值必须用 `toRaw` 还原：命中对象来自 `raycaster.pick`，其 `components` 经响应式读取
 * 得到的是**代理**，而各工具的 Logic 持有的是创建时的**原始数据**；不还原会出现
 * 「`item.__type__` 与 `modelLogic.xxx` 完全相同、但 `item === modelLogic.xxx` 为 false」，
 * 于是所有按引用分派的分支（xAxis / yAxis / zAxis / freeAxis…）全部落空、拖拽无法启动。
 */
function findItemComponent(object3D: Object3D): MRSToolSelectedItem | null
{
    let current: Object3D | null = object3D;
    while (current)
    {
        for (const component of current.components ?? [])
        {
            if (PICKABLE_TYPES.has(component.__type__)) return toRaw(component) as MRSToolSelectedItem;
        }
        current = getLogic(current)?.parent as Object3D | null;
    }

    return null;
}
