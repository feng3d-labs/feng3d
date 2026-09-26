import { ComponentLogicBase } from 'feng3d';
import type { Color4, Component3D, MeshRenderer, Object3D, Segment } from 'feng3d';
import { effect, reactive, UnReadonly } from '@feng3d/reactivity';
import type { CoordinateCube, GizmoPart } from './MToolModel';
import { color4 } from './MToolModel';

// ---------------------------------------------------------------------------
// 缩放工具模型（SToolModel）—— 纯数据接口 + Logic
// ---------------------------------------------------------------------------

/** 度 → 弧度（旧 `Transform` 的欧拉角是角度，新 `Object3D.rotation` 是弧度） */
const DEG2RAD = Math.PI / 180;

/** 缩放轴长度（模型空间；屏幕尺寸恒定由 MRSToolBase 缩放宿主实现） */
const SCALE_AXIS_LENGTH = 100;

/** 缩放轴手柄方块边长 */
const SCALE_CUBE_SIZE = 8;

/** 拖拽热区半径 / 起点偏移（旧实现 `topRadius: 5, height: this.length - 4`） */
const HIT_RADIUS = 5;
const HIT_OFFSET = 4;

/** 中心方块缩放（旧实现 `scale = 1.2`） */
const CENTER_CUBE_SCALE = 1.2;

/** 选中高亮色 */
const SELECTED_COLOR = color4(1, 1, 0, 1);

/** 白色顶点色（线段 rgb 由 `u_segmentColor` 决定） */
const WHITE = color4(1, 1, 1, 1);

/**
 * 缩放工具模型组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SToolModel extends Component`：旧 `initModels()` 用
 * `serialization.setValue(new Object3D(), {...}).addComponent(CoordinateScaleCube)` 命令式构建
 * 「3 个缩放轴 + 中心方块」，新范式改为纯数据字面量，由 {@link SToolModelLogic} 挂载并暴露引用。
 */
export interface SToolModel extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'SToolModel';
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        SToolModel: SToolModel;
        CoordinateScaleCube: CoordinateScaleCube;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SToolModel: SToolModelLogic;
        CoordinateScaleCube: CoordinateScaleCubeLogic;
    }
}

/** SToolModelLogic 逻辑类：在宿主对象下构建并持有三条缩放轴与中心方块。 */
export class SToolModelLogic extends ComponentLogicBase
{
    #data: SToolModel;

    #xCube: CoordinateScaleCube | null = null;
    #yCube: CoordinateScaleCube | null = null;
    #zCube: CoordinateScaleCube | null = null;
    #oCube: CoordinateCube | null = null;

    protected constructor(data: SToolModel)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SToolModel): SToolModelLogic
    {
        return new SToolModelLogic(data);
    }

    get xCube(): CoordinateScaleCube | null { return this.#xCube; }
    get yCube(): CoordinateScaleCube | null { return this.#yCube; }
    get zCube(): CoordinateScaleCube | null { return this.#zCube; }
    get oCube(): CoordinateCube | null { return this.#oCube; }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 轴默认沿 +Y：X 轴绕 Z 转 -90°、Z 轴绕 X 转 +90°（与旧实现角度值一致）
        const xCube = createScaleCube('xCube', color4(1, 0, 0, 1), { x: 0, y: 0, z: -90 * DEG2RAD });
        const yCube = createScaleCube('yCube', color4(0, 1, 0, 1));
        const zCube = createScaleCube('zCube', color4(0, 0, 1, 1), { x: 90 * DEG2RAD, y: 0, z: 0 });
        const oCube = createCenterCube('oCube');

        this.#xCube = xCube.data;
        this.#yCube = yCube.data;
        this.#zCube = zCube.data;
        this.#oCube = oCube.data;

        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        r_host.children.push(xCube.object3D, yCube.object3D, zCube.object3D, oCube.object3D);

        void this.#data;
    }
}

/** 构建一条缩放轴：轴线 + 轴端手柄方块（内嵌 `CoordinateCube`）+ 拖拽热区 */
function createScaleCube(
    name: string,
    color: Color4,
    rotation?: { x: number; y: number; z: number },
): GizmoPart<CoordinateScaleCube>
{
    const data: CoordinateScaleCube = { __type__: 'CoordinateScaleCube', color };
    const hitHeight = SCALE_AXIS_LENGTH - HIT_OFFSET;
    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        rotation,
        // 部件组件必须挂在宿主对象上：命中轴端手柄或热区后在对象树上回溯时靠它定位部件
        components: [data],
        children: [
            {
                __type__: 'Object3D',
                name: 'line',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: [] },
                    material: { __type__: 'SegmentMaterial', uniforms: { u_segmentColor: color } },
                }],
            },
            {
                __type__: 'Object3D',
                name: 'coordinateCube',
                // 位置（沿轴的长度）由 CoordinateScaleCubeLogic 按 scaleValue 写入
                components: [
                    { __type__: 'CoordinateCube' },
                    {
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'CubeGeometry', width: SCALE_CUBE_SIZE, height: SCALE_CUBE_SIZE, depth: SCALE_CUBE_SIZE },
                        material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color4(1, 1, 1, 1) } },
                    },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'hit',
                // 热区不可见但参与鼠标拾取（旧实现 activeSelf = false + mouseEnabled = true）
                activeSelf: false,
                mouseEnabled: true,
                position: { x: 0, y: HIT_OFFSET + hitHeight / 2, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: {
                        __type__: 'CylinderGeometry',
                        topRadius: HIT_RADIUS,
                        bottomRadius: HIT_RADIUS,
                        height: hitHeight,
                    },
                    material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color4(1, 1, 1, 1) } },
                }],
            },
        ],
    };

    return { data, object3D };
}

/** 构建中心方块（旧实现额外放大 1.2 倍） */
function createCenterCube(name: string): GizmoPart<CoordinateCube>
{
    const data: CoordinateCube = { __type__: 'CoordinateCube' };
    const object3D: Object3D = {
        __type__: 'Object3D',
        name,
        scale: { x: CENTER_CUBE_SCALE, y: CENTER_CUBE_SCALE, z: CENTER_CUBE_SCALE },
        mouseEnabled: true,
        components: [
            data,
            {
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: SCALE_CUBE_SIZE, height: SCALE_CUBE_SIZE, depth: SCALE_CUBE_SIZE },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color4(1, 1, 1, 1) } },
            },
        ],
    };

    return { data, object3D };
}

// ---------------------------------------------------------------------------
// 缩放轴（CoordinateScaleCube）
// ---------------------------------------------------------------------------

/** 缩放轴组件（纯数据接口）：`selected` / `scaleValue` 变化时同步轴线、手柄方块与选中态。 */
export interface CoordinateScaleCube extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateScaleCube';

    /** 未选中颜色（缺失时由 Logic 填充） */
    readonly color?: Color4;

    /** 选中颜色（缺失时由 Logic 填充） */
    readonly selectedColor?: Color4;

    /** 轴长度（缺失时由 Logic 填充） */
    readonly length?: number;

    /** 是否选中 */
    readonly selected?: boolean;

    /** 拖拽缩放系数（默认 1，由 `STool` 拖拽时写入） */
    readonly scaleValue?: number;
}

/** CoordinateScaleCubeLogic 逻辑类。 */
export class CoordinateScaleCubeLogic extends ComponentLogicBase
{
    #data: CoordinateScaleCube;

    protected constructor(data: CoordinateScaleCube)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateScaleCube>;
        if (data.color === undefined) writable.color = color4(1, 0, 0, 1);
        if (data.selectedColor === undefined) writable.selectedColor = SELECTED_COLOR;
        if (data.length === undefined) writable.length = SCALE_AXIS_LENGTH;
        if (data.selected === undefined) writable.selected = false;
        if (data.scaleValue === undefined) writable.scaleValue = 1;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateScaleCube): CoordinateScaleCubeLogic
    {
        return new CoordinateScaleCubeLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // @过渡 effect：缩放刻度从 data 派生的部分可由 computed 承担
        // （随 mrsTool 状态派生重构迁移）
        effect(() =>
        {
            // 经响应式代理读取：`selected` / `scaleValue` / 颜色任一变化都会重建
            const r_data = reactive(this.#data);
            const selected = r_data.selected;
            const scaleValue = r_data.scaleValue ?? 1;
            const length = r_data.length ?? SCALE_AXIS_LENGTH;
            const color = (selected ? r_data.selectedColor : r_data.color) ?? SELECTED_COLOR;
            const children = reactive(host).children ?? [];

            for (const child of children)
            {
                if (child.name === 'coordinateCube')
                {
                    // 手柄方块跟随配色与选中态，并沿轴移动到当前缩放长度处
                    const cube = (child.components ?? []).find((c) => c.__type__ === 'CoordinateCube') as CoordinateCube | undefined;
                    if (cube)
                    {
                        const r_cube = reactive(cube);
                        r_cube.color = color;
                        r_cube.selectedColor = r_data.selectedColor ?? SELECTED_COLOR;
                        r_cube.selected = selected ?? false;
                    }
                    reactive(child).position = { x: 0, y: length * scaleValue, z: 0 };

                    continue;
                }

                const renderer = (child.components ?? [])[0] as MeshRenderer | undefined;
                const material = renderer?.material as { uniforms?: { u_segmentColor?: Color4 } } | undefined;
                if (material?.uniforms) reactive(material.uniforms).u_segmentColor = color;

                // 轴线：随 scaleValue 伸缩（线段顶点色为白，颜色由材质 uniform 决定）
                const geometry = renderer?.geometry as UnReadonly<{ segments: Segment[] }> | undefined;
                if (geometry)
                {
                    reactive(geometry).segments = [{
                        start: { x: 0, y: 0, z: 0 },
                        end: { x: 0, y: scaleValue * length, z: 0 },
                        startColor: WHITE,
                        endColor: WHITE,
                    }];
                }
            }
        });
    }
}
