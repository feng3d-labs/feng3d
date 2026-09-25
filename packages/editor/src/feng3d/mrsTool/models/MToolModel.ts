import { ComponentLogicBase } from 'feng3d';
import type { Color4, Component3D, CustomGeometry, MeshRenderer, Object3D, Segment } from 'feng3d';
import { effect, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';

// ---------------------------------------------------------------------------
// 移动工具模型（MToolModel）—— 纯数据接口 + Logic
// ---------------------------------------------------------------------------

/** 度 → 弧度（旧 `Transform` 的欧拉角是角度，新 `Object3D.rotation` 是弧度） */
const DEG2RAD = Math.PI / 180;

/** 坐标轴长度（模型空间；屏幕尺寸恒定由 MRSToolBase 缩放宿主实现） */
const AXIS_LENGTH = 100;

/** 箭头圆锥半径 / 高度 */
const ARROW_RADIUS = 5;
const ARROW_HEIGHT = 18;

/** 中心立方体边长 */
const CUBE_SIZE = 8;

/** 平面边长 */
const PLANE_WIDTH = 20;

/** 平面填充色 alpha（未选中 / 选中） */
const PLANE_ALPHA = 0.2;
const PLANE_SELECTED_ALPHA = 0.5;

/** 纯数据色（`ColorMaterial` / `SegmentMaterial` 的 alpha 由顶点色决定，见材质着色器注释） */
export function color4(r: number, g: number, b: number, a: number): Color4
{
    return { __type__: 'Color4', r, g, b, a };
}

/** 白色顶点色（rgb 交由材质 uniform 决定，alpha 由顶点色决定） */
const WHITE = color4(1, 1, 1, 1);

/** 轴 / 平面 / 立方体的选中高亮色 */
const SELECTED_COLOR = color4(1, 1, 0, 1);

/**
 * 移动工具模型组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class MToolModel extends Component`。旧 `init()` 用
 * `serialization.setValue(new Object3D(), {...}).addComponent(Xxx)` 命令式构建
 * 「3 轴 + 3 平面 + 中心方块」，新范式改为纯数据字面量，由 {@link MToolModelLogic}
 * 在宿主对象下挂载，并把子组件引用暴露给交互层（`MTool`）。
 */
export interface MToolModel extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'MToolModel';
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        MToolModel: MToolModel;
        CoordinateAxis: CoordinateAxis;
        CoordinateCube: CoordinateCube;
        CoordinatePlane: CoordinatePlane;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MToolModel: MToolModelLogic;
        CoordinateAxis: CoordinateAxisLogic;
        CoordinateCube: CoordinateCubeLogic;
        CoordinatePlane: CoordinatePlaneLogic;
    }
}

/** 已构建的 gizmo 部件（数据 + 实体对象） */
export interface GizmoPart<T>
{
    readonly data: T;
    readonly object3D: Object3D;
}

/** MToolModelLogic 逻辑类：在宿主对象下构建并持有 gizmo 部件。 */
export class MToolModelLogic extends ComponentLogicBase
{
    #data: MToolModel;

    #xAxis: CoordinateAxis | null = null;
    #yAxis: CoordinateAxis | null = null;
    #zAxis: CoordinateAxis | null = null;
    #yzPlane: CoordinatePlane | null = null;
    #xzPlane: CoordinatePlane | null = null;
    #xyPlane: CoordinatePlane | null = null;
    #oCube: CoordinateCube | null = null;

    protected constructor(data: MToolModel)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: MToolModel): MToolModelLogic
    {
        return new MToolModelLogic(data);
    }

    get xAxis(): CoordinateAxis | null { return this.#xAxis; }
    get yAxis(): CoordinateAxis | null { return this.#yAxis; }
    get zAxis(): CoordinateAxis | null { return this.#zAxis; }
    get yzPlane(): CoordinatePlane | null { return this.#yzPlane; }
    get xzPlane(): CoordinatePlane | null { return this.#xzPlane; }
    get xyPlane(): CoordinatePlane | null { return this.#xyPlane; }
    get oCube(): CoordinateCube | null { return this.#oCube; }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 轴：默认沿 +Y，X 轴绕 Z 转 -90°、Z 轴绕 X 转 +90°（旧实现 rotation 用角度）
        const xAxis = createAxis('xAxis', color4(1, 0, 0, 1), { x: 0, y: 0, z: -90 * DEG2RAD });
        const yAxis = createAxis('yAxis', color4(0, 1, 0, 1));
        const zAxis = createAxis('zAxis', color4(0, 0, 1, 1), { x: 90 * DEG2RAD, y: 0, z: 0 });

        // 平面：几何体为水平面（XZ），xzPlane 无需旋转，其余绕轴旋转得到 XY / YZ 平面
        const yzPlane = createPlane('yzPlane', color4(1, 0, 0, 1), { x: 0, y: 0, z: 90 * DEG2RAD });
        const xzPlane = createPlane('xzPlane', color4(0, 1, 0, 1));
        const xyPlane = createPlane('xyPlane', color4(0, 0, 1, 1), { x: -90 * DEG2RAD, y: 0, z: 0 });

        const oCube = createCube('oCube');

        this.#xAxis = xAxis.data;
        this.#yAxis = yAxis.data;
        this.#zAxis = zAxis.data;
        this.#yzPlane = yzPlane.data;
        this.#xzPlane = xzPlane.data;
        this.#xyPlane = xyPlane.data;
        this.#oCube = oCube.data;

        // 挂到宿主对象下（父子关系由 ContainerLogic 的 effect 维护）
        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        r_host.children.push(
            xAxis.object3D, yAxis.object3D, zAxis.object3D,
            yzPlane.object3D, xzPlane.object3D, xyPlane.object3D,
            oCube.object3D,
        );

        void this.#data;
    }
}

/** 构建坐标轴：线段（原点→长度）+ 端点圆锥箭头 + 不可见圆柱热区 */
function createAxis(
    name: string,
    color: Color4,
    rotation?: { x: number; y: number; z: number },
): GizmoPart<CoordinateAxis>
{
    const data: CoordinateAxis = { __type__: 'CoordinateAxis', color };
    const segment: Segment = {
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: AXIS_LENGTH, z: 0 },
        startColor: WHITE,
        endColor: WHITE,
    };
    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        rotation,
        children: [
            {
                __type__: 'Object3D',
                name: 'line',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: [segment] },
                    material: { __type__: 'SegmentMaterial', uniforms: { u_segmentColor: color } },
                }],
            },
            {
                __type__: 'Object3D',
                name: 'arrow',
                position: { x: 0, y: AXIS_LENGTH, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'ConeGeometry', bottomRadius: ARROW_RADIUS, height: ARROW_HEIGHT },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color } },
                }],
            },
            {
                __type__: 'Object3D',
                name: 'hitCoordinateAxis',
                // 热区不可见但参与鼠标拾取（旧实现 activeSelf = false + mouseEnabled = true）
                activeSelf: false,
                mouseEnabled: true,
                position: { x: 0, y: 20 + (AXIS_LENGTH - 20) / 2, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CylinderGeometry', topRadius: ARROW_RADIUS, bottomRadius: ARROW_RADIUS, height: AXIS_LENGTH },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color } },
                }],
            },
        ],
    };

    return { data, object3D };
}

/** 构建中心立方体：8×8×8 方块，参与拾取 */
function createCube(name: string): GizmoPart<CoordinateCube>
{
    const data: CoordinateCube = { __type__: 'CoordinateCube' };
    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        mouseEnabled: true,
        components: [
            data,
            {
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: CUBE_SIZE, height: CUBE_SIZE, depth: CUBE_SIZE },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color4(1, 1, 1, 1) } },
            },
        ],
    };

    return { data, object3D };
}

/**
 * 构建坐标平面：半透明四边形（正反两套三角形绕序，规避 `cullFace: 'back'`）+ 四条边框线段。
 *
 * 用 `CustomGeometry` 而非 `PlaneGeometry` 的原因：`ColorMaterial` 的**顶点色 alpha 决定最终
 * 透明度**（见其 WGSL 注释），只有自建顶点色才能表达半透明平面。
 */
function createPlane(
    name: string,
    color: Color4,
    rotation?: { x: number; y: number; z: number },
): GizmoPart<CoordinatePlane>
{
    const data: CoordinatePlane = { __type__: 'CoordinatePlane', color };
    const w = PLANE_WIDTH;
    const alpha = PLANE_ALPHA;

    // 水平四边形：角在原点，向 +X / +Z 铺开
    const geometry: CustomGeometry = {
        __type__: 'CustomGeometry',
        positions: [0, 0, 0, w, 0, 0, w, 0, w, 0, 0, w],
        normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        uvs: [0, 0, 1, 0, 1, 1, 0, 1],
        colors: [1, 1, 1, alpha, 1, 1, 1, alpha, 1, 1, 1, alpha, 1, 1, 1, alpha],
        // 两组绕序同时存在：任一侧朝向相机都有正面三角形，等价于双面渲染
        indices: [0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2],
    };

    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        rotation,
        children: [
            {
                __type__: 'Object3D',
                name: 'plane',
                mouseEnabled: true,
                components: [
                    data,
                    {
                        __type__: 'MeshRenderer',
                        geometry,
                        material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color } },
                    },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'border',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: [] },
                    material: { __type__: 'SegmentMaterial', uniforms: { u_segmentColor: color } },
                }],
            },
        ],
    };

    return { data, object3D };
}

// ---------------------------------------------------------------------------
// 坐标轴（CoordinateAxis）
// ---------------------------------------------------------------------------

/** 坐标轴组件（纯数据接口）：`selected` 变化时线段与箭头切到 `selectedColor`。 */
export interface CoordinateAxis extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateAxis';

    /** 未选中颜色（缺失时由 Logic 填充） */
    readonly color?: Color4;

    /** 选中颜色（缺失时由 Logic 填充） */
    readonly selectedColor?: Color4;

    /** 轴长度（缺失时由 Logic 填充） */
    readonly length?: number;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinateAxisLogic 逻辑类：把 `selected` / 颜色映射到线段与箭头材质。 */
export class CoordinateAxisLogic extends ComponentLogicBase
{
    #data: CoordinateAxis;

    protected constructor(data: CoordinateAxis)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateAxis>;
        if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
        if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
        if (data.length === undefined) writable.length = AXIS_LENGTH;
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateAxis): CoordinateAxisLogic
    {
        return new CoordinateAxisLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 依据子对象材质类型写 uniform：线段走 u_segmentColor、箭头/热区走 u_diffuseInput
        effect(() =>
        {
            // 经响应式代理读取（外部改 color / selectedColor 时同样触发重算）
            const r_data = reactive(this.#data);
            const selected = r_data.selected;
            const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
            const target = color4(color.r, color.g, color.b, color.a);
            const children = reactive(host).children ?? [];

            for (const child of children)
            {
                const material = (child.components?.[0] as MeshRenderer | undefined)?.material as
                    { __type__?: string; uniforms?: { u_segmentColor?: Color4; u_diffuseInput?: Color4 } } | undefined;
                if (!material?.uniforms) continue;

                const r_uniforms = reactive(material.uniforms);
                if (material.__type__ === 'SegmentMaterial') r_uniforms.u_segmentColor = target;
                else r_uniforms.u_diffuseInput = target;
            }
        });
    }
}

// ---------------------------------------------------------------------------
// 中心立方体（CoordinateCube）
// ---------------------------------------------------------------------------

/**
 * 中心立方体组件（纯数据接口）。
 *
 * 注意：`CoordinateScaleCubeLogic`（缩放工具）会把 `color` / `selectedColor` 换成缩放轴配色，
 * 因此这两个字段在运行时会被写入。
 */
export interface CoordinateCube extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateCube';

    /** 未选中颜色（缺失时由 Logic 填充） */
    readonly color?: Color4;

    /** 选中颜色（缺失时由 Logic 填充） */
    readonly selectedColor?: Color4;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinateCubeLogic 逻辑类：把 `selected` / 颜色映射到方块材质。 */
export class CoordinateCubeLogic extends ComponentLogicBase
{
    #data: CoordinateCube;

    protected constructor(data: CoordinateCube)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateCube>;
        if (data.color === undefined) writable.color = color4(1, 1, 1, 1);
        if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateCube): CoordinateCubeLogic
    {
        return new CoordinateCubeLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 渲染器与组件同对象；若挂在子对象上（旧结构）则回落查找子对象
        effect(() =>
        {
            const r_data = reactive(this.#data);
            const selected = r_data.selected;
            const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
            let renderer = (host.components ?? []).find((c) => c.__type__ === 'MeshRenderer') as MeshRenderer | undefined;
            if (!renderer)
            {
                for (const child of reactive(host).children ?? [])
                {
                    renderer = (child.components ?? []).find((c) => c.__type__ === 'MeshRenderer') as MeshRenderer | undefined;
                    if (renderer) break;
                }
            }
            const material = renderer?.material as { uniforms?: { u_diffuseInput?: Color4 } } | undefined;
            const uniforms = material?.uniforms;
            if (!uniforms) return;

            reactive(uniforms).u_diffuseInput = color4(color.r, color.g, color.b, color.a);
        });
    }
}

// ---------------------------------------------------------------------------
// 坐标平面（CoordinatePlane）
// ---------------------------------------------------------------------------

/** 坐标平面组件（纯数据接口）：半透明四边形 + 四条边框线段，`selected` 时提亮。 */
export interface CoordinatePlane extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinatePlane';

    /** 未选中填充色（缺失时由 Logic 填充） */
    readonly color?: Color4;

    /** 未选中边框色（缺失时由 Logic 填充） */
    readonly borderColor?: Color4;

    /** 选中填充色（缺失时由 Logic 填充） */
    readonly selectedColor?: Color4;

    /** 选中边框色（缺失时由 Logic 填充） */
    readonly selectedborderColor?: Color4;

    /** 平面边长（缺失时由 Logic 填充） */
    readonly width?: number;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinatePlaneLogic 逻辑类：写平面顶点色（含 alpha）并重建四条边框线段。 */
export class CoordinatePlaneLogic extends ComponentLogicBase
{
    #data: CoordinatePlane;

    protected constructor(data: CoordinatePlane)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinatePlane>;
        if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
        if (data.borderColor === undefined) writable.borderColor = color4(1, 0, 0, 1);
        if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
        if (data.selectedborderColor === undefined) writable.selectedborderColor = SELECTED_COLOR;
        if (data.width === undefined) writable.width = PLANE_WIDTH;
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinatePlane): CoordinatePlaneLogic
    {
        return new CoordinatePlaneLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        effect(() =>
        {
            const r_data = reactive(this.#data);
            const selected = r_data.selected;
            const fill = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
            const border = (selected ? r_data.selectedborderColor : r_data.borderColor) ?? SELECTED_COLOR;
            const alpha = selected ? PLANE_SELECTED_ALPHA : PLANE_ALPHA;
            const w = r_data.width ?? PLANE_WIDTH;
            const children = reactive(host).children ?? [];

            for (const child of children)
            {
                const material = (child.components?.[0] as MeshRenderer | undefined)?.material as
                    { __type__?: string; uniforms?: { u_diffuseInput?: Color4; u_segmentColor?: Color4 } } | undefined;
                if (!material?.uniforms) continue;

                const r_uniforms = reactive(material.uniforms);
                if (material.__type__ === 'ColorMaterial')
                {
                    // 填充色 rgb 走 uniform；透明度的最终来源是顶点色 alpha，需同步改顶点色
                    r_uniforms.u_diffuseInput = color4(fill.r, fill.g, fill.b, fill.a);
                    const renderer = child.components?.[0] as MeshRenderer | undefined;
                    const geometry = renderer?.geometry as UnReadonly<CustomGeometry> | undefined;
                    if (geometry)
                    {
                        reactive(geometry).colors = [
                            1, 1, 1, alpha, 1, 1, 1, alpha, 1, 1, 1, alpha, 1, 1, 1, alpha,
                        ];
                    }
                }
                else
                {
                    r_uniforms.u_segmentColor = color4(border.r, border.g, border.b, border.a);
                    // 边框：闭合正方形四边（线段顶点色为白，颜色由材质 uniform 决定）
                    const renderer = child.components?.[0] as MeshRenderer | undefined;
                    const geometry = renderer?.geometry as UnReadonly<SegmentGeometryShape> | undefined;
                    if (geometry)
                    {
                        const segment = (x0: number, z0: number, x1: number, z1: number): Segment => ({
                            start: { x: x0, y: 0, z: z0 },
                            end: { x: x1, y: 0, z: z1 },
                            startColor: WHITE,
                            endColor: WHITE,
                        });
                        reactive(geometry).segments = [
                            segment(0, 0, w, 0), segment(w, 0, w, w), segment(w, w, 0, w), segment(0, w, 0, 0),
                        ];
                    }
                }
            }
        });
    }
}

/** 边框几何体的可写形态（`segments` 整体替换） */
interface SegmentGeometryShape
{
    segments: Segment[];
}

// 注册到 logic 分发表
registerLogic('MToolModel', MToolModelLogic as unknown as new (data: MToolModel) => MToolModelLogic);
registerLogic('CoordinateAxis', CoordinateAxisLogic as unknown as new (data: CoordinateAxis) => CoordinateAxisLogic);
registerLogic('CoordinateCube', CoordinateCubeLogic as unknown as new (data: CoordinateCube) => CoordinateCubeLogic);
registerLogic('CoordinatePlane', CoordinatePlaneLogic as unknown as new (data: CoordinatePlane) => CoordinatePlaneLogic);
