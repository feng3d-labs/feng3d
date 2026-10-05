import { Vector3Like } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { computedAttr, Geometry, geometryLogicProto, setupGeometryLogicState, GeometryLogic, type GeometryLogicState } from './Geometry';
import { computed, createLogicProto, reactive, registerLogic, type Computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module './Geometry'
{
    export interface GeometryMap
    {
        SegmentGeometry: SegmentGeometry;
    }
}

/**
 * 线段
 */
export interface Segment
{
    /** 起点坐标 */
    readonly start: Vector3Like;
    /** 终点坐标 */
    readonly end: Vector3Like;
    /** 起点颜色 */
    readonly startColor: Color4;
    /** 终点颜色 */
    readonly endColor: Color4;
}

/**
 * 创建线段数据。
 */
export function createSegment(): Segment
{
    return {
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 0 },
        startColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        endColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    };
}

/**
 * 线段几何体（纯数据接口）。
 *
 * 通过 {@link segments} 列表声明线段，SegmentGeometryLogic 用 computed 按 segments 懒生成
 * positions/colors/indices。
 */
export interface SegmentGeometry extends Geometry
{
    readonly __type__: 'SegmentGeometry';
    /** 线段列表 */
    readonly segments: Segment[];
}

/**
 * SegmentGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，用 computed 按 segments 懒生成
 * positions/colors/indices。segments 变化时 computed 自动失效重算。
 */
export interface SegmentGeometryLogic extends GeometryLogic
{
}

/** SegmentGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface SegmentGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** SegmentGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const segmentGeometryLogicProto = createLogicProto<SegmentGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: SegmentGeometryLogic & SegmentGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: SegmentGeometryLogic & SegmentGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

/**
 * 工厂函数：SegmentGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function segmentGeometryLogic(data: SegmentGeometry): SegmentGeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const segments = (): Segment[] => reactive(data).segments ?? [];

    function buildPositions(): Float32Array
    {
        const numSegments = Math.max(1, segments().length);
        const data: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            const element = segments()[i];
            const start = (element && element.start) || { x: 0, y: 0, z: 0 };
            const end = (element && element.end) || { x: 0, y: 0, z: 0 };
            data.push(start.x, start.y, start.z, end.x, end.y, end.z);
        }

        return new Float32Array(data);
    }

    function buildColors(): Float32Array
    {
        const numSegments = Math.max(1, segments().length);
        const data: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            const element = segments()[i];
            // 阶段 C-b 起 math 的 `Color4` class 已删除，缺省值按纯数据形态在装配点写字面量
            // （等于原 `new Color4()` 的默认值：白色不透明）
            const startColor: Color4 = (element && element.startColor) || { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
            const endColor: Color4 = (element && element.endColor) || { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
            data.push(startColor.r ?? 0, startColor.g ?? 0, startColor.b ?? 0, startColor.a ?? 0,
                endColor.r ?? 0, endColor.g ?? 0, endColor.b ?? 0, endColor.a ?? 0);
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        const numSegments = Math.max(1, segments().length);
        const indices: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            indices.push(i * 2, i * 2 + 1);
        }

        return indices;
    }

    const positions = computed(() => buildPositions());
    const colors = computed(() => buildColors());
    const indicesComputed = computed(() => buildIndices());

    const logic = setupGeometryLogicState(Object.create(segmentGeometryLogicProto) as SegmentGeometryLogic & SegmentGeometryLogicState, data);
    logic._attrTable = {
        a_position: computedAttr(positions, 'float32x3'),
        a_color: computedAttr(colors, 'float32x4'),
        a_uv: { data: new Float32Array(), format: 'float32x2' },
        a_normal: { data: new Float32Array(), format: 'float32x3' },
        a_tangent: { data: new Float32Array(), format: 'float32x3' },
    };
    logic._indicesComputed = indicesComputed;

    return logic;
}
registerLogic('SegmentGeometry', segmentGeometryLogic);
