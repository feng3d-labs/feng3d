import { ComponentLogicBase, logic as getLogic } from 'feng3d';
import type { Color4, Component3D, MeshRenderer, Object3D, Segment, Vector3 } from 'feng3d';
import { effect, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { color4 } from './MToolModel';
import { createSectorObject } from './SectorObject3D';
import type { SectorObject3D } from './SectorObject3D';

export * from './SectorObject3D';

// ---------------------------------------------------------------------------
// 旋转工具模型（RToolModel）—— 纯数据接口 + Logic
// ---------------------------------------------------------------------------

/** 度 → 弧度 / 弧度 → 度 */
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** 旋转轴圆环半径（默认，相机朝向轴用 88 稍大一圈） */
const ROTATION_AXIS_RADIUS = 80;
const CAMERA_AXIS_RADIUS = 88;

/** 圆环热区管半径 */
const TUBE_RADIUS = 2;

/** 圆周细分段数（旧实现 0..360 逐度一段） */
const CIRCLE_SEGMENTS = 360;

/** 选中高亮色 / 背面色 */
const SELECTED_COLOR = color4(1, 1, 0, 1);
const BACK_COLOR = color4(0.6, 0.6, 0.6, 1);

/**
 * 旋转工具模型组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class RToolModel extends Component`：旧 `initModels()` 用
 * `serialization.setValue(new Object3D(), {...}).addComponent(CoordinateRotationAxis)` 命令式
 * 构建「3 个坐标轴圆环 + 相机朝向轴 + 自由旋转轴」，新范式改为纯数据字面量，
 * 由 {@link RToolModelLogic} 挂载并暴露引用。
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
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        RToolModel: RToolModelLogic;
        CoordinateRotationAxis: CoordinateRotationAxisLogic;
        CoordinateRotationFreeAxis: CoordinateRotationFreeAxisLogic;
    }
}

/** RToolModelLogic 逻辑类：在宿主对象下构建并持有各旋转轴。 */
export class RToolModelLogic extends ComponentLogicBase
{
    #data: RToolModel;

    #xAxis: CoordinateRotationAxis | null = null;
    #yAxis: CoordinateRotationAxis | null = null;
    #zAxis: CoordinateRotationAxis | null = null;
    #cameraAxis: CoordinateRotationAxis | null = null;
    #freeAxis: CoordinateRotationFreeAxis | null = null;

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

    get xAxis(): CoordinateRotationAxis | null { return this.#xAxis; }
    get yAxis(): CoordinateRotationAxis | null { return this.#yAxis; }
    get zAxis(): CoordinateRotationAxis | null { return this.#zAxis; }
    get cameraAxis(): CoordinateRotationAxis | null { return this.#cameraAxis; }
    get freeAxis(): CoordinateRotationFreeAxis | null { return this.#freeAxis; }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 圆环默认位于 XY 平面（绕 Z 轴）：X 轴绕 Y 转 90°、Y 轴绕 X 转 90°（旧实现角度值）
        const xAxis = createRotationAxis('xAxis', color4(1, 0, 0, 1), { x: 0, y: 90 * DEG2RAD, z: 0 });
        const yAxis = createRotationAxis('yAxis', color4(0, 1, 0, 1), { x: 90 * DEG2RAD, y: 0, z: 0 });
        const zAxis = createRotationAxis('zAxis', color4(0, 0, 1, 1));
        const cameraAxis = createRotationAxis('cameraAxis', color4(1, 1, 1, 1), undefined, CAMERA_AXIS_RADIUS);
        const freeAxis = createFreeAxis('freeAxis', color4(1, 1, 1, 1));

        this.#xAxis = xAxis.data;
        this.#yAxis = yAxis.data;
        this.#zAxis = zAxis.data;
        this.#cameraAxis = cameraAxis.data;
        this.#freeAxis = freeAxis.data;

        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        r_host.children.push(xAxis.object3D, yAxis.object3D, zAxis.object3D, cameraAxis.object3D, freeAxis.object3D);

        void this.#data;
    }
}

/** 圆环线段 + 扇形子对象的公共构建结果 */
interface RotationAxisPart
{
    readonly data: CoordinateRotationAxis;
    readonly object3D: Object3D;
}

/** 构建一个旋转轴：圆周线段 + 圆环热区（扇形对象由 Logic 在拖拽时挂载） */
function createRotationAxis(
    name: string,
    color: Color4,
    rotation?: { x: number; y: number; z: number },
    radius = ROTATION_AXIS_RADIUS,
): RotationAxisPart
{
    const data: CoordinateRotationAxis = { __type__: 'CoordinateRotationAxis', color, radius };
    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        rotation,
        // 部件组件必须挂在宿主对象上：命中 `hit`（圆环热区）后靠它回溯到旋转轴部件
        components: [data],
        children: [
            {
                __type__: 'Object3D',
                name: 'border',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: [] },
                    // 线段颜色由顶点色携带（同一圆环需要正面色/背面色两种颜色）
                    material: { __type__: 'SegmentMaterial', uniforms: { u_segmentColor: color4(1, 1, 1, 1) } },
                }],
            },
            {
                __type__: 'Object3D',
                name: 'hit',
                // 热区不可见但参与鼠标拾取（旧实现 activeSelf = false + mouseEnabled = true）
                activeSelf: false,
                mouseEnabled: true,
                rotation: { x: 90 * DEG2RAD, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusGeometry', radius, tubeRadius: TUBE_RADIUS },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color4(1, 1, 1, 1) } },
                }],
            },
        ],
    };

    return { data, object3D };
}

/** 构建自由旋转轴：整圈线段 + 整圈扇形（扇形初始不可见，仅参与拾取） */
function createFreeAxis(name: string, color: Color4): { data: CoordinateRotationFreeAxis; object3D: Object3D }
{
    const data: CoordinateRotationFreeAxis = { __type__: 'CoordinateRotationFreeAxis', color };
    const sector = createSectorObject(ROTATION_AXIS_RADIUS, 0, 360);
    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        // 部件组件必须挂在宿主对象上：命中下方 `sector` 后靠它回溯到自由旋转轴部件
        components: [data],
        children: [
            {
                __type__: 'Object3D',
                name: 'border',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: [] },
                    material: { __type__: 'SegmentMaterial', uniforms: { u_segmentColor: color4(1, 1, 1, 1) } },
                }],
            },
            sector.object3D,
        ],
    };

    return { data, object3D };
}

// ---------------------------------------------------------------------------
// 旋转轴（CoordinateRotationAxis）
// ---------------------------------------------------------------------------

/**
 * 旋转轴组件（纯数据接口）。
 *
 * 圆周线段按 {@link filterNormal} 做背面剔除：法线背面的一半线段在选中态显示为
 * {@link backColor}，未选中态完全不显示（旧实现语义）。
 */
export interface CoordinateRotationAxis extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateRotationAxis';

    /** 圆环半径（缺失时由 Logic 填充） */
    readonly radius?: number;

    /** 未选中颜色（缺失时由 Logic 填充） */
    readonly color?: Color4;

    /** 背面颜色（缺失时由 Logic 填充） */
    readonly backColor?: Color4;

    /** 选中颜色（缺失时由 Logic 填充） */
    readonly selectedColor?: Color4;

    /** 是否选中 */
    readonly selected?: boolean;

    /** 过滤法线：仅显示法线正面的线段（由 `RTool` 按相机朝向写入） */
    readonly filterNormal?: Vector3;
}

/** CoordinateRotationAxisLogic 逻辑类：重建圆周线段（含背面剔除）并同步半径/选中态。 */
export class CoordinateRotationAxisLogic extends ComponentLogicBase
{
    #data: CoordinateRotationAxis;

    /** 扇形对象（拖拽时挂到宿主下，平时游离） */
    #sector: { data: SectorObject3D; object3D: Object3D } | null = null;

    protected constructor(data: CoordinateRotationAxis)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateRotationAxis>;
        if (data.radius === undefined) writable.radius = ROTATION_AXIS_RADIUS;
        if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
        if (data.backColor === undefined) writable.backColor = BACK_COLOR;
        if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
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

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 扇形对象：不挂在宿主下，showSector 时才挂（旧实现 `this.object3D.addChild(sector)`）
        this.#sector = createSectorObject(this.#data.radius ?? ROTATION_AXIS_RADIUS);

        effect(() =>
        {
            // 经响应式代理读取：selected / filterNormal / 颜色 / 半径变化都会重建
            const r_data = reactive(this.#data);
            const selected = r_data.selected;
            const radius = r_data.radius ?? ROTATION_AXIS_RADIUS;
            const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
            const backColor = r_data.backColor ?? BACK_COLOR;
            const filterNormal = r_data.filterNormal;

            // 扇形半径跟随圆环半径
            if (this.#sector) reactive(this.#sector.data).radius = radius;

            // 圆环热区半径跟随
            const children = reactive(host).children ?? [];
            for (const child of children)
            {
                if (child.name !== 'hit') continue;
                const torus = ((child.components ?? [])[0] as MeshRenderer | undefined)?.geometry as
                    UnReadonly<{ radius?: number }> | undefined;
                if (torus) reactive(torus).radius = radius;
            }

            // 过滤法线换算到模型空间（仅当被设置时剔除背面）
            const world2local = getLogic(host)?.world2local;
            const localNormal = filterNormal && world2local ? world2local.transformVector3(filterNormal) : undefined;

            const segments: Segment[] = [];
            let prev = circlePoint(0, radius);
            for (let i = 1; i <= CIRCLE_SEGMENTS; i++)
            {
                const current = circlePoint(i, radius);
                const front = !localNormal || (dot(prev, localNormal) > 0 && dot(current, localNormal) > 0);
                if (front)
                {
                    segments.push({ start: prev, end: current, startColor: color, endColor: color });
                }
                else if (selected)
                {
                    segments.push({ start: prev, end: current, startColor: backColor, endColor: backColor });
                }
                prev = current;
            }

            for (const child of children)
            {
                if (child.name !== 'border') continue;
                const geometry = ((child.components ?? [])[0] as MeshRenderer | undefined)?.geometry as
                    UnReadonly<{ segments: Segment[] }> | undefined;
                if (geometry) reactive(geometry).segments = segments;
            }
        });
    }

    /** 显示旋转扇形区（入参为世界坐标起点/终点） */
    showSector(startPos: Vector3, endPos: Vector3): void
    {
        const host = this.entity as Object3D | null;
        if (!host || !this.#sector) return;

        const world2local = getLogic(host)?.world2local;
        if (!world2local) return;

        // 世界坐标 → 模型空间，再取极角（旧实现用 atan2(y, x)）
        const localStart = world2local.transformPoint3(startPos);
        const localEnd = world2local.transformPoint3(endPos);
        const startAngle = Math.atan2(localStart.y, localStart.x) * RAD2DEG;
        const endAngle = Math.atan2(localEnd.y, localEnd.x) * RAD2DEG;

        let min = Math.min(startAngle, endAngle);
        const max = Math.max(startAngle, endAngle);
        // 跨过 ±180 边界时取另一侧
        if (max - min > 180) min += 360;

        const r_sector = reactive(this.#sector.data);
        r_sector.startAngle = min;
        r_sector.endAngle = max;

        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        if (!r_host.children.includes(this.#sector.object3D)) r_host.children.push(this.#sector.object3D);
    }

    /** 隐藏旋转扇形区 */
    hideSector(): void
    {
        const host = this.entity as Object3D | null;
        if (!host || !this.#sector) return;

        const children = reactive(host).children;
        if (!children) return;
        const index = children.indexOf(this.#sector.object3D);
        if (index >= 0) children.splice(index, 1);
    }
}

// ---------------------------------------------------------------------------
// 自由旋转轴（CoordinateRotationFreeAxis）
// ---------------------------------------------------------------------------

/** 自由旋转轴组件（纯数据接口）：整圈线段，不做法线剔除。 */
export interface CoordinateRotationFreeAxis extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateRotationFreeAxis';

    /** 未选中颜色（缺失时由 Logic 填充） */
    readonly color?: Color4;

    /** 背面颜色（缺失时由 Logic 填充） */
    readonly backColor?: Color4;

    /** 选中颜色（缺失时由 Logic 填充） */
    readonly selectedColor?: Color4;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinateRotationFreeAxisLogic 逻辑类：重建整圈线段。 */
export class CoordinateRotationFreeAxisLogic extends ComponentLogicBase
{
    #data: CoordinateRotationFreeAxis;

    /** 整圈扇形（初始不可见，仅参与拾取） */
    #sector: { data: SectorObject3D; object3D: Object3D } | null = null;

    protected constructor(data: CoordinateRotationFreeAxis)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateRotationFreeAxis>;
        if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
        if (data.backColor === undefined) writable.backColor = BACK_COLOR;
        if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateRotationFreeAxis): CoordinateRotationFreeAxisLogic
    {
        return new CoordinateRotationFreeAxisLogic(data);
    }

    /** 整圈扇形数据（供 `RTool` 调整半径/挂载关系） */
    get sector(): SectorObject3D | null
    {
        return this.#sector?.data ?? null;
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 自由轴扇形：已挂载、不可见、可拾取（旧实现 `sector.update(0, 360)` + activeSelf = false）
        this.#sector = createSectorObject(ROTATION_AXIS_RADIUS, 0, 360);

        effect(() =>
        {
            const r_data = reactive(this.#data);
            const selected = r_data.selected;
            const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
            const radius = ROTATION_AXIS_RADIUS;

            if (this.#sector) reactive(this.#sector.data).radius = radius;

            const segments: Segment[] = [];
            let prev = circlePoint(0, radius);
            for (let i = 1; i <= CIRCLE_SEGMENTS; i++)
            {
                const current = circlePoint(i, radius);
                segments.push({ start: prev, end: current, startColor: color, endColor: color });
                prev = current;
            }

            for (const child of reactive(host).children ?? [])
            {
                if (child.name !== 'border') continue;
                const geometry = ((child.components ?? [])[0] as MeshRenderer | undefined)?.geometry as
                    UnReadonly<{ segments: Segment[] }> | undefined;
                if (geometry) reactive(geometry).segments = segments;
            }
        });
    }
}

/** 圆周上的第 i 度点（XY 平面，旧实现用 `(sin, cos) * radius`） */
function circlePoint(degree: number, radius: number): { x: number; y: number; z: number }
{
    const angle = degree * DEG2RAD;

    return { x: Math.sin(angle) * radius, y: Math.cos(angle) * radius, z: 0 };
}

/** 点积（Vector3 在新范式中是纯数据字面量，无 dot 方法） */
function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number
{
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

// 注册到 logic 分发表
registerLogic('RToolModel', RToolModelLogic as unknown as new (data: RToolModel) => RToolModelLogic);
registerLogic('CoordinateRotationAxis', CoordinateRotationAxisLogic as unknown as new (data: CoordinateRotationAxis) => CoordinateRotationAxisLogic);
registerLogic('CoordinateRotationFreeAxis', CoordinateRotationFreeAxisLogic as unknown as new (data: CoordinateRotationFreeAxis) => CoordinateRotationFreeAxisLogic);
