import { componentLogicProto, logic as getLogic, mat4TransformPoint3, mat4TransformVector3, setupComponentLogicState, Vector3Like } from 'feng3d';
import type { Color4, Component3D, Component3DLogic, ComponentLogicState, MeshRenderer, Object3D, Segment, Vector3 } from 'feng3d';
import { createLogicProto, effect, reactive, UnReadonly } from '@feng3d/reactivity';
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
export interface RToolModelLogic extends Component3DLogic
{
    /** X 轴旋转部件（init 前为 null） */
    readonly xAxis: CoordinateRotationAxis | null;
    /** Y 轴旋转部件（init 前为 null） */
    readonly yAxis: CoordinateRotationAxis | null;
    /** Z 轴旋转部件（init 前为 null） */
    readonly zAxis: CoordinateRotationAxis | null;
    /** 相机朝向轴部件（init 前为 null） */
    readonly cameraAxis: CoordinateRotationAxis | null;
    /** 自由旋转轴部件（init 前为 null） */
    readonly freeAxis: CoordinateRotationFreeAxis | null;
}

/** RToolModelLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface RToolModelLogicState extends ComponentLogicState
{
    /** 关联的组件数据（raw） */
    _data: RToolModel;

    _xAxis: CoordinateRotationAxis | null;
    _yAxis: CoordinateRotationAxis | null;
    _zAxis: CoordinateRotationAxis | null;
    _cameraAxis: CoordinateRotationAxis | null;
    _freeAxis: CoordinateRotationFreeAxis | null;
}

/** RToolModelLogic 的共享原型：继承 Component 基类实现，覆写 init */
const rToolModelLogicProto = createLogicProto<RToolModelLogic>(componentLogicProto, {
    xAxis: {
        get: function (this: RToolModelLogic & RToolModelLogicState): CoordinateRotationAxis | null { return this._xAxis; },
    },
    yAxis: {
        get: function (this: RToolModelLogic & RToolModelLogicState): CoordinateRotationAxis | null { return this._yAxis; },
    },
    zAxis: {
        get: function (this: RToolModelLogic & RToolModelLogicState): CoordinateRotationAxis | null { return this._zAxis; },
    },
    cameraAxis: {
        get: function (this: RToolModelLogic & RToolModelLogicState): CoordinateRotationAxis | null { return this._cameraAxis; },
    },
    freeAxis: {
        get: function (this: RToolModelLogic & RToolModelLogicState): CoordinateRotationFreeAxis | null { return this._freeAxis; },
    },
    init: {
        value: function (this: RToolModelLogic & RToolModelLogicState, entity?: Object3D): void
        {
            componentLogicProto.init.call(this, entity);

            const host = entity ?? (this.entity as Object3D | null);
            if (!host) return;

            // 圆环默认位于 XY 平面（绕 Z 轴）：X 轴绕 Y 转 90°、Y 轴绕 X 转 90°（旧实现角度值）
            const xAxis = createRotationAxis('xAxis', color4(1, 0, 0, 1), { x: 0, y: 90 * DEG2RAD, z: 0 });
            const yAxis = createRotationAxis('yAxis', color4(0, 1, 0, 1), { x: 90 * DEG2RAD, y: 0, z: 0 });
            const zAxis = createRotationAxis('zAxis', color4(0, 0, 1, 1));
            const cameraAxis = createRotationAxis('cameraAxis', color4(1, 1, 1, 1), undefined, CAMERA_AXIS_RADIUS);
            const freeAxis = createFreeAxis('freeAxis', color4(1, 1, 1, 1));

            this._xAxis = xAxis.data;
            this._yAxis = yAxis.data;
            this._zAxis = zAxis.data;
            this._cameraAxis = cameraAxis.data;
            this._freeAxis = freeAxis.data;

            const r_host = reactive(host);
            if (!r_host.children) (host as { children: Object3D[] }).children = [];
            // 补齐写在 raw 上、TS 无法据此收窄代理读取，取一次到局部变量（读代理仍建立依赖）
            const children = r_host.children!;
            children.push(xAxis.object3D, yAxis.object3D, zAxis.object3D, cameraAxis.object3D, freeAxis.object3D);

            void this._data;
        },
    },
});

/**
 * 工厂函数：RToolModelLogic 的唯一创建入口。
 *
 * @param data 旋转工具模型数据（raw）
 */
export function rToolModelLogic(data: RToolModel): RToolModelLogic
{
    const logic = setupComponentLogicState(Object.create(rToolModelLogicProto) as RToolModelLogic & RToolModelLogicState, data);
    logic._data = data;
    logic._xAxis = null;
    logic._yAxis = null;
    logic._zAxis = null;
    logic._cameraAxis = null;
    logic._freeAxis = null;

    return logic;
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
    readonly filterNormal?: Vector3Like;
}

/** CoordinateRotationAxisLogic 逻辑类：重建圆周线段（含背面剔除）并同步半径/选中态。 */
export interface CoordinateRotationAxisLogic extends Component3DLogic
{
    /** 显示旋转扇形区（入参为世界坐标起点/终点） */
    showSector(startPos: Vector3Like, endPos: Vector3Like): void;
    /** 隐藏旋转扇形区 */
    hideSector(): void;
}

/** CoordinateRotationAxisLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface CoordinateRotationAxisLogicState extends ComponentLogicState
{
    /** 关联的组件数据（raw） */
    _data: CoordinateRotationAxis;

    /** 扇形对象（拖拽时挂到宿主下，平时游离） */
    _sector: { data: SectorObject3D; object3D: Object3D } | null;
}

/** CoordinateRotationAxisLogic 的共享原型：继承 Component 基类实现，覆写 init */
const coordinateRotationAxisLogicProto = createLogicProto<CoordinateRotationAxisLogic>(componentLogicProto, {
    init: {
        value: function (this: CoordinateRotationAxisLogic & CoordinateRotationAxisLogicState, entity?: Object3D): void
        {
            componentLogicProto.init.call(this, entity);

            const host = entity ?? (this.entity as Object3D | null);
            if (!host) return;

            // 扇形对象：不挂在宿主下，showSector 时才挂（旧实现 `this.object3D.addChild(sector)`）
            this._sector = createSectorObject(this._data.radius ?? ROTATION_AXIS_RADIUS);

            // @过渡 effect：圆环/扇形从 data 派生的部分可由 computed 承担
            // （随 mrsTool 状态派生重构迁移）
            effect(() =>
            {
                // 经响应式代理读取：selected / filterNormal / 颜色 / 半径变化都会重建
                const r_data = reactive(this._data);
                const selected = r_data.selected;
                const radius = r_data.radius ?? ROTATION_AXIS_RADIUS;
                const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
                const backColor = r_data.backColor ?? BACK_COLOR;
                const filterNormal = r_data.filterNormal;

                // 扇形半径跟随圆环半径
                if (this._sector) reactive(this._sector.data).radius = radius;

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
                // 阶段 C-e：`Matrix4x4.transformVector3` 已删除，缺省 out 就是纯字面量（只读分量，够用）
                const world2local = getLogic(host)?.world2local;
                const localNormal = filterNormal && world2local ? mat4TransformVector3(world2local, filterNormal) : undefined;

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
        },
    },
    /** 显示旋转扇形区（入参为世界坐标起点/终点） */
    showSector: {
        value: function (this: CoordinateRotationAxisLogic & CoordinateRotationAxisLogicState, startPos: Vector3Like, endPos: Vector3Like): void
        {
            const host = this.entity as Object3D | null;
            if (!host || !this._sector) return;

            const world2local = getLogic(host)?.world2local;
            if (!world2local) return;

            // 世界坐标 → 模型空间，再取极角（旧实现用 atan2(y, x)）
            const localStart = mat4TransformPoint3(world2local, startPos);
            const localEnd = mat4TransformPoint3(world2local, endPos);
            const startAngle = Math.atan2(localStart.y, localStart.x) * RAD2DEG;
            const endAngle = Math.atan2(localEnd.y, localEnd.x) * RAD2DEG;

            let min = Math.min(startAngle, endAngle);
            const max = Math.max(startAngle, endAngle);
            // 跨过 ±180 边界时取另一侧
            if (max - min > 180) min += 360;

            const r_sector = reactive(this._sector.data);
            r_sector.startAngle = min;
            r_sector.endAngle = max;

            const r_host = reactive(host);
            if (!r_host.children) (host as { children: Object3D[] }).children = [];
            // 补齐写在 raw 上、TS 无法据此收窄代理读取，取一次到局部变量（读代理仍建立依赖）
            const children = r_host.children!;

            if (!children.includes(this._sector.object3D)) children.push(this._sector.object3D);
        },
    },
    /** 隐藏旋转扇形区 */
    hideSector: {
        value: function (this: CoordinateRotationAxisLogic & CoordinateRotationAxisLogicState): void
        {
            const host = this.entity as Object3D | null;
            if (!host || !this._sector) return;

            const children = reactive(host).children;
            if (!children) return;
            const index = children.indexOf(this._sector.object3D);
            if (index >= 0) children.splice(index, 1);
        },
    },
});

/**
 * 工厂函数：CoordinateRotationAxisLogic 的唯一创建入口。
 *
 * @param data 旋转轴数据（raw）
 */
export function coordinateRotationAxisLogic(data: CoordinateRotationAxis): CoordinateRotationAxisLogic
{
    // 默认值填充
    const writable = data as UnReadonly<CoordinateRotationAxis>;
    if (data.radius === undefined) writable.radius = ROTATION_AXIS_RADIUS;
    if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
    if (data.backColor === undefined) writable.backColor = BACK_COLOR;
    if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
    if (data.selected === undefined) writable.selected = false;

    const logic = setupComponentLogicState(Object.create(coordinateRotationAxisLogicProto) as CoordinateRotationAxisLogic & CoordinateRotationAxisLogicState, data);
    logic._data = data;
    logic._sector = null;

    return logic;
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
export interface CoordinateRotationFreeAxisLogic extends Component3DLogic
{
    /** 整圈扇形数据（供 `RTool` 调整半径/挂载关系） */
    readonly sector: SectorObject3D | null;
}

/** CoordinateRotationFreeAxisLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface CoordinateRotationFreeAxisLogicState extends ComponentLogicState
{
    /** 关联的组件数据（raw） */
    _data: CoordinateRotationFreeAxis;

    /** 整圈扇形（初始不可见，仅参与拾取） */
    _sector: { data: SectorObject3D; object3D: Object3D } | null;
}

/** CoordinateRotationFreeAxisLogic 的共享原型：继承 Component 基类实现，覆写 init */
const coordinateRotationFreeAxisLogicProto = createLogicProto<CoordinateRotationFreeAxisLogic>(componentLogicProto, {
    /** 整圈扇形数据（供 `RTool` 调整半径/挂载关系） */
    sector: {
        get: function (this: CoordinateRotationFreeAxisLogic & CoordinateRotationFreeAxisLogicState): SectorObject3D | null
        {
            return this._sector?.data ?? null;
        },
    },
    init: {
        value: function (this: CoordinateRotationFreeAxisLogic & CoordinateRotationFreeAxisLogicState, entity?: Object3D): void
        {
            componentLogicProto.init.call(this, entity);

            const host = entity ?? (this.entity as Object3D | null);
            if (!host) return;

            // 自由轴扇形：已挂载、不可见、可拾取（旧实现 `sector.update(0, 360)` + activeSelf = false）
            this._sector = createSectorObject(ROTATION_AXIS_RADIUS, 0, 360);

            // @过渡 effect：角度刻度线的生成可由 computed 派生（随 mrsTool 状态派生重构迁移）
            effect(() =>
            {
                const r_data = reactive(this._data);
                const selected = r_data.selected;
                const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
                const radius = ROTATION_AXIS_RADIUS;

                if (this._sector) reactive(this._sector.data).radius = radius;

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
        },
    },
});

/**
 * 工厂函数：CoordinateRotationFreeAxisLogic 的唯一创建入口。
 *
 * @param data 自由旋转轴数据（raw）
 */
export function coordinateRotationFreeAxisLogic(data: CoordinateRotationFreeAxis): CoordinateRotationFreeAxisLogic
{
    // 默认值填充
    const writable = data as UnReadonly<CoordinateRotationFreeAxis>;
    if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
    if (data.backColor === undefined) writable.backColor = BACK_COLOR;
    if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
    if (data.selected === undefined) writable.selected = false;

    const logic = setupComponentLogicState(Object.create(coordinateRotationFreeAxisLogicProto) as CoordinateRotationFreeAxisLogic & CoordinateRotationFreeAxisLogicState, data);
    logic._data = data;
    logic._sector = null;

    return logic;
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
