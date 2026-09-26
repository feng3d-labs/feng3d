import { ComponentLogicBase } from 'feng3d';
import type { Color4, Component3D, MeshRenderer, Object3D, Segment } from 'feng3d';
import { effect, reactive, UnReadonly } from '@feng3d/reactivity';
import { color4 } from './MToolModel';

// ---------------------------------------------------------------------------
// 扇形对象（SectorObject3D）—— 旋转工具拖拽时显示的扇形区
// ---------------------------------------------------------------------------

/** 度 → 弧度 */
const DEG2RAD = Math.PI / 180;

/** 扇形半径（模型空间，默认 80） */
const SECTOR_RADIUS = 80;

/** 扇形填充色（rgb 走材质 uniform，alpha 由顶点色决定） */
const SECTOR_FILL = color4(0.5, 0.5, 0.5, 1);

/** 扇形填充透明度（顶点色 alpha） */
const SECTOR_ALPHA = 0.2;

/** 边框色（顶点色携带，alpha 0.6） */
const SECTOR_BORDER = color4(0, 1, 1, 0.6);

/**
 * 扇形对象组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SectorObject3D extends Component`：旧实现的私有
 * `_start` / `_end` 由 `update(start, end)` 命令式写入，新范式改为 {@link startAngle} /
 * {@link endAngle} 两个可响应式写入的数据字段，几何体由 Logic 的 effect 重建。
 */
export interface SectorObject3D extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'SectorObject3D';

    /** 扇形半径（缺失时由 Logic 填充） */
    readonly radius?: number;

    /** 边框颜色（缺失时由 Logic 填充） */
    readonly borderColor?: Color4;

    /** 起始角（度，缺失时由 Logic 填充） */
    readonly startAngle?: number;

    /** 结束角（度，缺失时由 Logic 填充） */
    readonly endAngle?: number;
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        SectorObject3D: SectorObject3D;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SectorObject3D: SectorObject3DLogic;
    }
}

/** SectorObject3DLogic 逻辑类：按起止角重建三角扇与两条边框线段。 */
export class SectorObject3DLogic extends ComponentLogicBase
{
    #data: SectorObject3D;

    protected constructor(data: SectorObject3D)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<SectorObject3D>;
        if (data.radius === undefined) writable.radius = SECTOR_RADIUS;
        if (data.borderColor === undefined) writable.borderColor = SECTOR_BORDER;
        if (data.startAngle === undefined) writable.startAngle = 0;
        if (data.endAngle === undefined) writable.endAngle = 0;

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

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // @过渡 effect：几何体顶点可由 computed 派生（随 mrsTool 状态派生重构迁移）
        // 起止角 / 半径 / 边框色任一变化都重建几何体
        effect(() => this.#rebuild(host));
    }

    /** 重建三角扇顶点/索引与边框线段 */
    #rebuild(host: Object3D): void
    {
        const r_data = reactive(this.#data);
        const radius = r_data.radius ?? SECTOR_RADIUS;
        const borderColor = r_data.borderColor ?? SECTOR_BORDER;
        const start = r_data.startAngle ?? 0;
        const end = r_data.endAngle ?? 0;

        const min = Math.min(start, end);
        const max = Math.max(start, end);
        // 旧实现：角跨度向下取整，为 0 时至少一段
        const length = Math.max(1, Math.floor(max - min));

        // 三角扇：中心点 + 弧上各点（角度用弧度直接计算，避免引入 mathUtil 依赖）
        const positions: number[] = [0, 0, 0];
        const colors: number[] = [1, 1, 1, SECTOR_ALPHA];
        for (let i = 0; i < length; i++)
        {
            const angle = (i + min) * DEG2RAD;
            positions.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
            colors.push(1, 1, 1, SECTOR_ALPHA);
        }
        const indices: number[] = [];
        for (let i = 1; i < length; i++)
        {
            // 两组绕序同时存在 → 双面可见（替代旧实现的 setCullFace(material, 'none')）
            indices.push(0, i, i + 1, 0, i + 1, i);
        }
        if (indices.length === 0) indices.push(0, 0, 0);

        // 渲染器与组件同对象；边框在子对象上
        const renderer = (host.components ?? []).find((c) => c.__type__ === 'MeshRenderer') as MeshRenderer | undefined;
        const geometry = renderer?.geometry as UnReadonly<{ positions?: number[]; indices?: number[]; colors?: number[] }> | undefined;
        if (geometry)
        {
            const r_geometry = reactive(geometry);
            r_geometry.positions = positions;
            r_geometry.indices = indices;
            r_geometry.colors = colors;
        }

        for (const child of reactive(host).children ?? [])
        {
            if (child.name !== 'border') continue;
            const borderGeometry = ((child.components ?? [])[0] as MeshRenderer | undefined)?.geometry as
                UnReadonly<{ segments: Segment[] }> | undefined;
            if (!borderGeometry) continue;

            // 旧实现：两条边界线各外扩 0.1°，使边界线压在扇形边缘上
            const startAngle = (min - 0.1) * DEG2RAD;
            const endAngle = (max + 0.1) * DEG2RAD;
            reactive(borderGeometry).segments = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: radius * Math.cos(startAngle), y: radius * Math.sin(startAngle), z: 0 },
                    startColor: borderColor,
                    endColor: borderColor,
                },
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: radius * Math.cos(endAngle), y: radius * Math.sin(endAngle), z: 0 },
                    startColor: borderColor,
                    endColor: borderColor,
                },
            ];
        }
    }
}

/**
 * 创建扇形对象实体（游离，由调用方决定何时挂到父级）。
 *
 * @param radius 扇形半径
 * @param startAngle 起始角（度）
 * @param endAngle 结束角（度）
 */
export function createSectorObject(
    radius = SECTOR_RADIUS,
    startAngle = 0,
    endAngle = 0,
): { data: SectorObject3D; object3D: Object3D }
{
    const data: SectorObject3D = { __type__: 'SectorObject3D', radius, startAngle, endAngle };
    const object3D: Object3D = {
        __type__: 'Object3D',
        name: 'sector',
        activeSelf: false,
        mouseEnabled: true,
        components: [
            data,
            {
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CustomGeometry' },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: SECTOR_FILL } },
            },
        ],
        children: [{
            __type__: 'Object3D',
            name: 'border',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SegmentGeometry', segments: [] },
                material: { __type__: 'SegmentMaterial', uniforms: { u_segmentColor: color4(1, 1, 1, 1) } },
            }],
        }],
    };

    return { data, object3D };
}
