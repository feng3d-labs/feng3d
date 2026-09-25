import { ComponentLogicBase, Vector3 } from 'feng3d';
import type { Color4, Component3D, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';

// ---------------------------------------------------------------------------
// 旋转工具模型（RToolModel）—— 纯数据接口 + Logic
// ---------------------------------------------------------------------------

/**
 * 旋转工具模型组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class RToolModel extends Component`。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：原 class 字段 `xAxis` / `freeAxis` 等指向
 * 在 `init()` 中命令式创建的子组件；新范式下应由**声明式字面量**直接写在
 * `components` / `children` 中，因此 P0 先不声明这些字段（见 Logic 内的 TODO）。
 */
export interface RToolModel extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'RToolModel';
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        RToolModel: RToolModel;
        CoordinateRotationAxis: CoordinateRotationAxis;
        CoordinateRotationFreeAxis: CoordinateRotationFreeAxis;
        SectorObject3D: SectorObject3D;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        RToolModel: RToolModelLogic;
        CoordinateRotationAxis: CoordinateRotationAxisLogic;
        CoordinateRotationFreeAxis: CoordinateRotationFreeAxisLogic;
        SectorObject3D: SectorObject3DLogic;
    }
}

/** RToolModelLogic 逻辑类。 */
export class RToolModelLogic extends ComponentLogicBase
{
    #data: RToolModel;

    protected constructor(data: RToolModel)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: RToolModel): RToolModelLogic
    {
        return new RToolModelLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此命令式创建 3 个旋转轴 + 自由旋转轴 + 相机朝向轴：
        //   this.object3D.name = 'Object3DRotationModel';
        //   this.xAxis = serialization.setValue(new Object3D(), { name: 'xAxis' }).addComponent(CoordinateRotationAxis);
        //   this.xAxis.color.setTo(1, 0, 0, 1); { const r = reactive(this.xAxis.transform.rotation); r.y = 90; }
        //   ... yAxis / zAxis / cameraAxis / freeAxis 同理
        // 新范式改写方向：模型写成声明式字面量；颜色用 `{ __type__: 'Color4', ... }`；
        // 旋转用 `reactive(component).rotation = { x, y, z }`（Object3D 无独立 Transform）。
        void this.#data;
    }
}

// ---------------------------------------------------------------------------
// 旋转轴（CoordinateRotationAxis）
// ---------------------------------------------------------------------------

/** 旋转轴组件（纯数据接口）。 */
export interface CoordinateRotationAxis extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateRotationAxis';

    /** 圆环半径（默认 80） */
    readonly radius?: number;

    /** 未选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 }） */
    readonly color?: Color4;

    /** 背面颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 0.99 }） */
    readonly backColor?: Color4;

    /** 选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 }） */
    readonly selectedColor?: Color4;

    /** 是否选中 */
    readonly selected?: boolean;

    /** 过滤法线：仅显示法线正面的线条（由 Logic 写入） */
    readonly filterNormal?: Vector3;
}

/** CoordinateRotationAxisLogic 逻辑类。 */
export class CoordinateRotationAxisLogic extends ComponentLogicBase
{
    #data: CoordinateRotationAxis;

    /** 线框几何体（由 init 创建） */
    #segmentGeometry: unknown = null;
    /** 圆环几何体（由 init 创建） */
    #torusGeometry: unknown = null;
    /** 扇形子组件（由 init 创建） */
    #sector: SectorObject3D | null = null;
    /** 是否已完成初始化（init 中建模结束时置 true） */
    #isinit = false;

    protected constructor(data: CoordinateRotationAxis)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateRotationAxis>;
        if (data.radius === undefined) writable.radius = 80;
        if (data.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 };
        if (data.backColor === undefined) writable.backColor = { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 0.99 };
        if (data.selectedColor === undefined) writable.selectedColor = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 };
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateRotationAxis): CoordinateRotationAxisLogic
    {
        return new CoordinateRotationAxisLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   watcher.watch(this, 'selected', this.update, this);
        //   watcher.watch(this, 'filterNormal', this.update, this);   // → effect(() => reactive(data).filterNormal)
        //   new SegmentGeometry() / new SegmentMaterial() / serialization.setValue(new TorusGeometry(), { radius, tubeRadius: 2 })
        //   this.sector = ...addComponent(SectorObject3D); mouseHit.activeSelf = false; mouseHit.mouseEnabled = true;
        //   this.object3D.addChild(...)
        // 新范式：几何体/材质/子对象全部用声明式字面量，实体关系用 `logic(component).entity`。
    }

    update(): void
    {
        // TODO(P1 API 迁移)：原实现按半径重建圆周线段（含 `filterNormal` 背面剔除）：
        //   this.#sector.radius = this.#data.radius; this.#torusGeometry.radius = this.#data.radius;
        //   const inverseGlobalMatrix = logic(this.transform).world2local.value;   // → logic(entity).world2local
        //   this.#segmentGeometry.segments = [...];（无 addSegment，整体替换 segments）
        // 新范式：`logic(this.entity).world2local` 直接返回矩阵（非 Computed），
        // 线段为 `{ start, end, startColor, endColor }`，Vector3 用字面量创建。
        if (!this.#isinit) return;
        void this.#data.radius;
        void this.#data.selected;
        void this.#segmentGeometry;
        void this.#torusGeometry;
        void this.#sector;
    }

    /** 显示旋转扇形区（由 RToolLogic 在拖拽中调用） */
    showSector(_startPos: Vector3, _endPos: Vector3): void
    {
        // TODO(P1 API 迁移)：原实现把世界坐标起点/终点换算到模型空间后计算扇区角度：
        //   const inverseGlobalMatrix = logic(this.transform).world2local.value;
        //   ... this.#sector.update(min, max); this.object3D.addChild(this.#sector.object3D);
        // 新范式：`logic(this.entity).world2local`（直接返回矩阵），挂载用响应式 children。
    }

    /** 隐藏旋转扇形区 */
    hideSector(): void
    {
        // TODO(P1 API 迁移)：原实现 `this.sector.object3D.parent.removeChild(this.sector.object3D)`；
        // 新范式：`reactive(parent).children.splice(index, 1)`（或 `logic(sectorEntity).dispose()`）。
    }
}

// ---------------------------------------------------------------------------
// 扇形对象（SectorObject3D）
// ---------------------------------------------------------------------------

/**
 * 扇形对象组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SectorObject3D extends Component`。
 * 原私有字段 `_start` / `_end` 由 `update(start, end)` 写入，P0 不再作为数据字段暴露，
 * 待 P1 改为「参数入参 + 直接重建 positions/indices」时一并处理。
 */
export interface SectorObject3D extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'SectorObject3D';

    /** 扇形半径（默认 80） */
    readonly radius?: number;

    /** 边框颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 0, g: 1, b: 1, a: 0.6 }） */
    readonly borderColor?: Color4;
}

/** SectorObject3DLogic 逻辑类。 */
export class SectorObject3DLogic extends ComponentLogicBase
{
    #data: SectorObject3D;

    /** 扇形网格几何体（由 init 创建） */
    #geometry: unknown = null;
    /** 边框线段几何体（由 init 创建） */
    #segmentGeometry: unknown = null;
    /** 是否已完成初始化 */
    #isinit = false;

    protected constructor(data: SectorObject3D)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<SectorObject3D>;
        if (data.radius === undefined) writable.radius = 80;
        if (data.borderColor === undefined) writable.borderColor = { __type__: 'Color4', r: 0, g: 1, b: 1, a: 0.6 };

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SectorObject3D): SectorObject3DLogic
    {
        return new SectorObject3DLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   this.object3D.name = 'sector';
        //   model = this.object3D.addComponent(Renderable); this.geometry = model.geometry = new CustomGeometry();
        //   new ColorMaterial() + setBlendEnabled / setCullFace；border + new SegmentGeometry() / new SegmentMaterial()
        // 新范式：MeshRenderer 组件 + `{ __type__: 'CustomGeometry', positions, indices }` 字面量。
    }

    /** 重建扇形网格（角度单位为度） */
    update(_start = 0, _end = 0): void
    {
        // TODO(P1 API 迁移)：原实现按起止角生成三角扇顶点/索引并写回
        //   `this.geometry.positions` / `this.geometry.indices`，同时重建两条边框线段。
        // 新范式：`reactive(geometry).positions = ...` / `reactive(geometry).indices = ...`，
        // 线段整体替换 `segments`。
        if (!this.#isinit) return;
        void this.#data.radius;
        void this.#data.borderColor;
        void this.#geometry;
        void this.#segmentGeometry;
    }
}

// ---------------------------------------------------------------------------
// 自由旋转轴（CoordinateRotationFreeAxis）
// ---------------------------------------------------------------------------

/**
 * 自由旋转轴组件（纯数据接口）。
 *
 * 原私有 `radius = 80` 与 `backColor` 在运行时未被外部读取，P0 保留为 Logic 侧常量/默认值。
 */
export interface CoordinateRotationFreeAxis extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateRotationFreeAxis';

    /** 未选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 }） */
    readonly color?: Color4;

    /** 背面颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 0.99 }） */
    readonly backColor?: Color4;

    /** 选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 }） */
    readonly selectedColor?: Color4;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinateRotationFreeAxisLogic 逻辑类。 */
export class CoordinateRotationFreeAxisLogic extends ComponentLogicBase
{
    #data: CoordinateRotationFreeAxis;

    /** 线框几何体（由 init 创建） */
    #segmentGeometry: unknown = null;
    /** 扇形子组件（由 init 创建） */
    #sector: SectorObject3D | null = null;
    /** 是否已完成初始化 */
    #isinit = false;

    /** 自由旋转轴半径（原 class 私有字段） */
    #radius = 80;

    protected constructor(data: CoordinateRotationFreeAxis)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateRotationFreeAxis>;
        if (data.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 };
        if (data.backColor === undefined) writable.backColor = { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 0.99 };
        if (data.selectedColor === undefined) writable.selectedColor = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 };
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateRotationFreeAxis): CoordinateRotationFreeAxisLogic
    {
        return new CoordinateRotationFreeAxisLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   watcher.watch(this, 'selected', this.update, this);
        //   border + new SegmentGeometry() / new SegmentMaterial()；this.sector = ...addComponent(SectorObject3D);
        //   this.sector.update(0, 360); this.sector.object3D.activeSelf = false; ... addChild(...)
        // 新范式：声明式字面量 + 响应式 `activeSelf`。
    }

    update(): void
    {
        // TODO(P1 API 迁移)：原实现重建整圈线段：
        //   this.#sector.radius = this.#radius;
        //   const inverseGlobalMatrix = logic(this.transform).world2local.value;   // → logic(entity).world2local
        //   this.#segmentGeometry.segments = segments;
        // 新范式：`logic(this.entity).world2local` 直接返回矩阵，线段整体替换。
        if (!this.#isinit) return;
        void this.#data.color;
        void this.#data.selected;
        void this.#segmentGeometry;
        void this.#sector;
        void this.#radius;
    }
}

// 注册到 logic 分发表
registerLogic('RToolModel', RToolModelLogic as unknown as new (data: RToolModel) => RToolModelLogic);
registerLogic('CoordinateRotationAxis', CoordinateRotationAxisLogic as unknown as new (data: CoordinateRotationAxis) => CoordinateRotationAxisLogic);
registerLogic('CoordinateRotationFreeAxis', CoordinateRotationFreeAxisLogic as unknown as new (data: CoordinateRotationFreeAxis) => CoordinateRotationFreeAxisLogic);
registerLogic('SectorObject3D', SectorObject3DLogic as unknown as new (data: SectorObject3D) => SectorObject3DLogic);
